import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { safeGet } from '../services/api.js';
import { GENRES, GENRE_EMOJI } from '../services/mockData.js';
import { toast, VerifyBanner, ImageUploadButton } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { BecomeAuthor } from './misc.jsx';
import { currentContest } from './discover.jsx';
import { makeCover, COVER_STYLES } from '../services/cover.js';

// Write hub: create a story, manage your stories, add chapters.
export function Write() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [mine, setMine] = useState([]);
  const [form, setForm] = useState({ title: '', synopsis: '', genres: 'Fantasy', tags: '', language: 'English', license: 'CC-BY', authorName: '' });
  const [coverMode, setCoverMode] = useState('auto');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverStyle, setCoverStyle] = useState(0);
  const firstGenre = (form.genres.split(',').map((s) => s.trim()).filter(Boolean)[0]) || 'Fantasy';
  const previewSrc = coverMode === 'url' ? coverUrl.trim() : makeCover(form.title.trim() || 'Untitled', firstGenre, coverStyle);

  const load = async () => {
    if (!localStorage.getItem('token')) {
      setMine(JSON.parse(localStorage.getItem('my-stories') || '[]'));
      return;
    }
    const { data } = await api.get('/novels', { params: { mine: '1', limit: 60 } }).catch(() => ({ data: { items: [] } }));
    setMine(data.items || []);
  };
  useEffect(() => { load(); }, []);

  if (!user) return <div className="py-10">Please <Link to="/login" className="text-accent">login</Link> to publish — it takes 20 seconds and it's free.</div>;
  if (!user.isAuthor && !user.guest) return <div className="py-6 max-w-3xl"><Link to="/profile" className="text-sm text-accent">← Back to profile</Link><BecomeAuthor /></div>;

  const create = async (e) => {
    e.preventDefault();
    let coverImage = '';
    if (coverMode === 'url') {
      if (!/^https?:\/\/.+/i.test(coverUrl.trim())) { toast('Cover link must start with http(s)://'); return; }
      coverImage = coverUrl.trim();
    } else {
      coverImage = makeCover(form.title.trim() || 'Untitled', firstGenre, coverStyle);
    }
    const payload = {
      title: form.title, synopsis: form.synopsis,
      genres: form.genres.split(',').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      coverImage,
      language: form.language, license: form.license,
      authorName: form.authorName || user.penName || user.username
    };
    try {
      const { data } = await api.post('/novels', payload);
      toast('Story created! Now add chapter 1.');
      nav(`/write/${data.slug || data._id || data.id}`);
    } catch (er) {
      if (er.response?.data?.code === 'UNVERIFIED') { toast('Verify your email first — link sent at signup'); return; }
      // offline demo: store locally
      const local = { ...payload, slug: `local-${Date.now()}`, id: `local-${Date.now()}`, _id: `local-${Date.now()}`, status: 'Ongoing', coverImage: '', chaptersCount: 0 };
      const all = [local, ...JSON.parse(localStorage.getItem('my-stories') || '[]')];
      localStorage.setItem('my-stories', JSON.stringify(all));
      setMine(all);
      toast('Saved locally (backend offline)');
      nav(`/write/${local.slug}`);
    }
  };

  return (
    <div className="py-6 max-w-3xl">
      <h1 className="text-2xl font-black">✍️ Write a new story</h1>
      <p className="text-sm text-zinc-400 mt-1">You own what you write. Publishing here is free under the license you choose (CC-BY recommended).</p>
      <div className="mt-3"><VerifyBanner /></div>
      <form onSubmit={create} className="mt-4 grid gap-2">
        <input className="input" placeholder="Story title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="input" placeholder="Pen name to display" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
        <textarea className="input" rows={4} placeholder="Synopsis — hook your readers in 2-3 sentences" value={form.synopsis} onChange={(e) => setForm({ ...form, synopsis: e.target.value })} />
        <div className="grid md:grid-cols-3 gap-2">
          <input className="input" placeholder="Genres (comma separated)" value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} list="genre-list" />
          <datalist id="genre-list">{GENRES.map((g) => <option key={g} value={g} label={`${GENRE_EMOJI[g]} ${g}`} />)}</datalist>
          <input className="input" placeholder="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
          <select className="input" value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })}>
            <option value="CC-BY">CC-BY (recommended)</option><option value="CC-BY-SA">CC-BY-SA</option>
            <option value="CC0">CC0 (public domain)</option><option value="All-rights-reserved">All rights reserved</option>
          </select>
        </div>
        <input className="input" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <p className="text-xs text-paper/50">Entering the <Link to="/contests" className="text-brass">weekly contest</Link>? Add this week’s tag: <code className="text-brass">{currentContest().tag}</code></p>
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="font-bold text-sm">Cover art</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <button type="button" onClick={() => setCoverMode('auto')} className={`btn !py-1.5 text-sm ${coverMode === 'auto' ? 'btn-primary' : 'btn-ghost'}`}>✨ Auto-generate</button>
            <button type="button" onClick={() => setCoverMode('url')} className={`btn !py-1.5 text-sm ${coverMode === 'url' ? 'btn-primary' : 'btn-ghost'}`}>🔗 Image link</button>
            <ImageUploadButton label="📁 Upload from device" onDone={(u) => { setCoverUrl(u); setCoverMode('url'); }} />
          </div>
          <div className="flex gap-3 mt-3 items-start">
            <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
              {previewSrc ? <img src={previewSrc} alt="Cover preview" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-2xl">📖</div>}
            </div>
            <div className="flex-1 min-w-0">
              {coverMode === 'url' ? (
                <><input className="input" placeholder="https://… direct image link" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
                <p className="text-xs text-paper/50 mt-1.5">Free hosts: imgur.com, postimages.org, catbox.moe — upload there, paste the link. (This site can’t store uploads: free hosting wipes files.)</p></>
              ) : (
                <><div className="flex gap-2 flex-wrap">{COVER_STYLES.map((s, i) => (
                  <button type="button" key={i} title={`Style ${i + 1}`} onClick={() => setCoverStyle(i)}
                    className={`h-9 w-9 rounded-lg border-2 transition ${i === coverStyle ? '!border-brass' : 'border-white/20'}`}
                    style={{ background: `linear-gradient(135deg, ${s.bg1}, ${s.bg2})` }}><span style={{ color: s.fg }}>✒</span></button>))}</div>
                <p className="text-xs text-paper/50 mt-2">Built live from your title — yours forever, no art skills needed. Updates as you type.</p></>
              )}
            </div>
          </div>
        </div>
        <button className="btn-primary w-fit">Create story →</button>
      </form>
      <h2 className="mt-8 font-bold">My stories ({mine.length})</h2>
      <div className="mt-2 space-y-2">
        {mine.map((n) => (
          <Link key={n.slug || n._id || n.id} to={`/write/${n.slug || n._id || n.id}`} className="block rounded-xl border border-white/10 bg-panel px-4 py-3 hover:border-accent">
            <b>{n.title}</b> <span className="text-xs text-zinc-400 ml-2">{n.status} · Manage chapters →</span>
          </Link>))}
        {mine.length === 0 && <p className="text-sm text-zinc-500">Nothing yet — your first story starts above.</p>}
      </div>
    </div>
  );
}

