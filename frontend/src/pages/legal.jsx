import { Link } from 'react-router-dom';

// Shared shell for all legal pages. Plain-language summaries up top,
// full text below. NOT legal advice — have a local lawyer review before
// you rely on these, and replace [bracketed placeholders] with your details.
const UPDATED = 'September 10, 2026';

function Shell({ eyebrow, title, summary, children }) {
  return (
    <div className="py-8 max-w-3xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brass">{eyebrow}</p>
      <h1 className="font-display font-semibold tracking-tight-display text-3xl md:text-4xl mt-2">{title}</h1>
      <p className="text-xs text-paper/40 mt-2">Last updated: {UPDATED}</p>
      <div className="mt-4 rounded-2xl border border-brass/30 bg-brass/[0.07] p-5 text-sm leading-relaxed">{summary}</div>
      <div className="mt-6 space-y-6 text-[0.95rem] leading-relaxed text-paper/80">
        {children}
      </div>
      <nav className="mt-10 pt-5 border-t hairline flex gap-4 flex-wrap text-sm">
        <Link to="/terms" className="text-brass">Terms</Link>
        <Link to="/privacy" className="text-brass">Privacy</Link>
        <Link to="/guidelines" className="text-brass">Guidelines</Link>
        <Link to="/legal" className="text-brass">Copyright</Link>
      </nav>
    </div>
  );
}

function H({ children }) {
  return <h2 className="font-display font-semibold text-xl text-paper">{children}</h2>;
}

function P({ children }) {
  return <p>{children}</p>;
}

function UL({ items }) {
  return <ul className="list-disc pl-5 space-y-1.5">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>;
}

