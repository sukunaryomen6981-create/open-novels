import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { safeGet } from '../services/api.js';
import { NovelCard, Empty, Stars, SkeletonGrid, toast } from '../components/ui.jsx';
import { GENRES, GENRE_EMOJI } from '../services/mockData.js';

/* ————— Rankings: real leaderboards from live data ————— */
const TABS = [
  ['popular', '🔥 Most read', 'popular'],
  ['rating', '★ Top rated', 'rating'],
  ['updated', '✨ Freshly updated', 'updated']
];

export function Rankings() {
  const [tab, setTab] = useState('popular');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    api.get('/novels', { params: { sort: tab, limit: 30 } })
      .then(({ data }) => setItems(data.items || []))
      .catch(() => setItems([])).finally(() => setLoading(false));
  }, [tab]);
  const metric = (n) => tab === 'rating' ? `★ ${Number(n.rating || 0).toFixed(1)} (${n.ratingsCount || 0})` : tab === 'updated'
    ? (n.updatedAt ? new Date(n.updatedAt).toLocaleDateString() : '')
    : `${(n.views || 0).toLocaleString()} reads`;
  return (
    <div className="py-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brass">Leaderboards</p>
      <h1 className="font-display font-semibold tracking-tight-display text-3xl md:text-4xl mt-1">Rankings</h1>
      <div className="flex gap-2 mt-4 flex-wrap">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`btn !py-1.5 text-sm ${tab === id ? 'btn-primary' : 'btn-ghost'}`}>{label}</button>))}
      </div>
      <div className="mt-5">
        {loading ? <SkeletonGrid n={6} /> : items.length === 0 ? <Empty title="No rankings yet" hint="Publish the first story and claim #1 by default." /> : (
          <div className="space-y-2">
            {items.map((n, i) => (
              <Link key={n.slug || n._id || n.id} to={`/novels/${n.slug || n._id || n.id}`}
                className="flex items-center gap-4 rounded-2xl border hairline bg-coal/70 px-3 py-2.5 hover:border-brass/40 transition-colors">
                <span className={`font-display font-semibold text-2xl w-10 text-center shrink-0 ${i < 3 ? 'text-brass' : 'text-paper/30'}`}>{i + 1}</span>
                <img src={n.coverImage} alt="" loading="lazy" className="h-16 w-11 object-cover rounded-lg bg-black/40 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{n.title}</p>
                  <p className="text-xs text-paper/50 truncate">by {n.authorName} · {(n.genres || []).slice(0, 2).join(' · ')}</p>
                </div>
                <span className="text-xs text-paper/60 whitespace-nowrap hidden sm:block">{metric(n)}</span>
                <span className="text-brass text-sm shrink-0">→</span>
              </Link>))}
          </div>)}
      </div>
    </div>
  );
}

/* ————— Weekly flash-fiction contest: rotating prompt, live entries ————— */
const PROMPTS = [
  'A mapmaker finds a street that only appears on maps drawn from memory.',
  'A night-shift radio host takes a call from twenty years ago.',
  'The last lighthouse keeper realizes the light has been signaling something back.',
  'An origami artist folds wishes for strangers — each one costs a memory.',
  'A seed-vault botanist wakes to find one drawer labeled with tomorrow’s date.',
  'Two rival food-truck owners must share one truck for a festival weekend.',
  'A retired detective receives a letter she wrote but never mailed.',
  'The town’s rain only falls on one house — and it just went up for sale.'
];

export function contestWeek(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.max(1, Math.ceil((((d - start) / 864e5) + start.getDay() + 1) / 7));
  return { year: d.getFullYear(), week };
}

export function currentContest(now = new Date()) {
  const { year, week } = contestWeek(now);
  const tag = `flash-fic-${year}-w${week}`;
  const prompt = PROMPTS[week % PROMPTS.length];
  const dl = new Date(now);
  dl.setDate(dl.getDate() + ((7 - dl.getDay()) % 7));
  dl.setHours(23, 59, 59, 0);
  if (dl <= now) dl.setDate(dl.getDate() + 7);
  return { tag, prompt, deadline: dl, week, year };
}

