import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api, { safeGet } from '../services/api.js';

export default function Reader() {
  const { novelSlug, chapterId } = useParams();
  const nav = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [novel, setNovel] = useState(null);
  const [font, setFont] = useState(() => parseInt(localStorage.getItem('font') || '18'));
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    (async () => {
      const ch = await safeGet(api.get(`/chapters/${chapterId}`), null);
      if (!ch) { setChapter(false); return; }
      setChapter(ch);
      setNovel(await safeGet(api.get(`/novels/${novelSlug}`), null));
      setSiblings(await safeGet(api.get(`/novels/${novelSlug}/chapters`), []));
      window.scrollTo(0, 0);
    })();
  }, [novelSlug, chapterId]);

  useEffect(() => {
    localStorage.setItem('font', font);
    const onScroll = () => {
      const el = document.documentElement;
      const p = Math.min(100, Math.round((el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 100));
      setPercent(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [font]);

  useEffect(() => {
    if (!chapter) return;
    const t = setTimeout(() => {
      const payload = { novelSlug, novelTitle: novel?.title, novelId: chapter.novelId || novelSlug, chapterId: chapter._id || chapter.id, percent, updatedAt: new Date().toISOString() };
      if (localStorage.getItem('token')) api.post('/progress', { novelId: payload.novelId, chapterId: payload.chapterId, percent }).catch(() => {});
      const all = JSON.parse(localStorage.getItem('progress') || '[]').filter((p) => p.chapterId !== payload.chapterId);
      localStorage.setItem('progress', JSON.stringify([payload, ...all].slice(0, 20)));
    }, 1000);
    return () => clearTimeout(t);
  }, [percent]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (chapter === false) return <div className="p-16 text-center"><p className="text-xl font-bold">Chapter not found</p><p className="text-zinc-400 mt-2">It may have been removed.</p><Link to={`/novels/${novelSlug}`} className="btn-primary mt-4">Back to story</Link></div>;
  if (!chapter) return <div className="p-10 text-center text-zinc-400">Loading chapter…</div>;
  const idx = siblings.findIndex((c) => (c._id || c.id) === (chapter._id || chapter.id));
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];
  const step = (d) => {
    const t = siblings[idx + d];
    if (t) nav(`/read/${novelSlug}/${t._id || t.id}`);
  };
  const paras = (chapter.content || '').split(/\n+/).filter(Boolean);

  return (
    <div className="min-h-screen">
      <div className="sticky top-16 z-30 bg-ink/90 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-3xl px-4 py-2 flex items-center gap-2 text-sm flex-wrap">
          <Link to={`/novels/${novelSlug}`} className="hover:text-white">← {novel?.title || novelSlug}</Link>
          <span className="text-zinc-500">Ch {chapter.number}</span>
          <select value={chapter._id || chapter.id} onChange={(e) => nav(`/read/${novelSlug}/${e.target.value}`)} className="bg-white/10 rounded-lg px-2 py-1 text-sm max-w-[140px]">
            {siblings.map((c) => <option key={c._id || c.id} value={c._id || c.id}>Ch {c.number}</option>)}
          </select>
          <span className="ml-auto flex items-center gap-1">
            <button onClick={() => setFont((f) => Math.max(14, f - 2))} className="rounded-lg bg-white/10 px-2">A−</button>
            <button onClick={() => setFont((f) => Math.min(26, f + 2))} className="rounded-lg bg-white/10 px-2">A+</button>
          </span>
        </div>
        <div className="h-1 bg-white/10"><div className="h-full bg-accent transition-all" style={{ width: `${percent}%` }} /></div>
      </div>
      <article className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-black">{chapter.title || `Chapter ${chapter.number}`}</h1>
        <p className="text-xs text-zinc-500 mt-1">{novel?.title} · {(chapter.content || '').split(/\s+/).length} words · {novel?.license}</p>
        <div className="prose-story mt-6" style={{ fontSize: font }}>
          {paras.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="flex justify-between mt-10 pb-10">
          {prev ? <Link to={`/read/${novelSlug}/${prev._id || prev.id}`} className="btn-ghost btn">← Ch {prev.number}</Link> : <span />}
          <Link to={`/novels/${novelSlug}`} className="btn-ghost btn">Contents</Link>
          {next ? <Link to={`/read/${novelSlug}/${next._id || next.id}`} className="btn-primary">Ch {next.number} →</Link> : <span />}
        </div>
      </article>
    </div>
  );
}
