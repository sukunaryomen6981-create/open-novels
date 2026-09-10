import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { safeGet } from '../services/api.js';
import { NovelCard, Empty, toast } from '../components/ui.jsx';
import { GENRES, GENRE_EMOJI } from '../services/mockData.js';
import { useAuth } from '../context/AuthContext.jsx';

export function Library() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    (async () => {
      const data = await safeGet(api.get('/library'), JSON.parse(localStorage.getItem('library') || '[]'));
      // local lib may hold raw ids — only full story objects can render
      setItems(Array.isArray(data) ? data.filter((x) => x && typeof x === 'object') : []);
    })();
  }, []);
  const remove = async (n) => {
    const id = n._id || n.id;
    try { await api.delete(`/library/${id}`); } catch {}
    const next = items.filter((x) => (x._id || x.id) !== id);
    setItems(next);
  };
  return (
    <div className="py-6"><h1 className="text-2xl font-black">My library</h1>
      {items.length === 0 ? <Empty title="Library is empty" hint="Open a story and tap Add to library." /> :
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((n) => <div key={n.slug || n._id || n.id} className="relative"><NovelCard novel={n} />
            <button onClick={() => remove(n)} className="absolute top-2 right-2 chip bg-black/80">✕</button></div>)}
        </div>}</div>
  );
}

export function BecomeAuthor() {
  const { user, updateUser } = useAuth();
  const nav = useNavigate();
  const [penName, setPenName] = useState(user?.penName || user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!penName.trim()) { setErr('Pick a pen name first'); return; }
    if (!agree) { setErr('Please confirm you’ll only post original writing'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/auth/become-author', { penName: penName.trim(), bio });
      updateUser(data.user);
      toast('You’re an author now — time to publish!');
      nav('/write');
    } catch {
      updateUser({ penName: penName.trim(), bio, isAuthor: true });
      toast('Author mode on (offline demo)');
      nav('/write');
    } finally { setSaving(false); }
  };
  return (
    <div className="card p-5 mt-4">
      <h2 className="font-bold text-lg">✍️ Become an author</h2>
      <ul className="text-sm text-zinc-300 mt-2 space-y-1">
        <li>✓ Publish unlimited original stories, chapter by chapter</li>
        <li>✓ You keep ownership — readers read free under your license</li>
        <li>✓ Reads, library saves and stats on your dashboard</li>
      </ul>
      <form onSubmit={submit} className="mt-3 grid gap-2">
        <input className="input" placeholder="Pen name *" value={penName} maxLength={30} onChange={(e) => setPenName(e.target.value)} />
        <textarea className="input" rows={2} placeholder="Short bio (optional)" value={bio} maxLength={500} onChange={(e) => setBio(e.target.value)} />
        <label className="text-xs text-zinc-400 flex gap-2 items-start"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" /> I’ll only post writing I own or that’s public domain.</label>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button className="btn-primary w-fit" disabled={saving}>{saving ? 'Saving…' : 'Become an author →'}</button>
      </form>
    </div>
  );
}

function avatarColor(name = '') {
  const colors = ['from-violet-500 to-fuchsia-500', 'from-sky-500 to-emerald-500', 'from-amber-500 to-rose-500', 'from-indigo-500 to-cyan-500'];
  let h = 0;
  for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) % 997;
  return colors[h % colors.length];
}