function useCountdown(deadline) {
  const [left, setLeft] = useState(() => Math.max(0, deadline - new Date()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, deadline - new Date())), 30000);
    return () => clearInterval(t);
  }, [deadline]);
  const s = Math.floor(left / 1000);
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export function Contests() {
  const [contest] = useState(() => currentContest());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const countdown = useCountdown(contest.deadline);
  useEffect(() => {
    api.get('/novels', { params: { tag: contest.tag, sort: 'popular', limit: 30 } })
      .then(({ data }) => setEntries(data.items || []))
      .catch(() => setEntries([])).finally(() => setLoading(false));
  }, [contest.tag]);
  return (
    <div className="py-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brass">Weekly event · 100% free</p>
      <h1 className="font-display font-semibold tracking-tight-display text-3xl md:text-4xl mt-1">Flash-Fiction Friday</h1>
      <div className="mt-4 rounded-3xl border border-brass/30 bg-brass/[0.07] p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-brass font-bold">This week’s prompt · Week {contest.week}</p>
        <p className="font-display text-2xl md:text-3xl mt-2 leading-snug">“{contest.prompt}”</p>
        <div className="flex gap-2 mt-4 flex-wrap items-center">
          <span className="chip !border-brass/50 !text-brass font-bold">⏳ Closes in {countdown}</span>
          <span className="chip">🏆 Most-read entry gets featured all next week</span>
        </div>
        <div className="flex gap-3 mt-5 flex-wrap">
          <Link to="/write" className="btn-primary">Enter — write it →</Link>
        </div>
        <p className="text-xs text-paper/50 mt-3">To enter: publish any story and add the tag <code className="text-brass">{contest.tag}</code> in the Tags field. One chapter minimum, original work only.</p>
      </div>
      <h2 className="font-display font-semibold text-xl mt-8">This week’s entries ({entries.length})</h2>
      <div className="mt-3">
        {loading ? <SkeletonGrid n={6} /> : entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="font-display text-xl">No entries yet.</p>
            <p className="text-paper/60 text-sm mt-1">First entry usually wins the early readers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {entries.map((n) => <NovelCard key={n.slug || n._id || n.id} novel={n} />)}
          </div>)}
      </div>
      <div className="mt-8 grid md:grid-cols-3 gap-3 text-sm">
        {[['Any length, one rule', 'Original work only. Any genre, any chapter count — the prompt is a spark, not a cage.'],
          ['Winner = most read', 'At Sunday midnight the most-read entry takes the homepage feature slot for a full week.'],
          ['Everyone keeps everything', 'Your entry stays yours under your license. Enter as many weeks as you like.']].map(([t, d]) => (
          <div key={t} className="card p-4"><p className="font-bold">{t}</p><p className="text-paper/60 mt-1">{d}</p></div>))}
      </div>
    </div>
  );
}

/* ————— Story prompt dice: infinite sparks for stuck writers ————— */
const HEROES = ['a retired mapmaker', 'a night-shift radio host', 'a lighthouse keeper afraid of water', 'an origami artist', 'a seed-vault botanist', 'a food-truck chef', 'a retired detective', 'a substitute teacher', 'a wedding photographer', 'a grave-shift baker'];
const WANTS = ['to find a missing sibling', 'to win one last competition', 'to keep a promise to a grandmother', 'to sell the family shop before winter', 'to prove a childhood ghost story true', 'to deliver a letter 20 years late'];
const WALLS = ['a storm cuts every road out of town', 'someone is erasing the evidence overnight', 'the money runs out on Friday', 'a rival wants the exact same thing', 'nobody believes a word of it', 'the rules change halfway through'];
const TWISTS = ['the helper has been the villain all along', 'it already happened once before', 'the prize was never real', 'two strangers remember it completely differently', 'the deadline is a lie', 'home was the destination, not the start'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function Prompts() {
  const roll = () => ({ genre: pick(GENRES), hero: pick(HEROES), want: pick(WANTS), wall: pick(WALLS), twist: pick(TWISTS) });
  const [p, setP] = useState(() => roll());
  const [copied, setCopied] = useState(false);
  const text = `Write a ${p.genre} story about ${p.hero} who wants ${p.want} — but ${p.wall}. Twist: ${p.twist}.`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); toast('Prompt copied!'); setTimeout(() => setCopied(false), 2000); }
    catch { toast(text); }
  };
  return (
    <div className="py-6 max-w-3xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brass">Writer’s toy · unlimited rolls</p>
      <h1 className="font-display font-semibold tracking-tight-display text-3xl md:text-4xl mt-1">Story prompt dice</h1>
      <p className="text-paper/60 mt-2">Stuck? Roll a spark. Steal it, twist it, publish it — prompts are free for everyone.</p>
      <div className="card p-6 md:p-8 mt-5">
        <p className="font-display text-2xl leading-snug">“{text}”</p>
        <div className="flex gap-1.5 mt-4 flex-wrap">
          <span className="chip">{GENRE_EMOJI[p.genre]} {p.genre}</span><span className="chip">prompt-dice</span>
        </div>
        <div className="flex gap-2 mt-5 flex-wrap">
          <button onClick={() => setP(roll())} className="btn-primary">🎲 Roll again</button>
          <button onClick={copy} className="btn-ghost btn">{copied ? '✓ Copied' : 'Copy'}</button>
          <Link to="/write" className="btn-ghost btn">Write this →</Link>
        </div>
      </div>
      <p className="text-xs text-paper/40 mt-4">Tip: Friday’s contest prompt also works as a dice result with a deadline attached — see <Link to="/contests" className="text-brass">Contests</Link>.</p>
    </div>
  );
}
