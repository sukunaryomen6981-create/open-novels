import { rateLimit } from 'express-rate-limit';

// Render/hosting sits behind a proxy — without this, every visitor shares
// one IP and rate limits would hit everyone at once.
export const TRUST_PROXY_HOPS = 1;

// Strips NoSQL-injection keys (`$gt`, `$ne`, dotted paths) from JSON bodies
// and query strings. Our filters only ever expect plain strings/numbers.
function scrub(value) {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object') {
    const clean = {};
    for (const k of Object.keys(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      clean[k] = scrub(value[k]);
    }
    return clean;
  }
  return value;
}

export function sanitizeInput(req, _res, next) {
  if (req.body) req.body = scrub(req.body);
  if (req.query) {
    for (const k of Object.keys(req.query)) {
      if (k.startsWith('$') || k.includes('.')) delete req.query[k];
      else req.query[k] = scrub(req.query[k]);
    }
  }
  next();
}

const base = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down and try again shortly.' }
};

// Flood protection for the whole API. 500/15min is generous for humans,
// brutal for naive flood scripts.
export const generalLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 500 });

// Mass account creation is the #1 abuse vector for UGC sites (spam, ban
// evasion). 10 new accounts per IP per 15 minutes stops scripts cold while
// never bothering real signups.
export const registerLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Too many accounts created from this address — please wait 15 minutes.' }
});

// Login: only FAILED attempts count, so real users never notice it while
// password-guessing scripts burn through their budget in seconds.
export const loginLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  message: { error: 'Too many failed logins — please wait 15 minutes.' }
});

// Publishing endpoints: 60 writes/hour per IP stops content-flood bots.
// (Logged-in bulk abuse is additionally traceable to the account for bans.)
export const writeLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 60,
  message: { error: 'Publishing limit reached for this hour — please wait and try again.' }
});

// Verification emails: 5 resends/15min — generous for humans, useless for
// anyone trying to turn your mailer into a spam cannon.
export const resendLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many resends — please wait a few minutes.' }
});
