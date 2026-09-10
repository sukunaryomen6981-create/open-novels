import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { NovelCard, SkeletonGrid, Empty } from '../components/ui.jsx';

/* Product-frame visual: a manuscript card, not a stock photo. Pure CSS. */
function Manuscript() {
  return (
    <div className="relative mx-auto w-full max-w-sm reveal" style={{ animationDelay: '.15s' }} aria-hidden="true">
      <div className="card !rounded-2xl p-5 rotate-1">
        <div className="flex gap-3 items-center">
          <div className="h-16 w-12 rounded-lg bg-gradient-to-br from-brass to-[#7a5416] flex items-center justify-center font-display font-semibold text-ink text-lg shrink-0">E</div>
          <div className="min-w-0">
            <p className="font-display font-semibold truncate">The Cartographer of Ember</p>
            <p className="text-xs text-paper/50">by You · CC-BY · Ongoing</p>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="h-2 rounded bg-white/10 w-full" />
          <div className="h-2 rounded bg-white/10 w-11/12" />
          <div className="h-2 rounded bg-white/10 w-full" />
          <div className="h-2 rounded bg-brass/40 w-4/12" />
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-paper/60">
          <span>Ch 12 · 48,200 words</span><span className="text-brass">★ 4.8</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-2/3 rounded-full bg-brass" /></div>
        <div className="mt-4 rounded-xl bg-brass px-4 py-2 text-center text-sm font-bold text-ink">Continue reading →</div>
      </div>
      <div className="absolute -bottom-5 -left-4 rounded-xl border border-white/10 bg-coal px-4 py-2.5 text-xs shadow-2xl -rotate-2">
        ✓ Draft autosaved <span className="text-paper/50">· just now</span>
      </div>
      <div className="absolute -top-4 -right-2 chip !bg-brass !text-ink !border-brass font-bold rotate-2">→ Chapter 12 live</div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero-bg rounded-3xl border hairline mt-6 px-6 py-12 md:p-14">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="reveal text-[11px] font-bold uppercase tracking-[0.22em] text-brass">Free · Open source · Author-owned</p>
          <h1 className="reveal font-display font-semibold tracking-tight-display text-5xl md:text-6xl leading-[1.04] mt-4" style={{ animationDelay: '.05s' }}>
            Write novels<br />readers finish.
          </h1>
          <p className="reveal mt-5 max-w-md text-paper/70 text-lg leading-relaxed" style={{ animationDelay: '.1s' }}>
            OpenNovels is the free home for original fiction. Publish chapter by chapter,
            keep every right to your words, and meet readers who reach the end.
          </p>
          <div className="reveal mt-7 flex items-center gap-4 flex-wrap" style={{ animationDelay: '.15s' }}>
            <Link to="/register" className="btn-primary !px-7 !py-3 text-base">Start writing — free</Link>
            <Link to="/browse" className="font-semibold text-paper/80 hover:text-brass transition-colors">Browse stories →</Link>
          </div>
          <div className="reveal mt-7 flex gap-2 flex-wrap text-xs" style={{ animationDelay: '.2s' }}>
            {['Free forever', 'You own your words', 'Export anytime'].map((t) => (
              <span key={t} className="chip">✓ {t}</span>))}
          </div>
        </div>
        <Manuscript />
      </div>
    </section>
  );
}

const PROPS = [
  {
    title: 'Ownership, in writing',
    body: 'Your copyright stays yours — always. Publish under CC-BY, share-alike, public domain, or all-rights-reserved. Change your license or export and delete everything, any time. No lock-in, no cuts, no fine print.',
    span: true
  },
  { title: 'Built for finishers', body: 'Continue-reading, libraries, and progress tracking mean readers pick up where they left off — and writers earn endings, not just clicks.' },
  { title: 'Zero gatekeepers', body: 'No invites, no fees, no query letters. Claim a pen name tonight and publish chapter one before bed.' }
];

const STEPS = [
  ['01', 'Claim your pen name', 'Twenty seconds. Free forever. No credit card, no invites.'],
  ['02', 'Publish chapter one', 'Draft in the editor, publish when ready. Edit any time.'],
  ['03', 'Keep them reading', 'Every chapter lands in Recently Updated; readers resume exactly where they stopped.']
];

