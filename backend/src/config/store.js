import mongoose from 'mongoose';
import { Novel } from '../models/Novel.js';
import { Chapter } from '../models/Chapter.js';
// In-memory fallback mirrors the Mongo API so the app runs with zero setup.
// Starts empty: every story is created by users, nothing is preloaded.
const mem = {
  novels: [],
  chapters: [],
  users: [], progress: [], reviews: []
};

export const useDb = () => mongoose.connection.readyState === 1;
export const memUsers = mem.users;
export const memProgress = mem.progress;
export const memReviews = mem.reviews;

// Recomputes a novel's displayed score from its reviews (single source of
// truth — rating/ratingsCount are never written directly by clients).
export async function setNovelRating(novelId, rating, count) {
  if (useDb()) {
    const { Novel: NovelModel } = await import('../models/Novel.js');
    await NovelModel.findByIdAndUpdate(novelId, { rating, ratingsCount: count });
    return;
  }
  const n = mem.novels.find((x) => String(x._id) === String(novelId) || String(x.id) === String(novelId));
  if (n) { n.rating = rating; n.ratingsCount = count; n.updatedAt = new Date(); }
}

export const store = {
  async listNovels({ q, genre, tag, status, sort = 'updated', page = 1, limit = 18, authorId } = {}) {
    if (useDb()) {
      const f = {};
      if (status) f.status = status;
      if (genre) f.genres = genre;
      if (tag) f.tags = tag;
      if (authorId) f.authorId = authorId;
      if (q) f.$text = { $search: q };
      const sorts = { popular: { views: -1 }, updated: { updatedAt: -1 }, newest: { createdAt: -1 }, rating: { rating: -1 }, alpha: { title: 1 } };
      const [items, total] = await Promise.all([
        Novel.find(f).sort(sorts[sort] || sorts.updated).skip((page - 1) * limit).limit(limit).lean(),
        Novel.countDocuments(f)
      ]);
      return { items: items.map((m) => ({ ...m, id: m._id })), total };
    }
    let items = [...mem.novels];
    if (authorId) items = items.filter((n) => n.authorId === authorId);
    if (q) { const s = q.toLowerCase(); items = items.filter((n) => `${n.title} ${n.synopsis} ${n.authorName} ${n.genres.join(' ')}`.toLowerCase().includes(s)); }
    if (genre) items = items.filter((n) => n.genres.includes(genre));
    if (tag) items = items.filter((n) => (n.tags || []).includes(tag));
    if (status) items = items.filter((n) => n.status === status);
    const sorters = { popular: (a, b) => b.views - a.views, updated: (a, b) => b.updatedAt - a.updatedAt, newest: (a, b) => b.createdAt - a.createdAt, rating: (a, b) => b.rating - a.rating, alpha: (a, b) => a.title.localeCompare(b.title) };
    items.sort(sorters[sort] || sorters.updated);
    return { items: items.slice((page - 1) * limit, page * limit).map((n) => ({ ...n, chaptersCount: mem.chapters.filter((c) => c.novelId === n._id && c.status === 'published').length })), total: items.length };
  },

  async getNovel(slugOrId) {
    if (useDb()) {
      const n = await Novel.findOne({ $or: [{ slug: slugOrId }, ...(mongoose.isValidObjectId(slugOrId) ? [{ _id: slugOrId }] : [])] }).lean();
      if (!n) return null;
      const count = await Chapter.countDocuments({ novelId: n._id, status: 'published' });
      return { ...n, id: n._id, chaptersCount: count };
    }
    const n = mem.novels.find((x) => x.slug === slugOrId || x._id === slugOrId);
    if (!n) return null;
    return { ...n, chaptersCount: mem.chapters.filter((c) => c.novelId === n._id && c.status === 'published').length };
  },

  async chaptersFor(novelId, { publishedOnly = true, order = 'asc' } = {}) {
    if (useDb()) {
      const f = { novelId };
      if (publishedOnly) f.status = 'published';
      const items = await Chapter.find(f).sort({ number: order === 'desc' ? -1 : 1 }).lean();
      return items.map((c) => ({ ...c, id: c._id, content: undefined, contentPreview: undefined }));
    }
    return mem.chapters.filter((c) => c.novelId === novelId && (!publishedOnly || c.status === 'published'))
      .sort((a, b) => order === 'desc' ? b.number - a.number : a.number - b.number)
      .map(({ content, ...c }) => ({ ...c, words: c.wordCount }));
  },

  async getChapter(id, includeContent = true) {
    if (useDb()) {
      if (!mongoose.isValidObjectId(id)) return null;
      const c = await Chapter.findById(id).lean();
      return c ? { ...c, id: c._id } : null;
    }
    const c = mem.chapters.find((x) => x._id === id);
    return c ? { ...c } : null;
  },

  async createNovel(data) {
    // Debug fix: two stories with the same title produced the same slug and
    // crashed with a raw 500 duplicate-key error. Suffix until unique.
    const base = data.slug;
    const taken = async (s) => useDb()
      ? !!(await Novel.exists({ slug: s }))
      : mem.novels.some((n) => n.slug === s);
    let slug = base; let i = 2;
    while (await taken(slug)) slug = `${base}-${i++}`;
    data = { ...data, slug };
    if (useDb()) { const n = await Novel.create(data); return { ...n.toObject(), id: n._id }; }
    const n = { ...data, _id: `n${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), views: 0, rating: 0, ratingsCount: 0 };
    n.id = n._id; mem.novels.push(n); return n;
  },

  async updateNovel(id, data, authorId, isAdmin) {
    if (useDb()) {
      const n = await Novel.findById(id);
      if (!n) return null;
      if (!isAdmin && n.authorId?.toString() !== authorId) return 'forbidden';
      Object.assign(n, data); await n.save(); return { ...n.toObject(), id: n._id };
    }
    const n = mem.novels.find((x) => x._id === id);
    if (!n) return null;
    if (!isAdmin && n.authorId !== authorId) return 'forbidden';
    Object.assign(n, data, { updatedAt: new Date() }); return n;
  },

  async createChapter(novelId, data) {
    // Debug fix: the in-memory store never enforced the unique
    // (novelId, number) index, so duplicate chapter numbers were possible.
    const num = Number(data.number);
    const dup = useDb()
      ? await Chapter.exists({ novelId, number: num })
      : mem.chapters.some((c) => c.novelId === novelId && Number(c.number) === num);
    if (dup) throw Object.assign(new Error('Chapter number already exists'), { status: 409 });
    if (useDb()) { const c = await Chapter.create({ novelId, ...data }); return { ...c.toObject(), id: c._id }; }
    const c = { ...data, _id: `c${Date.now()}`, novelId, wordCount: (data.content || '').split(/\s+/).length };
    c.id = c._id; mem.chapters.push(c); return c;
  },

  async updateChapter(id, data, novel) {
    if (useDb()) {
      const c = await Chapter.findById(id);
      if (!c) return null;
      Object.assign(c, data); await c.save(); return { ...c.toObject(), id: c._id };
    }
    const c = mem.chapters.find((x) => x._id === id);
    if (!c) return null;
    Object.assign(c, data); return c;
  }
};
