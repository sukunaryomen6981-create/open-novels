import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { safeGet } from '../services/api.js';
import { GENRE_EMOJI } from '../services/mockData.js';
import { Stars, toast, Avatar } from '../components/ui.jsx';

export default function NovelDetails() {
  const { slug } = useParams();
  const [novel, setNovel] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [order, setOrder] = useState('asc');
  const [progress, setProgress] = useState(null);
  const [inLib, setInLib] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    (async () => {
      const n = await safeGet(api.get(`/novels/${slug}`), null);
      if (!n) { setNotFound(true); return; }
      setNovel(n);
      document.title = `${n.title} by ${n.authorName} — OpenNovels`;
      const mid = n?._id || n?.id || slug;
      setChapters(await safeGet(api.get(`/novels/${mid}/chapters`, { params: { order } }), []));
      const rv = await safeGet(api.get(`/novels/${mid}/reviews`), { items: [], mine: null });
      setReviews(rv.items || []);
      setMyReview(rv.mine || null);
      if (rv.mine) { setMyScore(rv.mine.score); setReviewText(rv.mine.text || ''); }
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

  const refreshAll = async () => {
    const mid = novel._id || novel.id;
    const [nn, rv] = await Promise.all([
      safeGet(api.get(`/novels/${slug}`), novel),
      safeGet(api.get(`/novels/${mid}/reviews`), { items: [], mine: null })
    ]);
    setNovel(nn);
    setReviews(rv.items || []);
    setMyReview(rv.mine || null);
  };

  const saveRating = async (e) => {
    e.preventDefault();
    if (!myScore) { toast('Tap a score from 1 to 10 first'); return; }
    try {
      await api.post(`/novels/${novel._id || novel.id}/reviews`, { score: myScore, text: reviewText });
      toast(myReview ? 'Rating updated!' : 'Thanks for rating!');
      await refreshAll();
    } catch (er) {
      if (er.response?.data?.code === 'UNVERIFIED') toast('Verify your email to rate & review');
      else toast(er.response?.data?.error || 'Could not save rating');
    }
  };

  const deleteReview = async (id) => {
    try {
      await api.delete(`/reviews/${id}`);
      toast('Review removed');
      if (myReview && myReview.id === id) { setMyReview(null); setMyScore(0); setReviewText(''); }
      await refreshAll();
    } catch { toast('Could not delete'); }
  };
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
            <span className="chip">{novel.status}</span><Stars rating={novel.rating} count={novel.ratingsCount} />
            <span className="text-xs text-zinc-500">{novel.views?.toLocaleString?.() || ''} reads · {novel.ratingsCount || 0} ratings</span>
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
      <div className="mt-10">
        <h2 className="text-xl font-bold">Ratings & reviews {novel.ratingsCount ? <span className="text-sm font-normal text-zinc-400">({novel.ratingsCount} · avg {Number(novel.rating || 0).toFixed(1)}/10)</span> : null}</h2>
        {user ? (
          <form onSubmit={saveRating} className="mt-3 rounded-2xl border border-white/10 bg-panel p-4">
            <p className="text-sm font-semibold">{myReview ? 'Your rating' : 'Rate this story (1–10)'}</p>
            <div className="flex gap-1 mt-2 flex-wrap" role="radiogroup" aria-label="Score from 1 to 10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button key={n} type="button" onClick={() => setMyScore(n)} onMouseEnter={() => setHoverScore(n)} onMouseLeave={() => setHoverScore(0)}
                  aria-label={`${n} out of 10`}
                  className={`h-9 w-9 rounded-lg text-sm font-bold border transition ${(hoverScore || myScore) >= n ? 'bg-brass text-ink border-brass' : 'bg-white/5 border-white/10 text-zinc-400'}`}>{n}</button>))}
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">{myScore ? `${myScore}/10 ${myScore >= 8 ? '— loved it' : myScore >= 5 ? '— decent' : '— not for me'}` : 'Tap a number'}</p>
            <textarea className="input mt-2" rows={3} maxLength={2000} placeholder="Write a review (optional) — what worked, who it's for…" value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
            <div className="flex gap-3 mt-2 items-center">
              <button className="btn-primary !py-1.5 text-sm">{myReview ? 'Update' : 'Post rating'}</button>
              {myReview && <button type="button" onClick={() => deleteReview(myReview.id)} className="text-xs text-zinc-500 hover:text-red-400">Remove mine</button>}
            </div>
          </form>
        ) : (
          <p className="text-sm text-zinc-400 mt-3"><Link to="/login" className="text-accent">Login</Link> to rate & review.</p>
        )}
        <div className="mt-4 space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-panel px-4 py-3">
              <div className="flex items-center gap-2">
                <Avatar user={{ penName: r.penName, avatar: r.avatar }} size="h-7 w-7 text-xs" />
                <span className="text-sm font-semibold">{r.penName}</span>
                <span className="chip !border-brass/50 !text-brass font-bold">{r.score}/10</span>
                <span className="text-xs text-zinc-500 ml-auto">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                {(user && (String(r.userId) === String(user.id) || user.role === 'admin')) && (
                  <button onClick={() => deleteReview(r.id)} className="text-xs text-zinc-500 hover:text-red-400" aria-label="Delete review">✕</button>)}
              </div>
              {r.text && <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap">{r.text}</p>}
            </div>))}
          {reviews.length === 0 && <p className="text-sm text-zinc-500">No reviews yet — yours could be the first.</p>}
        </div>
      </div>
    </article>
  );
}