export function Profile() {
  const { user, logout, updateUser, isAdmin } = useAuth();
  const [history, setHistory] = useState([]);
  const [mine, setMine] = useState([]);
  const [library, setLibrary] = useState([]);
  const [words, setWords] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ penName: '', bio: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get('/progress').then(({ data }) => setHistory(data || [])).catch(() => {
      try { setHistory(JSON.parse(localStorage.getItem('progress') || '[]')); } catch {}
    });
    if (localStorage.getItem('token')) {
      api.get('/novels', { params: { mine: '1', limit: 50 } }).then(({ data }) => setMine(data.items || [])).catch(() => {});
      api.get('/library').then(({ data }) => setLibrary(Array.isArray(data) ? data : [])).catch(() => {});
    }
  }, []);
  useEffect(() => { if (user) setForm({ penName: user.penName || '', bio: user.bio || '' }); }, [user]);
  useEffect(() => {
    if (!mine.length) { setWords(0); return; }
    Promise.all(mine.map((n) => safeGet(api.get(`/novels/${n._id || n.id}/chapters`), [])))
      .then((lists) => setWords(lists.flat().reduce((a, c) => a + (c.wordCount || c.words || 0), 0)))
      .catch(() => setWords(null));
  }, [mine]);
  if (!user) return <div className="py-10">Please <Link to="/login" className="text-accent">login</Link> to see your profile.</div>;
  const reads = mine.reduce((a, n) => a + (n.views || 0), 0);
  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.penName.trim()) { toast('Pen name can’t be empty'); return; }
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', { penName: form.penName.trim(), bio: form.bio });
      updateUser(data);
      toast('Profile updated');
    } catch {
      updateUser({ penName: form.penName.trim(), bio: form.bio });
      toast('Saved locally (offline demo)');
    } finally { setSaving(false); setEditing(false); }
  };
  const stats = [
    ['📚 Stories', mine.length],
    ['✏️ Words written', words === null ? '…' : Number(words).toLocaleString()],
    ['👁️ Total reads', Number(reads).toLocaleString()],
    ['🔖 In library', library.length]
  ];
  return (
    <div className="py-6 max-w-3xl">
      <div className="card p-5 flex gap-4 items-start">
        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${avatarColor(user.username)} flex items-center justify-center text-2xl font-black shrink-0`}>
          {((user.penName || user.username || '?')[0] || '?').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black truncate">{user.penName || user.username}</h1>
            {user.isAuthor || user.guest ? <span className="chip !bg-accent/20 !border-accent/50">✍️ Author</span> : <span className="chip">📖 Reader</span>}
            {isAdmin && <span className="chip !bg-amber-500/20 !border-amber-500/50 text-amber-300">Admin</span>}
          </div>
          <p className="text-zinc-400 text-sm">@{user.username} · {user.email}</p>
          {user.bio ? <p className="text-sm mt-2">{user.bio}</p> : <p className="text-sm mt-2 text-zinc-500">No bio yet — tell readers who you are.</p>}
          <p className="text-xs text-zinc-500 mt-1">Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}{user.guest ? ' · demo (offline)' : ''}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <button onClick={() => setEditing((v) => !v)} className="btn-ghost btn !py-1.5 text-sm">{editing ? 'Cancel' : 'Edit profile'}</button>
            {isAdmin && <Link to="/admin" className="btn-ghost btn !py-1.5 text-sm">Admin panel</Link>}
            <button onClick={logout} className="btn-ghost btn !py-1.5 text-sm">Logout</button>
          </div>
          {editing && (
            <form onSubmit={saveProfile} className="mt-3 grid gap-2">
              <input className="input" value={form.penName} maxLength={30} onChange={(e) => setForm({ ...form, penName: e.target.value })} placeholder="Pen name" />
              <textarea className="input" rows={2} value={form.bio} maxLength={500} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Short bio" />
              <button className="btn-primary w-fit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </form>)}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-4"><p className="text-xl font-black">{value}</p><p className="text-xs text-zinc-400 mt-0.5">{label}</p></div>))}
      </div>
      {!user.isAuthor && !user.guest ? <BecomeAuthor /> : (
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold">✍️ Author dashboard</h2>
            <Link to="/write" className="btn-primary !py-1.5 text-sm">+ New story</Link>
          </div>
          <p className="text-sm text-zinc-400 mt-1">Publish new chapters from your stories below — readers see updates instantly in Browse.</p>
        </div>)}
      {(user.isAuthor || user.guest || mine.length > 0) && (
        <><h2 className="mt-6 font-bold">My stories ({mine.length})</h2>
        <div className="mt-2 space-y-2">
          {mine.map((n) => <Link key={n._id || n.id} to={`/write/${n.slug || n._id || n.id}`} className="flex justify-between items-center rounded-xl border border-white/10 bg-panel px-4 py-2.5 text-sm hover:border-accent"><span><b>{n.title}</b> <span className="text-zinc-500 text-xs ml-2">{n.status} · {(n.views || 0).toLocaleString()} reads</span></span><span className="text-accent">Manage →</span></Link>)}
          {mine.length === 0 && <p className="text-sm text-zinc-500">No stories yet — <Link to="/write" className="text-accent">start your first one</Link>.</p>}
        </div></>)}
      <Link to="/library" className="mt-4 flex justify-between items-center rounded-xl border border-white/10 bg-panel px-4 py-3 text-sm hover:border-accent">
        <span>🔖 My library <span className="text-zinc-500">· {library.length} saved</span></span><span className="text-accent">Open →</span>
      </Link>
      <h2 className="mt-6 font-bold">Continue reading</h2>
      <div className="mt-2 space-y-2">
        {history.slice(0, 8).map((h, i) => <Link key={i} to={`/read/${h.novelSlug || h.novelId}/${h.chapterId}`} className="block rounded-xl border border-white/10 bg-panel px-4 py-2 text-sm hover:border-accent">{h.novelTitle || 'Story'} · {h.percent}% →</Link>)}
        {history.length === 0 && <p className="text-sm text-zinc-500">Nothing yet — <Link to="/browse" className="text-accent">find a story</Link>.</p>}
      </div>
    </div>
  );
}

export function SearchPage() {
  const q = new URLSearchParams(location.search).get('q') || '';
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/search', { params: { q } }).then(({ data }) => setItems(data.items || [])).catch(() => setItems([])); }, [q]);
  return <div className="py-6"><h1 className="text-2xl font-black">Results for “{q}”</h1>
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{items.map((n) => <NovelCard key={n.slug || n.id} novel={n} />)}</div>
    {items.length === 0 && <Empty title="No matches" hint="Try another title, author or theme — or write it yourself!" />}</div>;
}

export function Genres() {
  return <div className="py-6"><h1 className="text-2xl font-black">Genres</h1>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{GENRES.map((g) => <Link key={g} to={`/genres/${g}`} className="card p-5 hover:-translate-y-0.5"><span className="text-3xl">{GENRE_EMOJI[g]}</span><p className="font-semibold mt-2">{g}</p></Link>)}</div></div>;
}

export function GenreDetail() {
  const name = decodeURIComponent(location.pathname.split('/').pop());
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/novels', { params: { genre: name } }).then(({ data }) => setItems(data.items || [])).catch(() => setItems([])); }, [name]);
  return <div className="py-6"><h1 className="text-2xl font-black">{GENRE_EMOJI[name] || ''} {name}</h1>
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{items.map((n) => <NovelCard key={n.slug || n.id} novel={n} />)}</div>
    {items.length === 0 && <Empty title="No stories here yet" hint="Yours could be the first." />}</div>;
}

export function Admin() {
  const { user, isAdmin } = useAuth();
  const [novels, setNovels] = useState([]);
  useEffect(() => { api.get('/novels', { params: { limit: 60 } }).then(({ data }) => setNovels(data.items || [])).catch(() => {}); }, []);
  if (!user) return <div className="py-10">Login required.</div>;
  if (!isAdmin && !user.guest) return <div className="py-10">Admin only.</div>;
  return (
    <div className="py-6"><h1 className="text-2xl font-black">Admin · community stories ({novels.length})</h1>
      <div className="mt-3 space-y-2">{novels.map((n) => (
        <div key={n._id || n.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-panel px-3 py-2 text-sm">
          <b>{n.title}</b><span className="text-zinc-500">by {n.authorName}</span>
          <button className="ml-auto rounded-lg bg-white/10 px-2 py-1" onClick={() => api.post(`/novels/${n._id || n.id}/feature`, { featured: !n.featured }).then(() => location.reload()).catch(() => {})}>{n.featured ? '★ Unfeature' : '☆ Feature'}</button>
        </div>))}</div></div>
  );
}

export function NotFound() {
  return <div className="py-20 text-center"><h1 className="text-4xl font-black">404</h1><p className="text-zinc-400 mt-2">Page not found.</p><Link to="/" className="btn-primary mt-4">Go home</Link></div>;
}
