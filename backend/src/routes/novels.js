import express from 'express';
import { store } from '../config/store.js';
import { authRequired, authOptional, adminOnly, verifiedOnly } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/security.js';
import { slugify } from '../utils/helpers.js';

// Covers are either https:// image links (uploads live on free external
// hosts — Render's free disk wipes local files) or generated SVG data URIs.
const coverOk = (u) => !u || /^https?:\/\//i.test(u) || /^data:image\/svg\+xml/i.test(u);

const router = express.Router();

// Public: list + detail + chapters
router.get('/', async (req, res, next) => {
  try {
    const { q, genre, tag, status, sort, page, limit, mine } = req.query;
    const authorId = mine === '1' && req.user ? req.user.id : undefined;
    const r = await store.listNovels({ q, genre, tag, status, sort, authorId, page: Math.max(1, parseInt(page) || 1), limit: Math.min(60, parseInt(limit) || 18) });
    res.json({ ...r, page: parseInt(page) || 1 });
  } catch (e) { next(e); }
});

router.get('/:slug', authOptional, async (req, res, next) => {
  try {
    const novel = await store.getNovel(req.params.slug);
    if (!novel) return res.status(404).json({ error: 'Story not found' });
    res.json(novel);
  } catch (e) { next(e); }
});

router.get('/:id/chapters', async (req, res, next) => {
  try {
    const novel = await store.getNovel(req.params.id);
    if (!novel) return res.status(404).json({ error: 'Story not found' });
    const chs = await store.chaptersFor(novel._id || novel.id, { order: req.query.order === 'desc' ? 'desc' : 'asc' });
    res.json(chs);
  } catch (e) { next(e); }
});

// Create a story — any logged-in user is an author
router.post('/', authRequired, verifiedOnly, writeLimiter, async (req, res, next) => {
  try {
    const { title, synopsis, genres, tags, language, status, coverImage, license } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (title.length > 150) return res.status(400).json({ error: 'Title too long (150 max)' });
    if (synopsis && synopsis.length > 10000) return res.status(413).json({ error: 'Synopsis too long' });
    if (coverImage && coverImage.length > 2000) return res.status(400).json({ error: 'Cover URL too long' });
    if (!coverOk(coverImage)) return res.status(400).json({ error: 'Cover must be an https:// image link or a generated cover' });
    const novel = await store.createNovel({
      title: title.trim(), slug: slugify(title), synopsis: synopsis || '',
      authorId: req.user.id, authorName: String(req.body.authorName || 'Anonymous').slice(0, 60),
      genres: Array.isArray(genres) ? genres.slice(0, 8).map(String) : [],
      tags: Array.isArray(tags) ? tags.slice(0, 12).map(String) : [],
      language: String(language || 'English').slice(0, 40),
      status: ['Ongoing', 'Completed', 'Hiatus'].includes(status) ? status : 'Ongoing',
      coverImage: coverImage || '', license: license || 'CC-BY'
    });
    res.status(201).json(novel);
  } catch (e) { next(e); }
});

// Edit own story (or admin). Debug fix: the old code passed the entire
// request body through, so anyone could overwrite authorId, views, rating
// or featured on any story. Only whitelisted fields are editable.
const EDITABLE_NOVEL_FIELDS = ['title', 'synopsis', 'genres', 'tags', 'language', 'status', 'coverImage', 'license', 'authorName'];
router.patch('/:id', authRequired, writeLimiter, async (req, res, next) => {
  try {
    const patch = {};
    for (const k of EDITABLE_NOVEL_FIELDS) if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (patch.title && patch.title.length > 150) return res.status(400).json({ error: 'Title too long' });
    if (patch.synopsis && patch.synopsis.length > 10000) return res.status(413).json({ error: 'Synopsis too long' });
    if (patch.coverImage !== undefined && !coverOk(patch.coverImage)) return res.status(400).json({ error: 'Cover must be an https:// image link or a generated cover' });
    const r = await store.updateNovel(req.params.id, patch, req.user.id, req.user.role === 'admin');
    if (r === 'forbidden') return res.status(403).json({ error: 'Only the author can edit this story' });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch (e) { next(e); }
});

// Feature (admin)
router.post('/:id/feature', authRequired, adminOnly, async (req, res, next) => {
  try {
    const r = await store.updateNovel(req.params.id, { featured: req.body.featured !== false }, null, true);
    res.json(r);
  } catch (e) { next(e); }
});

export default router;
