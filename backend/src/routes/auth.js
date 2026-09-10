import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { signToken, authRequired } from '../middleware/auth.js';
import { registerLimiter, loginLimiter, writeLimiter } from '../middleware/security.js';
import { useDb, memUsers } from '../config/store.js';

const router = express.Router();
let seq = 1;

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
      let user;
      if (useDb()) {
        const count = await User.countDocuments();
        user = await User.create({ username, penName: penName || username, email, passwordHash, role: count === 0 ? 'admin' : 'user' });
        user = user.toObject();
      } else {
        user = { _id: `u${seq++}`, username, penName: penName || username, email, passwordHash, role: memUsers.length === 0 ? 'admin' : 'user', isAuthor: false, bio: '', library: [], createdAt: new Date() };
        user.id = user._id; memUsers.push(user);
      }
      const token = signToken({ _id: user._id, role: user.role });
      res.status(201).json({ token, user: { id: user._id, username, penName: user.penName, email, role: user.role, isAuthor: !!user.isAuthor, bio: user.bio || '', createdAt: user.createdAt || null } });
    } catch (err) { next(err); }
  });

router.post('/login', loginLimiter, body('email').isEmail(), body('password').notEmpty(), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await byEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    const id = user._id?.toString?.() ?? user._id;
    res.json({ token: signToken({ _id: id, role: user.role }), user: { id, username: user.username, penName: user.penName, email: user.email, role: user.role, isAuthor: !!user.isAuthor, bio: user.bio || '', createdAt: user.createdAt || null } });
  } catch (err) { next(err); }
});

router.get('/me', authRequired, async (req, res) => {
  let user;
  if (useDb()) user = await User.findById(req.user.id).lean();
  else user = memUsers.find((u) => u._id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user._id, username: user.username, penName: user.penName, email: user.email, role: user.role, isAuthor: !!user.isAuthor, bio: user.bio || '', createdAt: user.createdAt || null });
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
    res.json({ user: { id: user._id, username: user.username, penName: user.penName, email: user.email, role: user.role, isAuthor: true, bio: user.bio || '', createdAt: user.createdAt || null } });
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
    let user;
    if (useDb()) {
      user = await User.findByIdAndUpdate(req.user.id, patch, { new: true }).lean();
      if (!user) return res.status(404).json({ error: 'Not found' });
    } else {
      user = memUsers.find((u) => u._id === req.user.id);
      if (!user) return res.status(404).json({ error: 'Not found' });
      Object.assign(user, patch);
    }
    res.json({ id: user._id, username: user.username, penName: user.penName, email: user.email, role: user.role, isAuthor: !!user.isAuthor, bio: user.bio || '', createdAt: user.createdAt || null });
  } catch (err) { next(err); }
});

export default router;
