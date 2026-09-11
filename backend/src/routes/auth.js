import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { signToken, authRequired } from '../middleware/auth.js';
import { registerLimiter, loginLimiter, writeLimiter, resendLimiter } from '../middleware/security.js';
import { sendVerificationEmail } from '../utils/mailer.js';
import { useDb, memUsers } from '../config/store.js';

const router = express.Router();
let seq = 1;

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const publicUser = (u) => ({
  id: u._id, username: u.username, penName: u.penName, email: u.email,
  role: u.role, isAuthor: !!u.isAuthor, isVerified: !!u.isVerified,
  avatar: u.avatar || '', bio: u.bio || '', createdAt: u.createdAt || null
});
const verificationLink = (token) =>
  `${(process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0]}/verify-email?token=${token}`;

async function byEmail(email) {
  if (useDb()) return User.findOne({ email });
  return memUsers.find((u) => u.email === email) || null;
}

router.post('/register',
  registerLimiter,
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res, next) => {
    try {
      const e = validationResult(req);
      if (!e.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: e.array() });
      const { username, email, password, penName } = req.body;
      if (await byEmail(email)) return res.status(409).json({ error: 'Email already registered' });
      // Debug fix: username was never checked — two accounts could share one
      // identity, enabling impersonation of authors.
      const nameTaken = useDb()
        ? await User.findOne({ username })
        : memUsers.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
      if (nameTaken) return res.status(409).json({ error: 'Username is taken' });
      const passwordHash = await bcrypt.hash(password, 10);
      const vToken = crypto.randomBytes(32).toString('hex');
      const vFields = {
        isVerified: false, avatar: '',
        verifyToken: sha256(vToken), verifyExpires: new Date(Date.now() + 24 * 3600e3)
      };
      let user;
      if (useDb()) {
        const count = await User.countDocuments();
        user = await User.create({ username, penName: penName || username, email, passwordHash, role: count === 0 ? 'admin' : 'user', ...vFields });
        user = user.toObject();
      } else {
        user = { _id: `u${seq++}`, username, penName: penName || username, email, passwordHash, role: memUsers.length === 0 ? 'admin' : 'user', isAuthor: false, bio: '', library: [], createdAt: new Date(), ...vFields };
        user.id = user._id; memUsers.push(user);
      }
      const token = signToken({ _id: user._id, role: user.role });
      let verificationSent = false;
      try { verificationSent = (await sendVerificationEmail(email, verificationLink(vToken))).delivered; } catch {}
      res.status(201).json({ token, user: publicUser(user), verificationSent });
    } catch (err) { next(err); }
  });

router.post('/login', loginLimiter, body('email').isEmail(), body('password').notEmpty(), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await byEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    const id = user._id?.toString?.() ?? user._id;
    res.json({ token: signToken({ _id: id, role: user.role }), user: publicUser({ ...user, _id: id }) });
  } catch (err) { next(err); }
});

router.get('/me', authRequired, async (req, res) => {
  let user;
  if (useDb()) user = await User.findById(req.user.id).lean();
  else user = memUsers.find((u) => u._id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(publicUser(user));
});

// Clicked from the email link — verifies the address (24h expiry).
router.get('/verify-email', async (req, res, next) => {
  try {
    const h = sha256(req.query.token || '');
    if (!req.query.token) return res.status(400).json({ error: 'Missing token' });
    let user;
    if (useDb()) {
      user = await User.findOne({ verifyToken: h, verifyExpires: { $gt: new Date() } });
    } else {
      user = memUsers.find((u) => u.verifyToken === h && u.verifyExpires && new Date(u.verifyExpires) > new Date());
    }
    if (!user) return res.status(400).json({ error: 'Invalid or expired link — request a new one from your profile.' });
    user.isVerified = true; user.verifyToken = ''; user.verifyExpires = null;
    if (useDb()) await user.save();
    res.json({ ok: true, user: publicUser(user.toObject ? user.toObject() : user) });
  } catch (err) { next(err); }
});

// Resend the verification email (tightly throttled — it's a spam vector).
router.post('/resend-verification', authRequired, resendLimiter, async (req, res, next) => {
  try {
    let user;
    if (useDb()) user = await User.findById(req.user.id);
    else user = memUsers.find((u) => u._id === req.user.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (user.isVerified) return res.json({ ok: true });
    const vToken = crypto.randomBytes(32).toString('hex');
    user.verifyToken = sha256(vToken);
    user.verifyExpires = new Date(Date.now() + 24 * 3600e3);
    if (useDb()) await user.save();
    try { await sendVerificationEmail(user.email, verificationLink(vToken)); } catch {}
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Become an author — one click from the profile page. Authors keep ownership
// of everything they publish; this just unlocks the writing dashboard.
router.post('/become-author', authRequired, writeLimiter, async (req, res, next) => {
  try {
    const { penName, bio } = req.body;
    if (!penName?.trim() || penName.length > 30) return res.status(400).json({ error: 'Pen name (1–30 chars) is required' });
    const patch = { penName: penName.trim(), bio: String(bio || '').slice(0, 500), isAuthor: true };
    let user;
    if (useDb()) {
      user = await User.findByIdAndUpdate(req.user.id, patch, { new: true }).lean();
      if (!user) return res.status(404).json({ error: 'Not found' });
    } else {
      user = memUsers.find((u) => u._id === req.user.id);
      if (!user) return res.status(404).json({ error: 'Not found' });
      Object.assign(user, patch);
    }
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

// Edit own profile (pen name + bio)
router.patch('/me', authRequired, writeLimiter, async (req, res, next) => {
  try {
    const patch = {};
    if (req.body.penName !== undefined) {
      if (!req.body.penName.trim() || req.body.penName.length > 30) return res.status(400).json({ error: 'Pen name must be 1–30 chars' });
      patch.penName = req.body.penName.trim();
    }
    if (req.body.bio !== undefined) patch.bio = String(req.body.bio).slice(0, 500);
    if (req.body.avatar !== undefined) {
      const a = String(req.body.avatar);
      if (a.length > 2000) return res.status(400).json({ error: 'Avatar too large' });
      const isUrl = /^https?:\/\//i.test(a) || /^data:image\//i.test(a);
      if (a && !isUrl && [...a].length > 8) return res.status(400).json({ error: 'Invalid avatar' });
      patch.avatar = a;
    }
    let user;
    if (useDb()) {
      user = await User.findByIdAndUpdate(req.user.id, patch, { new: true }).lean();
      if (!user) return res.status(404).json({ error: 'Not found' });
    } else {
      user = memUsers.find((u) => u._id === req.user.id);
      if (!user) return res.status(404).json({ error: 'Not found' });
      Object.assign(user, patch);
    }
    res.json(publicUser(user));
  } catch (err) { next(err); }
});

export default router;
