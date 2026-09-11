import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDebounce } from '../hooks/hooks.js';
import api, { uploadImage } from '../services/api.js';

export function Stars({ rating = 0, count }) {
  if (!count) return <span className="text-zinc-500 text-sm">☆ New</span>;
  return <span className="text-amber-300 text-sm">★ {Number(rating).toFixed(1)}<span className="text-zinc-500">/10</span></span>;
}

export function NovelCard({ novel }) {
  return (
    <Link to={`/novels/${novel.slug || novel.id}`} className="card group">
      <div className="relative aspect-[2/3] overflow-hidden bg-black/40">
        {novel.coverImage ? (
          <img src={novel.coverImage} alt={novel.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition" />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#2A1F14] to-[#0F0C08] text-brass">
            <span className="font-display font-bold text-4xl">{(novel.title || '?')[0]}</span>
            <span className="text-[10px] tracking-[0.2em] opacity-70">OPENNOVELS</span>
          </div>
        )}
        <span className="absolute top-2 left-2 chip bg-black/70">{novel.status}</span>
      </div>
      <div className="p-3">
        <h3 className="font-semibold truncate">{novel.title}</h3>
        <p className="text-xs text-zinc-400 truncate">by {novel.authorName}</p>
        <div className="flex items-center justify-between text-sm mt-1">
          <Stars rating={novel.rating} count={novel.ratingsCount} />
          <span className="text-zinc-400 text-xs">{novel.chaptersCount ?? ''} {novel.chaptersCount === 1 ? 'ch' : 'chs'}</span>
        </div>
      </div>
    </Link>
  );
}

export function SkeletonGrid({ n = 8 }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{Array.from({ length: n }).map((_, i) => <div key={i} className="skeleton aspect-[2/3]" />)}</div>;
}
export function Empty({ title, hint }) {
  return <div className="text-center py-16 text-zinc-400"><p className="text-xl font-semibold text-zinc-200">{title}</p><p className="mt-2">{hint}</p></div>;
}
let toastTimer;
export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-black/90 border border-white/20 px-4 py-2 rounded-xl z-[100]'; document.body.appendChild(el); }
  el.textContent = msg; el.style.display = 'block';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.style.display = 'none'), 2200);
}

// Avatar: uploaded/linked image, built-in emoji glyph, or pen-name initial.
export function Avatar({ user, size = 'h-8 w-8 text-sm' }) {
  const a = user?.avatar || '';
  if (/^(https?:|data:image\/)/.test(a)) {
    return <img src={a} alt="" className={`${size} rounded-xl object-cover border border-white/10`} />;
  }
  if (a) {
    return <div className={`${size} rounded-xl bg-brass/15 border border-brass/40 flex items-center justify-center shrink-0`}>{a}</div>;
  }
  const initial = ((user?.penName || user?.username || '?')[0] || '?').toUpperCase();
  return <div className={`${size} rounded-xl bg-brass text-ink font-black flex items-center justify-center shrink-0`}>{initial}</div>;
}

// One-tap device upload used by covers and avatars.
export function ImageUploadButton({ onDone, label = '📁 Upload from device' }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast('Please choose an image file'); return; }
    if (f.size > 5 * 1024 * 1024) { toast('Max 5MB per image'); return; }
    setBusy(true);
    try { onDone(await uploadImage(f)); toast('Uploaded ✓'); }
    catch { toast('Upload failed — paste an image link instead'); }
    finally { setBusy(false); }
  };
  return (
    <label className={`btn-ghost btn !py-1.5 text-sm cursor-pointer ${busy ? 'opacity-60' : ''}`}>
      {busy ? 'Uploading…' : label}
      <input type="file" accept="image/*" className="hidden" onChange={pick} disabled={busy} />
    </label>
  );
}

