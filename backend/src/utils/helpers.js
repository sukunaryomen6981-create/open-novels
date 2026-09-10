export function slugify(s = '') {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80) || `story-${Date.now()}`;
}
export function coverImage(title, i = 0) {
  const p = [['1e1b2e','c4b5fd'],['0f2a2e','7dd3fc'],['2e1b1e','fda4af'],['1e2a1b','bef264'],['2a2118','fcd34d']];
  const [bg, fg] = p[i % p.length];
  return `https://placehold.co/600x900/${bg}/${fg}?text=${encodeURIComponent(title)}`;
}
