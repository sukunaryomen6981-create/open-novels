import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { useDb, memUsers, memProgress, store } from '../config/store.js';
import { User } from '../models/User.js';
import { ReadingProgress } from '../models/ReadingProgress.js';

const router = express.Router();

// Library (bookmarks)
router.get('/library', authRequired, async (req, res, next) => {
  try {
    if (useDb()) {
      const u = await User.findById(req.user.id).populate('library').lean();
      return res.json(u?.library || []);
    }
    const u = memUsers.find((x) => x._id === req.user.id);
    const items = [];
    for (const id of (u?.library || [])) { const n = await store.getNovel(id); if (n) items.push(n); }
    res.json(items);
  } catch (e) { next(e); }
});

router.post('/library/:novelId', authRequired, async (req, res, next) => {
  try {
    if (useDb()) await User.findByIdAndUpdate(req.user.id, { $addToSet: { library: req.params.novelId } });
    else { const u = memUsers.find((x) => x._id === req.user.id); if (u && !u.library.includes(req.params.novelId)) u.library.push(req.params.novelId); }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/library/:novelId', authRequired, async (req, res, next) => {
  try {
    if (useDb()) await User.findByIdAndUpdate(req.user.id, { $pull: { library: req.params.novelId } });
    else { const u = memUsers.find((x) => x._id === req.user.id); if (u) u.library = u.library.filter((x) => x !== req.params.novelId); }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Progress
router.post('/progress', authRequired, async (req, res, next) => {
  try {
    const { novelId, chapterId, percent } = req.body;
    if (!novelId || !chapterId) return res.status(400).json({ error: 'novelId and chapterId required' });
    if (useDb()) {
      const doc = await ReadingProgress.findOneAndUpdate({ userId: req.user.id, novelId }, { chapterId, percent: percent || 0 }, { upsert: true, new: true });
      return res.json(doc);
    }
    const key = `${req.user.id}:${novelId}`;
    const rec = { key, userId: req.user.id, novelId, chapterId, percent: percent || 0, updatedAt: new Date() };
    const ex = memProgress.find((p) => p.key === key);
    if (ex) Object.assign(ex, rec); else memProgress.push(rec);
    res.json(rec);
  } catch (e) { next(e); }
});

router.get('/progress/:novelId', authRequired, async (req, res, next) => {
  try {
    if (useDb()) return res.json(await ReadingProgress.findOne({ userId: req.user.id, novelId: req.params.novelId }).lean());
    res.json(memProgress.find((p) => p.userId === req.user.id && p.novelId === req.params.novelId) || null);
  } catch (e) { next(e); }
});

router.get('/progress', authRequired, async (req, res, next) => {
  try {
    if (useDb()) return res.json(await ReadingProgress.find({ userId: req.user.id }).sort({ updatedAt: -1 }).limit(20).lean());
    res.json(memProgress.filter((p) => p.userId === req.user.id).slice(-20).reverse());
  } catch (e) { next(e); }
});

export default router;