// Shown to logged-in users who haven't confirmed their address yet.
export function VerifyBanner() {
  const { user } = useAuth();
  const [msg, setMsg] = useState('');
  if (!user || user.guest || user.isVerified) return null;
  const resend = async () => {
    try { await api.post('/auth/resend-verification'); setMsg('Verification email sent — check your inbox (and spam folder).'); }
    catch { setMsg('Could not send right now — try again in a few minutes.'); }
  };
  return (
    <div className="rounded-2xl border border-brass/40 bg-brass/10 p-4 text-sm">
      <p><b>📧 Verify your email</b> to unlock publishing. {msg || <button onClick={resend} className="text-brass font-semibold underline">Resend the link</button>}</p>
    </div>
  );
}

function SearchBox() {
  const [q, setQ] = useState('');
  const [sugs, setSugs] = useState([]);
  const dq = useDebounce(q, 300);
  const nav = useNavigate();
  useEffect(() => {
    if (!dq.trim()) { setSugs([]); return; }
    api.get('/search', { params: { q: dq } }).then(({ data }) => setSugs(data.items || [])).catch(() => setSugs([]));
  }, [dq]);
  return (
    <div className="relative w-full max-w-md">
      <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && nav(`/search?q=${encodeURIComponent(q)}`)}
        placeholder="Search stories, authors…" className="input" aria-label="Search" />
      {sugs.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-panel shadow-xl overflow-hidden">
          {sugs.slice(0, 6).map((n) => (
            <Link key={n.slug || n.id} to={`/novels/${n.slug || n.id}`} onClick={() => setSugs([])} className="flex items-center gap-3 px-3 py-2 hover:bg-white/10">
              <img src={n.coverImage} alt="" className="h-10 w-8 object-cover rounded" loading="lazy" />
              <span className="truncate text-sm">{n.title} <span className="text-zinc-500">by {n.authorName}</span></span>
            </Link>))}
        </div>)}
    </div>
  );
}

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const nav = useNavigate();
  const links = [['/', '🏡 Home'], ['/browse', '📜 Browse'], ['/genres', '🔮 Genres'], ['/rankings', '🥇 Rankings'], ['/contests', '🏆 Contests'], ['/library', '🕯️ Library']];
  const initial = ((user?.penName || user?.username || '?')[0] || '?').toUpperCase();
  const surprise = async () => {
    setMenu(false);
    try {
      const { data } = await api.get('/novels', { params: { limit: 60, sort: 'popular' } });
      const items = data.items || [];
      if (!items.length) { toast('No stories yet — publish the first!'); nav('/profile'); return; }
      const pickStory = items[Math.floor(Math.random() * items.length)];
      nav(`/novels/${pickStory.slug || pickStory._id || pickStory.id}`);
    } catch { toast('Could not fetch stories'); }
  };
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-ink/85 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-display text-xl font-bold tracking-tight flex items-center gap-2"><img src="/logo.svg" alt="OpenNovels logo" className="h-7 w-7" />Open<span className="text-brass">Novels</span></Link>
        <nav className="hidden md:flex gap-4 ml-4 text-sm text-zinc-300">
          {links.map(([to, l]) => <Link key={to} to={to} className="hover:text-white">{l}</Link>)}
          {isAdmin && <Link to="/admin" className="text-amber-300">🧙 Admin</Link>}
        </nav>
        <div className="hidden md:block flex-1" />
        <div className="hidden md:block w-72"><SearchBox /></div>
        <button onClick={surprise} title="Surprise me — open a random story" className="hidden md:inline-flex btn-ghost btn !px-3" aria-label="Random story">🎲</button>
        {user ? (
          <div className="relative hidden md:block text-sm">
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20">
              <Avatar user={user} size="h-6 w-6 text-[10px]" />
              <span className="max-w-[120px] truncate">{user.penName || user.username}</span>
              {user.isAuthor && <span title="Author">✍️</span>}
              <span className="text-zinc-400">▾</span>
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-white/10 bg-panel p-1.5 shadow-2xl max-h-[80vh] overflow-y-auto">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/40">Discover</p>
                  <button onClick={surprise} className="block w-full text-left rounded-lg px-3 py-2 hover:bg-white/10">🎲 Surprise me <span className="text-paper/40 text-xs">· random story</span></button>
                  <Link to="/rankings" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 hover:bg-white/10">🥇 Rankings <span className="text-paper/40 text-xs">· most read & top rated</span></Link>
                  <Link to="/contests" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 hover:bg-white/10">🏆 Contests <span className="text-brass text-xs">· weekly prompt live</span></Link>
                  <Link to="/prompts" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 hover:bg-white/10">🪄 Prompt dice <span className="text-paper/40 text-xs">· beat block</span></Link>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/40">Create</p>
                  {!user.isAuthor && !user.guest && <Link to="/profile" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 text-brass hover:bg-white/10">🦋 Become an author</Link>}
                  {(user.isAuthor || user.guest) && <Link to="/write" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 hover:bg-white/10">✒️ Write / my stories</Link>}
                  <Link to="/library" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 hover:bg-white/10">🕯️ My library</Link>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-paper/40">Account</p>
                  <Link to="/profile" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 hover:bg-white/10">🪪 My profile & stats</Link>
                  {isAdmin && <Link to="/admin" onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2 text-amber-300 hover:bg-white/10">🧙 Admin panel</Link>}
                  <button onClick={() => { setMenu(false); logout(); }} className="block w-full text-left rounded-lg px-3 py-2 text-zinc-400 hover:bg-white/10">🚪 Logout</button>
                </div>
              </>
            )}
          </div>
        )
          : <div className="hidden md:flex gap-2"><Link to="/login" className="btn-ghost btn">Login</Link><Link to="/register" className="btn-primary">Join free</Link></div>}
        <button className="md:hidden btn-ghost btn !px-3" onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>
      </div>
      {open && (
        <div className="md:hidden px-4 pb-4 space-y-2 border-t border-white/10 pt-3">
          <SearchBox />
          <div className="flex gap-2">
            <button onClick={() => { setOpen(false); surprise(); }} className="btn-ghost btn flex-1 !py-1.5 text-sm">🎲 Surprise me</button>
            <Link to="/prompts" onClick={() => setOpen(false)} className="btn-ghost btn flex-1 !py-1.5 text-sm">🪄 Prompt dice</Link>
          </div>
          {[...links, ...(user ? [['/profile', `👤 ${user.penName || 'Profile'}`]] : [['/login', 'Login'], ['/register', 'Join free']])].map(([to, l]) => (
            <Link key={to} to={to} onClick={() => setOpen(false)} className="block py-1">{l}</Link>))}
          {user && !user.isAuthor && !user.guest && <Link to="/profile" onClick={() => setOpen(false)} className="block py-1 text-accent">🦋 Become an author</Link>}
          {user && (user.isAuthor || user.guest) && <Link to="/write" onClick={() => setOpen(false)} className="block py-1">✒️ Write / my stories</Link>}
          {user && <button onClick={() => { setOpen(false); logout(); }} className="btn-ghost btn w-full">Logout</button>}
        </div>)}
    </header>
  );
}

export function BottomNav() {
  const items = [['/', '🏡', 'Home'], ['/browse', '📜', 'Browse'], ['/genres', '🔮', 'Genres'], ['/library', '🕯️', 'Library'], ['/profile', '🪪', 'Me']];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ink/95 border-t border-white/10 flex justify-around py-2 text-xs">
      {items.map(([to, icon, label]) => <Link key={to} to={to} className="flex flex-col items-center gap-0.5 text-zinc-300"><span className="text-lg">{icon}</span>{label}</Link>)}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 py-8 text-sm text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row gap-2 justify-between">
        <p>OpenNovels · MIT open source · authors own their stories (CC-BY default).</p>
        <div className="flex gap-4 flex-wrap"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/guidelines">Guidelines</Link><Link to="/legal">Copyright</Link><Link to="/profile">Become an author</Link></div>
      </div>
    </footer>
  );
}
