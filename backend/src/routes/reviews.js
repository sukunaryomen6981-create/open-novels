import express from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { store, useDb, memReviews, setNovelRating } from '../config/store.js';
import { authRequired, authOptional } from '../middleware/auth.js';
import { verifiedOnly } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/security.js';

const router = express.Router();

async function recalc(novelId) {
  if (useDb()) {
    const agg = await Review.aggregate([
      { $match: { novelId: new mongoose.Types.ObjectId(novelId) } },
      { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);
    const { avg = 0, count = 0 } = agg[0] || {};
    await setNovelRating(novelId, Math.round(avg * 10) / 10, count);
    return;
  }
  const list = memReviews.filter((r) => String(r.novelId) === String(novelId));
  const avg = list.length ? list.reduce((a, r) => a + r.score, 0) / list.length : 0;
  await setNovelRating(novelId, Math.round(avg * 10) / 10, list.length);
}

const apiReview = (r) => ({
  id: r._id, userId: r.userId, novelId: r.novelId,
  penName: r.penName || 'Reader', avatar: r.avatar || '',
  score: r.score, text: r.text || '',
  createdAt: r.createdAt, updatedAt: r.updatedAt
});

// Public: newest-first reviews for a story (+ your own, if logged in).
router.get('/novels/:novelId/reviews', authOptional, async (req, res, next) => {
  try {
    // Resolve first: garbage ids 500'd the query, and missing stories
    // deserve a 404 rather than an empty list.
    const novel = await store.getNovel(req.params.novelId);
    if (!novel) return res.status(404).json({ error: 'Story not found' });
    const nid = novel._id || novel.id;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    let items, mine = null;
    if (useDb()) {
      const docs = await Review.find({ novelId: nid }).sort({ createdAt: -1 }).limit(limit).lean();
      items = docs.map(apiReview);
      if (req.user) {
        const m = await Review.findOne({ novelId: nid, userId: req.user.id }).lean();
        if (m) mine = apiReview(m);
      }
    } else {
      items = memReviews
        .filter((r) => String(r.novelId) === String(nid))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit).map(apiReview);
      if (req.user) {
        const m = memReviews.find((r) => String(r.novelId) === String(nid) && String(r.userId) === String(req.user.id));
        if (m) mine = apiReview(m);
      }
    }
    res.json({ items, mine });
  } catch (e) { next(e); }
});

// Rate + review (upsert: resubmitting updates your existing rating).
// Verified accounts only — ratings from throwaway accounts are spam.
router.post('/novels/:novelId/reviews', authRequired, verifiedOnly, writeLimiter, async (req, res, next) => {
  try {
    const score = Number(req.body.score);
    const text = String(req.body.text || '').slice(0, 2000);
    if (!Number.isInteger(score) || score < 1 || score > 10) {
      return res.status(400).json({ error: 'Score must be a whole number from 1 to 10' });
    }
    const novel = await store.getNovel(req.params.novelId);
    if (!novel) return res.status(404).json({ error: 'Story not found' });
    const nid = novel._id || novel.id;
    let me;
    if (useDb()) {
      me = await User.findById(req.user.id).lean();
      if (!me) return res.status(404).json({ error: 'Not found' });
    } else {
      const { memUsers } = await import('../config/store.js');
      me = memUsers.find((u) => u._id === req.user.id);
      if (!me) return res.status(404).json({ error: 'Not found' });
    }
    const fresh = { penName: me.penName || me.username, avatar: me.avatar || '', score, text };
    let review, created = false;
    if (useDb()) {
      review = await Review.findOneAndUpdate(
        { novelId: nid, userId: req.user.id },
        { ...fresh, userId: req.user.id, novelId: nid },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      created = review.createdAt.getTime() === review.updatedAt.getTime();
    } else {
      review = memReviews.find((r) => String(r.novelId) === String(nid) && String(r.userId) === String(req.user.id));
      if (review) Object.assign(review, fresh, { updatedAt: new Date() });
      else {
        review = { _id: `r${Date.now()}`, id: `r${Date.now()}`, userId: req.user.id, novelId: nid, ...fresh, createdAt: new Date(), updatedAt: new Date() };
        review.id = review._id;
        memReviews.push(review);
        created = true;
      }
    }
    await recalc(nid);
    res.status(created ? 201 : 200).json(apiReview(review.toObject ? review.toObject() : review));
  } catch (e) { next(e); }
});

async function ownOrAdmin(req, res) {
  let review;
  if (useDb()) {
    if (!mongoose.isValidObjectId(req.params.id)) return { error: 404 };
    review = await Review.findById(req.params.id);
  } else {
    review = memReviews.find((r) => r._id === req.params.id);
  }
  if (!review) return { error: 404 };
  const owner = review.userId?.toString?.() ?? review.userId;
  if (owner !== req.user.id && req.user.role !== 'admin') return { error: 403 };
  return { review };
}

// Edit your review (or any, as admin).
router.patch('/reviews/:id', authRequired, writeLimiter, async (req, res, next) => {
  try {
    const { review, error } = await ownOrAdmin(req, res);
    if (error) return res.status(error).json({ error: error === 404 ? 'Not found' : 'Not yours to edit' });
    if (req.body.score !== undefined) {
      const score = Number(req.body.score);
      if (!Number.isInteger(score) || score < 1 || score > 10) return res.status(400).json({ error: 'Score must be 1–10' });
      review.score = score;
    }
    if (req.body.text !== undefined) review.text = String(req.body.text).slice(0, 2000);
    review.updatedAt = new Date();
    if (useDb()) await review.save();
    await recalc(review.novelId?.toString?.() ?? review.novelId);
    res.json(apiReview(review.toObject ? review.toObject() : review));
  } catch (e) { next(e); }
});

// Delete your review (or any, as admin).
router.delete('/reviews/:id', authRequired, async (req, res, next) => {
  try {
    const { review, error } = await ownOrAdmin(req, res);
    if (error) return res.status(error).json({ error: error === 404 ? 'Not found' : 'Not yours to delete' });
    const novelId = review.novelId?.toString?.() ?? review.novelId;
    if (useDb()) await review.deleteOne();
    else {
      const i = memReviews.findIndex((r) => r._id === review._id);
      if (i >= 0) memReviews.splice(i, 1);
    }
    await recalc(novelId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
