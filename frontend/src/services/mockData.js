// No bundled stories — the library starts empty and grows from user writing.
export const GENRES = ['Fantasy','Sci-Fi','Romance','Mystery','Horror','Adventure','Drama','Comedy','Thriller','Historical','Slice of Life','Poetry','Action','Crime','Dystopian','Epic','Gothic','Cyberpunk','Space Opera','Urban Fantasy','Paranormal','Western','Mythology','Satire','Tragedy'];
// One distinctive glyph per genre, drawn from each genre's classic symbolism:
// Greek masks for drama, the quill for poetry, Zeus's bolt for mythology,
// the detective's key for mystery, noir city lights for crime, and so on.
export const GENRE_EMOJI = {
  'Fantasy': '🐉', 'Sci-Fi': '🛸', 'Romance': '🌹', 'Mystery': '🗝️',
  'Horror': '🩸', 'Adventure': '🧭', 'Drama': '🎭', 'Comedy': '🃏',
  'Thriller': '🫀', 'Historical': '🏛️', 'Slice of Life': '🍵', 'Poetry': '🪶',
  'Action': '⚔️', 'Crime': '🌃', 'Dystopian': '🏭', 'Epic': '🏰',
  'Gothic': '🦇', 'Cyberpunk': '🌆', 'Space Opera': '🚀', 'Urban Fantasy': '🌉',
  'Paranormal': '👻', 'Western': '🤠', 'Mythology': '⚡', 'Satire': '🪞',
  'Tragedy': '🥀'
};
export const genreEmoji = (g) => GENRE_EMOJI[g] || '📖';
export const sampleNovels = [];
export function sampleChapters() {
  return [];
}
