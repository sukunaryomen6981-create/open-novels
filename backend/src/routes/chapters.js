import express from 'express';
import { store } from '../config/store.js';
import { authRequired, authOptional, verifiedOnly } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/security.js';

const router = express.Router();

// Published chapters are public. Drafts are strictly author-or-admin:
// the old `?draft=1` shortcut leaked unpublished work to strangers.
router.get('/:id', authOptional, async (req, res, next) => {
  try {
    const ch = await store.getChapter(req.params.id);
    if (!ch) return res.status(404).json({ error: 'Chapter not found' });
    if (ch.status !== 'published') {
      if (!req.user) return res.status(401).json({ error: 'Login required to preview drafts' });
      const novel = await store.getNovel(ch.novelId?.toString?.() ?? ch.novelId);
      const owner = novel?.authorId?.toString?.() ?? novel?.authorId;
      if (owner !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Draft — only its author can preview it' });
      }
    }
    res.json(ch);
  } catch (e) { next(e); }
});

// Publish a chapter to your own story
router.post('/', authRequired, verifiedOnly, writeLimiter, async (req, res, next) => {
  try {
    const { novelId, number, title, content, status } = req.body;
    if (!novelId || number == null) return res.status(400).json({ error: 'novelId and number required' });
    if (content && content.length > 500000) return res.status(413).json({ error: 'Chapter too large (500KB max)' });
    const novel = await store.getNovel(novelId);
    if (!novel) return res.status(404).json({ error: 'Story not found' });
    const isOwner = (novel.authorId?.toString?.() ?? novel.authorId) === req.user.id;
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Only the author can add chapters' });
    const ch = await store.createChapter(novel._id || novel.id, { number: Number(number), title: title || '', content: content || '', status: status || 'published', publishedAt: new Date() });
    res.status(201).json(ch);
  } catch (e) {
    if (e.code === 11000 || e.status === 409) return res.status(409).json({ error: 'Chapter number already exists for this story' });
    next(e);
  }
});

// Edit chapter (author only). Same mass-assignment guard as stories:
// only title/content/status are editable, never novelId or ownership.
router.patch('/:id', authRequired, writeLimiter, async (req, res, next) => {
  try {
    const ch = await store.getChapter(req.params.id);
    if (!ch) return res.status(404).json({ error: 'Not found' });
    const novel = await store.getNovel(ch.novelId?.toString?.() ?? ch.novelId);
    const isOwner = (novel?.authorId?.toString?.() ?? novel?.authorId) === req.user.id;
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ error: 'Only the author' });
    const patch = {};
    for (const k of ['title', 'content', 'status']) if (req.body[k] !== undefined) patch[k] = req.body[k];
    if (patch.content && patch.content.length > 500000) return res.status(413).json({ error: 'Chapter too large (500KB max)' });
    const updated = await store.updateChapter(ch._id || ch.id, patch, novel);
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
