import jwt from 'jsonwebtoken';
export function signToken(user) {
  return jwt.sign({ id: user._id || user.id, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}
export function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'Login required' });
  try { req.user = jwt.verify(t, process.env.JWT_SECRET || 'dev-secret'); next(); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }
}
export function authOptional(req, _res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (t) { try { req.user = jwt.verify(t, process.env.JWT_SECRET || 'dev-secret'); } catch {} }
  next();
}
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}
export function errorHandler(err, _req, res, _next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
}