const FAQS = [
  ['Is it really free?', 'Yes — completely. No fees, no revenue cuts, no paywalled chapters, no premium tier. The code itself is MIT open source, so the platform can never hold your work hostage.'],
  ['Who owns my stories?', 'You do. Copyright stays with you from the first word. You choose the license readers get (CC-BY by default), and you can export or delete everything at any time.'],
  ['What can I publish?', 'Original fiction in any genre — novels, novellas, short-story collections, poetry. It must be writing you own or that’s public domain: no copied books, no exceptions.'],
  ['How will readers find me?', 'Browse, genres, search, and the Recently Updated feed surface new voices alongside established ones. Every chapter you publish is a new reason to be discovered.'],
  ['Can I leave with my work?', 'Any time, in one click spirit: export your text, change your license, or delete your account and stories outright. Your readers came for you, not for us.']
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mt-16 max-w-3xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brass">Questions</p>
      <h2 className="font-display font-semibold tracking-tight-display text-3xl md:text-4xl mt-2">Asked before chapter one</h2>
      <div className="mt-6 space-y-2.5">
        {FAQS.map(([q, a], i) => (
          <div key={q} className="faq-q rounded-2xl border hairline bg-coal/60 transition-colors">
            <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
              <span className="font-semibold">{q}</span>
              <span className={`text-brass transition-transform duration-300 ${open === i ? 'rotate-45' : ''}`}>＋</span>
            </button>
            <div className={`faq-a ${open === i ? 'open' : ''}`}><div><p className="px-5 pb-5 text-paper/70 leading-relaxed">{a}</p></div></div>
          </div>))}
      </div>
    </section>
  );
}

export default function Home() {
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [continueList, setContinueList] = useState([]);
  useEffect(() => {
    api.get('/novels', { params: { limit: 6, sort: 'updated' } })
      .then(({ data }) => setNovels(data.items || []))
      .catch(() => setNovels([])).finally(() => setLoading(false));
    if (localStorage.getItem('token')) api.get('/progress').then(({ data }) => setContinueList(data || [])).catch(() => {});
    try {
      const local = JSON.parse(localStorage.getItem('progress') || '[]');
      if (local.length) setContinueList((c) => (c.length ? c : local));
    } catch {}
  }, []);

  return (
    <div className="pb-4">
      <Hero />

      {continueList.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display font-semibold text-xl">Continue reading</h2>
          <div className="grid gap-2 mt-3">
            {continueList.slice(0, 4).map((p, i) => (
              <Link key={i} to={`/read/${p.novelSlug || p.novelId}/${p.chapterId}`} className="rounded-xl border hairline bg-coal/70 px-4 py-3 flex justify-between text-sm hover:border-brass/40 transition-colors">
                <span>{p.novelTitle || 'Your story'} · {p.percent}%</span><span className="text-brass font-semibold">Resume →</span>
              </Link>))}
          </div>
        </section>)}

      <section className="mt-14">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="font-display font-semibold tracking-tight-display text-2xl md:text-3xl">Fresh off the desk</h2>
          <Link to="/browse" className="text-sm font-semibold text-brass">See all →</Link>
        </div>
        {loading ? <SkeletonGrid n={6} /> : novels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="font-display text-xl">The shelf is empty.</p>
            <p className="text-paper/60 text-sm mt-1">The first story here could have your name on it.</p>
            <Link to="/profile" className="btn-primary mt-4 !py-2 text-sm">Become an author</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {novels.map((n) => <NovelCard key={n.slug || n.id} novel={n} />)}
          </div>)}
      </section>

      <section className="mt-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brass">Why OpenNovels</p>
        <h2 className="font-display font-semibold tracking-tight-display text-3xl md:text-4xl mt-2 max-w-xl">A platform that works for the writer, not the feed.</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-3">
          {PROPS.map((p) => (
            <div key={p.title} className={`card p-6 ${p.span ? 'md:col-span-2' : ''}`}>
              <h3 className="font-display font-semibold text-xl">{p.title}</h3>
              <p className="text-paper/65 leading-relaxed mt-2 max-w-xl">{p.body}</p>
            </div>))}
        </div>
      </section>

      <section className="mt-14">
        <div className="rounded-2xl border hairline divide-y divide-white/5">
          {STEPS.map(([n, t, d]) => (
            <div key={n} className="flex gap-5 items-baseline px-6 py-5 hover:bg-white/[0.02] transition-colors">
              <span className="font-display text-brass/80 text-sm font-semibold">{n}</span>
              <div><p className="font-semibold">{t}</p><p className="text-sm text-paper/60 mt-0.5">{d}</p></div>
            </div>))}
        </div>
      </section>

      <Faq />

      <section className="mt-16 rounded-3xl bg-paper text-ink px-6 py-12 md:p-14 text-center">
        <h2 className="font-display font-semibold tracking-tight-display text-3xl md:text-5xl leading-tight">Your first chapter<br />takes twenty minutes.</h2>
        <p className="mt-3 text-ink/60">Free forever · No credit card · Leave any time with your words</p>
        <Link to="/register" className="btn mt-7 !bg-ink !text-paper !px-8 !py-3.5 text-base font-bold hover:brightness-125">Claim your pen name →</Link>
      </section>
    </div>
  );
}
