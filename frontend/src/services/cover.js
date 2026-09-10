import { GENRE_EMOJI } from './mockData.js';

// Auto-generated covers: tiny inline SVG data URIs (a few hundred bytes),
// so they persist in the database forever with zero storage costs.
// Authors with their own art can paste an image link instead.
export const COVER_STYLES = [
  { bg1: '#2A1F14', bg2: '#0F0C08', fg: '#E5A83B' },
  { bg1: '#1E2A2E', bg2: '#0D1416', fg: '#7DD3FC' },
  { bg1: '#2E1B22', bg2: '#150D11', fg: '#FDA4AF' },
  { bg1: '#1C2A1A', bg2: '#0C120B', fg: '#BEF264' },
  { bg1: '#2A2118', bg2: '#12100B', fg: '#FCD34D' }
];

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrapTitle(title) {
  const words = String(title || 'Untitled').split(/\s+/).filter(Boolean).slice(0, 10);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > 14) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, 4);
}

export function makeCover(title, genre, styleIdx = 0) {
  const s = COVER_STYLES[styleIdx % COVER_STYLES.length];
  const emoji = GENRE_EMOJI[genre] || '✒️';
  const lines = wrapTitle(title);
  const startY = 470 - (lines.length - 1) * 34;
  const textEls = lines.map((ln, i) =>
    `<text x="300" y="${startY + i * 68}" text-anchor="middle" font-family="Georgia, serif" font-weight="bold" font-size="56" fill="${s.fg}">${esc(ln)}</text>`
  ).join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.bg1}"/><stop offset="1" stop-color="${s.bg2}"/></linearGradient></defs>` +
    `<rect width="600" height="900" fill="url(#g)"/>` +
    `<circle cx="300" cy="240" r="120" fill="none" stroke="${s.fg}" stroke-width="3" opacity="0.5"/>` +
    `<text x="300" y="285" text-anchor="middle" font-size="110">${emoji}</text>` +
    `<line x1="150" y1="380" x2="450" y2="380" stroke="${s.fg}" stroke-width="2" opacity="0.5"/>` +
    textEls +
    `<text x="300" y="830" text-anchor="middle" font-family="Georgia, serif" font-size="30" letter-spacing="8" fill="${s.fg}" opacity="0.7">OPENNOVELS</text>` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