export function ManageStory() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [draft, setDraft] = useState({ number: 1, title: '', content: '', status: 'published' });
  const [coverUrl, setCoverUrl] = useState('');
  const [coverMsg, setCoverMsg] = useState('');

  const load = async () => {
    let n = await safeGet(api.get(`/novels/${slug}`), null);
    if (!n) { try { n = JSON.parse(localStorage.getItem('my-stories') || '[]').find((x) => x.slug === slug || x._id === slug || x.id === slug); } catch {} }
    if (!n) { setNovel(false); return; }
    setNovel(n);
    const mid = n?._id || n?.id || slug;
    const chs = await safeGet(api.get(`/novels/${mid}/chapters`, { params: { order: 'asc' } }), []);
    setChapters(chs);
    setDraft((d) => ({ ...d, number: (chs.length || 0) + 1 }));
  };
  useEffect(() => { load(); }, [slug]);

  const publish = async (e) => {
    e.preventDefault();
    if (!draft.content.trim()) { toast('Write some content first'); return; }
    try {
      await api.post('/chapters', { novelId: novel._id || novel.id, ...draft, number: Number(draft.number) });
      toast(`Chapter ${draft.number} published!`);
    } catch (er) {
      if (er.response?.data?.code === 'UNVERIFIED') { toast('Verify your email first — link sent at signup'); return; }
      toast('Backend offline — chapter kept in editor (copy it safe!)');
      return;
    }
    setDraft({ number: draft.number + 1, title: '', content: '', status: 'published' });
    load();
  };

  const saveCover = async (e) => {
    e.preventDefault(); setCoverMsg('');
    const v = coverUrl.trim();
    if (v && !/^https?:\/\//i.test(v) && !/^data:image\/svg\+xml/i.test(v)) { setCoverMsg('Cover must be an https:// image link.'); return; }
    try {
      const { data } = await api.patch(`/novels/${novel._id || novel.id}`, { coverImage: v });
      setNovel(data); setCoverUrl(''); setCoverMsg(v ? 'Cover updated ✓' : 'Cover cleared — auto art restored on next view.');
      toast('Cover updated');
    } catch { setCoverMsg('Could not save (backend offline?)'); }
  };

  if (!user) return <div className="py-10">Please <Link to="/login" className="text-accent">login</Link> to manage stories.</div>;
  if (!user.isAuthor && !user.guest) return <div className="py-6 max-w-3xl"><Link to="/profile" className="text-sm text-accent">← Back to profile</Link><BecomeAuthor /></div>;
  if (novel === false) return <div className="py-16 text-center"><p className="text-xl font-bold">Story not found</p><Link to="/write" className="text-accent text-sm">← Back to my stories</Link></div>;
  if (!novel) return <div className="py-10">Loading…</div>;
  // Ownership gate: anyone could open /write/someone-elses-slug and SEE the
  // editor (writes were already 403'd server-side, but it looked editable).
  // Admins keep access for moderation; local offline drafts are always yours.
  const nid = String(novel._id || novel.id || '');
  const isLocal = nid.startsWith('local-');
  const ownerId = novel.authorId?.toString?.() ?? novel.authorId;
  const canManage = isLocal || (user && (ownerId === user.id || user.role === 'admin'));
  if (!canManage) return (
    <div className="py-16 text-center max-w-md mx-auto">
      <p className="text-4xl">🔒</p>
      <h1 className="font-display font-semibold text-2xl mt-3">Only the author can manage this story</h1>
      <p className="text-paper/60 text-sm mt-2">This shelf belongs to {novel.authorName || 'another author'}. (Site admins can open any story for moderation.)</p>
      <div className="flex gap-2 justify-center mt-5">
        <Link to={`/novels/${novel.slug}`} className="btn-primary">Read it instead →</Link>
        <Link to="/write" className="btn-ghost btn">My stories</Link>
      </div>
    </div>
  );
  const words = draft.content.split(/\s+/).filter(Boolean).length;
  return (
    <div className="py-6 max-w-3xl">
      <Link to="/write" className="text-sm text-accent">← My stories</Link>
      <h1 className="text-2xl font-black mt-1">{novel.title}</h1>
      <p className="text-xs text-zinc-500">{chapters.length} chapters published</p>
      <div className="mt-3 space-y-2">
        {chapters.map((c) => (
          <div key={c._id || c.id} className="flex justify-between rounded-xl border border-white/10 bg-panel px-4 py-2 text-sm">
            <span><b>Ch {c.number}</b> {c.title}</span>
            <Link to={`/read/${novel.slug}/${c._id || c.id}`} className="text-accent">Preview →</Link>
          </div>))}
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 p-4 flex gap-3 items-start">
        <div className="w-16 aspect-[2/3] rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/10">
          {novel.coverImage ? <img src={novel.coverImage} alt="Current cover" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center">📖</div>}
        </div>
        <form onSubmit={saveCover} className="flex-1 grid gap-2">
          <p className="font-bold text-sm">Cover art</p>
          <input className="input" placeholder="New https:// image link (blank = keep)" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-ghost btn !py-1.5 text-sm">Save cover</button>
            <ImageUploadButton label="📁 Upload" onDone={(u) => setCoverUrl(u)} />
            {coverMsg && <span className="text-xs text-paper/60">{coverMsg}</span>}
          </div>
        </form>
      </div>
      <h2 className="mt-8 font-bold">Write chapter {draft.number}</h2>
      <form onSubmit={publish} className="mt-2 grid gap-2">
        <div className="grid md:grid-cols-[100px_1fr_160px] gap-2">
          <input className="input" type="number" min={1} value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} />
          <input className="input" placeholder="Chapter title (optional)" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <select className="input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}><option value="published">Publish</option><option value="draft">Draft</option></select>
        </div>
        <textarea className="input font-serif" rows={16} placeholder="Once upon a time… (blank lines = new paragraphs. Autosave is manual — copy long drafts to your notes app!)" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
        <div className="flex items-center gap-3">
          <button className="btn-primary">Publish chapter</button>
          <span className="text-xs text-zinc-500">{words.toLocaleString()} words · ~{Math.max(1, Math.round(words / 200))} min read</span>
        </div>
      </form>
    </div>
  );
}
