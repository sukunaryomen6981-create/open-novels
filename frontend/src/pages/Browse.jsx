import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import { GENRES, GENRE_EMOJI } from '../services/mockData.js';
import { NovelCard, SkeletonGrid, Empty } from '../components/ui.jsx';
import { useDebounce } from '../hooks/hooks.js';

export default function Browse() {
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get('q') || '');
  const [genre, setGenre] = useState(params.get('genre') || '');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState(params.get('sort') || 'popular');
  const dq = useDebounce(q, 350);

  useEffect(() => {
    setLoading(true);
    api.get('/novels', { params: { q: dq, genre, status, sort, limit: 24 } })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([])).finally(() => setLoading(false));
  }, [dq, genre, status, sort]);

  return (
    <div className="py-6">
      <h1 className="font-display font-semibold tracking-tight-display text-3xl">Browse stories</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, author, theme…" className="input" />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input"><option value="">All genres</option>{GENRES.map((g) => <option key={g} value={g}>{GENRE_EMOJI[g]} {g}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input"><option value="">Any status</option><option>Ongoing</option><option>Completed</option><option>Hiatus</option></select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="input"><option value="popular">Most read</option><option value="rating">Top rated</option><option value="updated">Recently updated</option><option value="newest">Newest</option><option value="alpha">A–Z</option></select>
      </div>
      <div className="mt-6">{loading ? <SkeletonGrid /> : items.length === 0 ? <Empty title="No stories found" hint="Be the first to write one!" /> :
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{items.map((n) => <NovelCard key={n.slug || n.id} novel={n} />)}</div>}</div>
    </div>
  );
}
