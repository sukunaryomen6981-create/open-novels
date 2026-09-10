import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { safeGet } from '../services/api.js';
import { GENRE_EMOJI } from '../services/mockData.js';
import { Stars, toast } from '../components/ui.jsx';

export default function NovelDetails() {
  const { slug } = useParams();
  const [novel, setNovel] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [order, setOrder] = useState('asc');
  const [progress, setProgress] = useState(null);
  const [inLib, setInLib] = useState(false);

  useEffect(() => {
    (async () => {
      const n = await safeGet(api.get(`/novels/${slug}`), null);
      if (!n) { setNotFound(true); return; }
      setNovel(n);
      document.title = `${n.title} by ${n.authorName} — OpenNovels`;
      const mid = n?._id || n?.id || slug;
      setChapters(await safeGet(api.get(`/novels/${mid}/chapters`, { params: { order } }), []));
      if (localStorage.getItem('token')) setProgress(await safeGet(api.get(`/progress/${mid}`), null));
    })();
  }, [slug, order]);

  const toggleLib = async () => {
    const mid = novel?._id || novel?.id;
    try {
      if (inLib) await api.delete(`/library/${mid}`); else await api.post(`/library/${mid}`);
      setInLib(!inLib); toast(inLib ? 'Removed from library' : 'Added to library');
    } catch {
      const k = JSON.parse(localStorage.getItem('library') || '[]');
      localStorage.setItem('library', JSON.stringify(inLib ? k.filter((x) => x !== mid) : [...k, mid]));
      setInLib(!inLib); toast('Saved locally (login to sync)');
    }
  };

  if (notFound) return <div className="py-16 text-center"><h1 className="text-2xl font-black">Story not found</h1><p className="text-zinc-400 mt-2">It may have been removed — or <Link to="/write" className="text-accent">write it yourself</Link>.</p></div>;
  if (!novel) return <div className="py-10"><div className="skeleton h-64" /></div>;
  const first = chapters[0];
  return (
    <article className="py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <img src={novel.coverImage} alt={`${novel.title} cover`} className="w-48 md:w-64 rounded-2xl shadow-2xl self-start" />
        <div className="flex-1">
          <h1 className="font-display font-semibold tracking-tight-display text-4xl">{novel.title}</h1>
          <p className="text-zinc-400 text-sm mt-1">by {novel.authorName} · {novel.language || 'English'} · License: {novel.license}</p>
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            {(novel.genres || []).map((g) => <Link key={g} to={`/genres/${g}`} className="chip hover:border-accent">{GENRE_EMOJI[g] || ''} {g}</Link>)}
            <span className="chip">{novel.status}</span><Stars rating={novel.rating} />
            <span className="text-xs text-zinc-500">{novel.views?.toLocaleString?.() || ''} reads</span>
          </div>
          <p className="mt-4 leading-relaxed max-w-3xl">{novel.synopsis}</p>
          {progress && <Link to={`/read/${novel.slug}/${progress.chapterId}`} className="mt-4 inline-block rounded-xl bg-emerald-600 px-4 py-2 font-semibold">Continue at {progress.percent}% →</Link>}
          <div className="flex gap-3 mt-4 flex-wrap">
            {first && <Link to={`/read/${novel.slug}/${first._id || first.id}`} className="btn-primary">Start reading</Link>}
            <button onClick={toggleLib} className="btn-ghost btn">{inLib ? '★ In library' : '☆ Add to library'}</button>
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-bold">Chapters ({chapters.length})</h2>
        <select value={order} onChange={(e) => setOrder(e.target.value)} className="input !w-auto"><option value="asc">First → latest</option><option value="desc">Latest → first</option></select>
      </div>
      <div className="mt-3 grid gap-2">
        {chapters.map((c) => (
          <Link key={c._id || c.id} to={`/read/${novel.slug}/${c._id || c.id}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-panel px-4 py-3 hover:border-accent text-sm">
            <span><b>Ch {c.number}</b> <span className="text-zinc-400 ml-2">{c.title}</span></span>
            <span className="text-xs text-zinc-500">{c.words ? `${c.words} words` : ''} · Read →</span>
          </Link>))}
      </div>
    </article>
  );
}
