const SONG_SEARCH_URL = 'https://api.lyrics.ovh/suggest';
const LYRICS_URL = 'https://api.lyrics.ovh/v1';

// Keep the random picker focused on useful vocabulary instead of glue words.
const COMMON_WORDS = new Set([
  'about', 'after', 'again', 'against', 'all', 'also', 'and', 'are', 'around',
  'because', 'been', 'before', 'being', 'could', 'did', 'does', 'doing',
  'down', 'each', 'from', 'have', 'having', 'here', 'just', 'like', 'little',
  'more', 'most', 'much', 'never', 'only', 'other', 'over', 'really', 'same',
  'should', 'some', 'than', 'that', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'under', 'very', 'want', 'were', 'what',
  'when', 'where', 'which', 'while', 'with', 'would', 'your', 'youre',
]);

function cleanLyricText(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function makeSongResult(result) {
  return {
    id: `song-${result.id}`,
    title: result.title?.trim() || 'Untitled song',
    artist: result.artist?.name?.trim() || 'Unknown artist',
    album: result.album?.title?.trim() || '',
    // Deezer serves these over plain http, which the browser blocks as mixed
    // content once the app is on https.
    artworkUrl: (result.album?.cover_big || result.album?.cover_medium || result.cover || '')
      .replace(/^http:/, 'https:'),
    trackUrl: result.link?.replace(/^http:/, 'https:') || '',
  };
}

export async function searchSongs(query, { signal } = {}) {
  const term = String(query || '').trim();
  if (!term) return [];

  const response = await fetch(`${SONG_SEARCH_URL}/${encodeURIComponent(term)}`, { signal });
  if (!response.ok) throw new Error('song-search-failed');

  const data = await response.json();
  const seen = new Set();
  return (data.data || [])
    .filter((result) => result.id && result.title && result.artist?.name)
    .map(makeSongResult)
    .filter((song) => {
      if (seen.has(song.id)) return false;
      seen.add(song.id);
      return true;
    });
}

export async function fetchSongLyrics(song, { signal } = {}) {
  if (!song?.artist || !song?.title) throw new Error('song-required');

  const artist = encodeURIComponent(song.artist);
  const titleCandidates = [song.title, song.title.replace(/\s*\([^)]*\)/g, '').trim()]
    .filter((title, index, titles) => title && titles.indexOf(title) === index);

  for (const titleCandidate of titleCandidates) {
    const title = encodeURIComponent(titleCandidate);
    const response = await fetch(`${LYRICS_URL}/${artist}/${title}`, { signal });
    if (!response.ok) continue;

    const data = await response.json();
    const lyrics = cleanLyricText(data.lyrics);
    if (lyrics) return lyrics;
  }

  throw new Error('lyrics-not-found');
}

function normalizeWord(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

export function isBlankCandidate(value) {
  const normalized = normalizeWord(value);
  return normalized.length >= 5 && !COMMON_WORDS.has(normalized) && !/^\d+$/.test(normalized);
}

export function parseLyrics(lyrics) {
  const lines = cleanLyricText(lyrics).split('\n');
  let wordIndex = 0;

  return lines.map((line, lineIndex) => {
    const parts = [];
    const matcher = /(\p{L}[\p{L}'’-]*)|([^\p{L}]+)/gu;
    let match;

    while ((match = matcher.exec(line))) {
      if (match[1]) {
        const value = match[1];
        parts.push({
          id: `line-${lineIndex}-word-${wordIndex}`,
          type: 'word',
          value,
          eligible: isBlankCandidate(value),
        });
        wordIndex += 1;
      } else {
        parts.push({ id: `line-${lineIndex}-space-${parts.length}`, type: 'space', value: match[2] });
      }
    }

    return { id: `line-${lineIndex}`, parts };
  });
}

export function pickRandomBlankIds(lines, count) {
  const candidates = lines.flatMap((line) => line.parts.filter((part) => part.type === 'word' && part.eligible));
  const targetCount = Math.min(Math.max(0, count), candidates.length);
  if (!targetCount) return [];

  const wordCounts = candidates.reduce((counts, part) => {
    const word = normalizeWord(part.value);
    counts.set(word, (counts.get(word) || 0) + 1);
    return counts;
  }, new Map());
  const shuffle = (items) => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  };

  const uniqueCandidates = candidates.filter((part) => wordCounts.get(normalizeWord(part.value)) === 1);
  const repeatedGroups = shuffle([...wordCounts.entries()])
    .filter(([, frequency]) => frequency > 1)
    .sort(([, leftFrequency], [, rightFrequency]) => leftFrequency - rightFrequency)
    .map(([word]) => shuffle(candidates.filter((part) => normalizeWord(part.value) === word))[0]);
  const uniquePicks = shuffle(uniqueCandidates).slice(0, targetCount);
  const remainingCount = targetCount - uniquePicks.length;
  const repeatedPicks = repeatedGroups.slice(0, Math.min(2, remainingCount));
  const selected = [...uniquePicks, ...repeatedPicks];

  // If a song has too little unique vocabulary, fill the remainder with one
  // occurrence from each remaining word before repeating any answer.
  if (selected.length < targetCount) {
    const selectedIds = new Set(selected.map((part) => part.id));
    const selectedWords = new Set(selected.map((part) => normalizeWord(part.value)));
    const freshWordGroups = shuffle([...wordCounts.keys()])
      .filter((word) => !selectedWords.has(word))
      .sort((left, right) => wordCounts.get(left) - wordCounts.get(right))
      .map((word) => shuffle(candidates.filter((part) => !selectedIds.has(part.id) && normalizeWord(part.value) === word))[0]);
    selected.push(...freshWordGroups.slice(0, targetCount - selected.length));

    if (selected.length < targetCount) {
      const usedIds = new Set(selected.map((part) => part.id));
      const fallbackCandidates = shuffle(candidates.filter((part) => !usedIds.has(part.id)))
        .sort((left, right) => wordCounts.get(normalizeWord(left.value)) - wordCounts.get(normalizeWord(right.value)));
      selected.push(...fallbackCandidates.slice(0, targetCount - selected.length));
    }
  }

  return selected.map((part) => part.id);
}

export function countBlankCandidates(lines) {
  return lines.reduce((count, line) => count + line.parts.filter((part) => part.type === 'word' && part.eligible).length, 0);
}