export function Terms() {
  return (
    <Shell eyebrow="Legal · Terms" title="Terms of Service"
      summary={<>By creating an account or publishing on OpenNovels you agree to these terms. Short version: <b>you own your stories</b>, post only what you own, don't abuse the service, and the platform is provided as-is by volunteers.</>}>
      <section className="space-y-2"><H>1. Who this is for</H>
        <P>OpenNovels is a free platform for reading and publishing original fiction. You must be at least 13 years old (or the minimum age in your country) to hold an account. If you're under 18, you confirm a parent or guardian has reviewed these terms with you.</P></section>
      <section className="space-y-2"><H>2. Your account</H>
        <P>You register with a username, email, and password. You are responsible for keeping your login secure and for everything posted under your account. One person, one account — sock-puppets used to manipulate ratings or harass will be removed.</P></section>
      <section className="space-y-2"><H>3. Your stories stay yours</H>
        <P><b>You keep full copyright</b> to everything you publish. By publishing here you grant OpenNovels only the limited license needed to operate the service: hosting, displaying, backing up, and distributing your work to readers through the site, strictly under the reader license <b>you</b> choose per story (CC-BY, CC-BY-SA, CC0, or all-rights-reserved).</P>
        <P>This site's <b>source code is MIT open source</b> — that license covers the software, never your stories.</P></section>
      <section className="space-y-2"><H>4. Acceptable use</H>
        <P>You agree not to:</P>
        <UL items={[
          'Post writing you don’t own or that isn’t public domain — no copied books, no plagiarized chapters, no mass auto-uploaded content.',
          'Post unlawful content, credible threats, doxxing, hate speech, or harassment.',
          'Post sexual content involving minors, in any form — zero tolerance, immediate ban and report where required.',
          'Spam, scam, phish, or mislead readers (fake chapters, malware links, impersonation).',
          'Scrape, bulk-copy, or republish other authors’ stories from this site.',
          'Attack, disrupt, or reverse-engineer the service.'
        ]} /></section>
      <section className="space-y-2"><H>5. Moderation & removal</H>
        <P>We may edit metadata, unlist, or remove any content, and suspend or terminate accounts that break these terms or the <Link to="/guidelines" className="text-brass">Community Guidelines</Link> — usually with a warning first, immediately for serious abuse. See the <Link to="/legal" className="text-brass">Copyright page</Link> for takedown requests.</P></section>
      <section className="space-y-2"><H>6. Leaving</H>
        <P>You can export and delete your stories and account at any time from your profile (or by emailing us). Deletion removes your public content; anonymized backups may persist briefly for operational reasons.</P></section>
      <section className="space-y-2"><H>7. No warranties, limited liability</H>
        <P>The service is provided <b>"as is"</b> without warranties of any kind. To the maximum extent allowed by law, OpenNovels and its contributors are not liable for indirect or consequential damages, lost content, or disputes between users. Nothing here limits rights you hold under consumer law.</P></section>
      <section className="space-y-2"><H>8. Changes & contact</H>
        <P>We may update these terms and will note the revision date above; continued use means acceptance. Questions: <b>abuse@example.com</b>. Governing law: the laws of [Your Jurisdiction] — replace this placeholder before launch.</P></section>
    </Shell>
  );
}

export function Privacy() {
  return (
    <Shell eyebrow="Legal · Privacy" title="Privacy Policy"
      summary={<>We collect the <b>minimum needed to run the site</b> — your account, your stories, your reading progress. <b>No ads, no trackers, no data sales.</b> Delete your account any time and your personal data goes with it.</>}>
      <section className="space-y-2"><H>1. What we collect</H>
        <UL items={[
          'Account: username, pen name, email, password hash, bio, author status.',
          'Content: stories, chapters, genres, and licenses you publish.',
          'Reading activity: library saves, reading progress, and history (so "continue reading" works).',
          'Technical minimum: basic server logs (timestamps, error traces) to keep the site running.'
        ]} /></section>
      <section className="space-y-2"><H>2. What we never do</H>
        <UL items={[
          'No advertising or ad trackers. No third-party analytics that follow you across the web.',
          'We never sell, rent, or share your personal data with data brokers.',
          'We don’t scan your private drafts for advertising; drafts are only stored so you can publish them.'
        ]} /></section>
      <section className="space-y-2"><H>3. Cookies & local storage</H>
        <P>We don’t set tracking cookies. Your login session and on-device conveniences (theme, offline reading progress, local drafts) live in your browser’s local storage — clearing site data logs you out and removes them.</P></section>
      <section className="space-y-2"><H>4. Your rights</H>
        <P>Access, correct, export, or delete your data any time from your profile page, or email <b>abuse@example.com</b> from your account address. We answer data requests within 30 days. Deleting your account deletes your profile, stories, library, and history from active systems.</P></section>
      <section className="space-y-2"><H>5. Children & retention</H>
        <P>Accounts require age 13+. If we learn a younger child holds an account, we delete it. We keep data only while your account exists or as needed to operate, secure, and legally comply — then it’s removed or anonymized.</P></section>
      <section className="space-y-2"><H>6. Changes</H>
        <P>Material changes will be noted with a new revision date above (and announced on-site for significant ones). Contact: <b>abuse@example.com</b>.</P></section>
    </Shell>
  );
}

export function Guidelines() {
  return (
    <Shell eyebrow="Community" title="Community Guidelines"
      summary={<>Be original, be kind, label honestly. These rules keep OpenNovels a place readers trust and writers want to be discovered on. Enforcement: warning → content removal → temporary suspension → permanent ban.</>}>
      <section className="space-y-2"><H>1. Originality is the whole point</H>
        <P>Post only writing you created or that is genuinely public domain. Plagiarism — including lightly rewritten copies — is removed on first confirmed report. AI-assisted work is allowed only if you hold the rights to post it and it follows every other rule; mass auto-uploads are treated as spam.</P></section>
      <section className="space-y-2"><H>2. Respect readers and writers</H>
        <P>No harassment, hate speech, threats, or doxxing — in stories, bios, or comments where they exist. Critique the work, never attack the person. Don’t brigade other authors’ pages.</P></section>
      <section className="space-y-2"><H>3. Adult content, handled carefully</H>
        <UL items={[
          'Any sexual content must involve only consenting adult characters.',
          'Anything involving minors is banned instantly, no warnings.',
          'Gratuitous explicit content used to shock or bait clicks may be unlisted.',
          'Graphic gore needs a content note in the synopsis or first chapter.'
        ]} /></section>
      <section className="space-y-2"><H>4. No spam or manipulation</H>
        <P>No fake chapters, misleading titles, link farms, mass duplicate stories, fake accounts boosting ratings, or commercial spam. Promote your work in designated spaces (contests, genre browsing), not by gaming the system.</P></section>
      <section className="space-y-2"><H>5. Reporting</H>
        <P>Found a violation? Email <b>abuse@example.com</b> with links and a short description. Good-faith reporters are never punished; false-report campaigns are themselves a violation.</P></section>
    </Shell>
  );
}

export function Copyright() {
  return (
    <Shell eyebrow="Legal · Copyright" title="Copyright & Takedown"
      summary={<>OpenNovels hosts <b>only authorized work</b>: original writing, public-domain text, or uploads where the poster holds the rights. Rights holders can request removal below — valid requests are actioned promptly.</>}>
      <section className="space-y-2"><H>1. Our stance</H>
        <P>No scraping, no cloning other sites, no DRM bypasses, no piracy tools — the platform contains none, and using the service to infringe violates the <Link to="/terms" className="text-brass">Terms</Link>. Repeat infringers lose their accounts permanently.</P></section>
      <section className="space-y-2"><H>2. Filing a takedown notice</H>
        <P>Email <b>abuse@example.com</b> with all of the following:</P>
        <UL items={[
          'Identification of the copyrighted work (title, author, publication proof or registration).',
          'The exact URLs on this site where it appears.',
          'Your name, address, email, and relationship to the work.',
          'A statement that you have a good-faith belief the use is unauthorized.',
          'A statement, under penalty of perjury, that your notice is accurate and you’re authorized to act.',
          'Your physical or electronic signature.'
        ]} /></section>
      <section className="space-y-2"><H>3. What happens next</H>
        <P>Valid notices lead to prompt removal or disabling of the material, plus notice to the uploader, who may file a counter-notice with the same details plus consent to jurisdiction. In disputes we follow the law of [Your Jurisdiction] and restore content only when the law allows.</P></section>
      <section className="space-y-2"><H>4. Authors: protect yourself</H>
        <P>Keep your originals dated, choose the license you mean (CC-BY is sharing-friendly; all-rights-reserved keeps control), and report copies of your work here or anywhere else the moment you spot them.</P></section>
    </Shell>
  );
}
