const LETTERS = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index));
const NUMBERS = Array.from({ length: 75 }, (_, index) => String(index + 1));
const COUNTRIES = [
  { id: 'united-states', emoji: '🇺🇸', label: 'United States' },
  { id: 'canada', emoji: '🇨🇦', label: 'Canada' },
  { id: 'mexico', emoji: '🇲🇽', label: 'Mexico' },
  { id: 'brazil', emoji: '🇧🇷', label: 'Brazil' },
  { id: 'argentina', emoji: '🇦🇷', label: 'Argentina' },
  { id: 'united-kingdom', emoji: '🇬🇧', label: 'United Kingdom' },
  { id: 'ireland', emoji: '🇮🇪', label: 'Ireland' },
  { id: 'france', emoji: '🇫🇷', label: 'France' },
  { id: 'germany', emoji: '🇩🇪', label: 'Germany' },
  { id: 'italy', emoji: '🇮🇹', label: 'Italy' },
  { id: 'spain', emoji: '🇪🇸', label: 'Spain' },
  { id: 'portugal', emoji: '🇵🇹', label: 'Portugal' },
  { id: 'netherlands', emoji: '🇳🇱', label: 'Netherlands' },
  { id: 'switzerland', emoji: '🇨🇭', label: 'Switzerland' },
  { id: 'sweden', emoji: '🇸🇪', label: 'Sweden' },
  { id: 'norway', emoji: '🇳🇴', label: 'Norway' },
  { id: 'greece', emoji: '🇬🇷', label: 'Greece' },
  { id: 'turkey', emoji: '🇹🇷', label: 'Turkey' },
  { id: 'egypt', emoji: '🇪🇬', label: 'Egypt' },
  { id: 'morocco', emoji: '🇲🇦', label: 'Morocco' },
  { id: 'south-africa', emoji: '🇿🇦', label: 'South Africa' },
  { id: 'nigeria', emoji: '🇳🇬', label: 'Nigeria' },
  { id: 'kenya', emoji: '🇰🇪', label: 'Kenya' },
  { id: 'china', emoji: '🇨🇳', label: 'China' },
  { id: 'japan', emoji: '🇯🇵', label: 'Japan' },
  { id: 'south-korea', emoji: '🇰🇷', label: 'South Korea' },
  { id: 'india', emoji: '🇮🇳', label: 'India' },
  { id: 'thailand', emoji: '🇹🇭', label: 'Thailand' },
  { id: 'vietnam', emoji: '🇻🇳', label: 'Vietnam' },
  { id: 'philippines', emoji: '🇵🇭', label: 'Philippines' },
  { id: 'indonesia', emoji: '🇮🇩', label: 'Indonesia' },
  { id: 'malaysia', emoji: '🇲🇾', label: 'Malaysia' },
  { id: 'singapore', emoji: '🇸🇬', label: 'Singapore' },
  { id: 'saudi-arabia', emoji: '🇸🇦', label: 'Saudi Arabia' },
  { id: 'united-arab-emirates', emoji: '🇦🇪', label: 'United Arab Emirates' },
  { id: 'australia', emoji: '🇦🇺', label: 'Australia' },
  { id: 'new-zealand', emoji: '🇳🇿', label: 'New Zealand' },
  { id: 'colombia', emoji: '🇨🇴', label: 'Colombia' },
  { id: 'peru', emoji: '🇵🇪', label: 'Peru' },
  { id: 'chile', emoji: '🇨🇱', label: 'Chile' },
];

export const BINGO_GAMES = [
  {
    id: 'abc',
    title: 'ABC Bingo',
    shortTitle: 'ABC',
    thumbnail: '/thumbnails/bingo/abc-bingo-v2.jpg',
    description: 'Build letter recognition and listening skills from A to Z.',
    pickerHint: 'Call out the letter on the ball.',
    items: LETTERS,
    colors: ['#FF5C7A', '#FFB800', '#FFEB00', '#72E06A', '#51B7FF'],
    preview: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
  },
  {
    id: 'numbers',
    title: 'Numbers Bingo',
    shortTitle: '1–75',
    thumbnail: '/thumbnails/bingo/numbers-bingo-v2.jpg',
    description: 'Practice listening for numbers with a classic 1 to 75 set.',
    pickerHint: 'Read the number and give students time to find it.',
    items: NUMBERS,
    colors: ['#845EF7', '#51B7FF', '#2DDBA4', '#FFEB00', '#FF8A4C'],
    preview: ['7', '18', '24', '31', '42', '53', '61', '68', '75'],
  },
  {
    id: 'countries',
    title: 'Countries Bingo',
    shortTitle: '🌎',
    thumbnail: '/thumbnails/bingo/countries-bingo-v2.jpg',
    description: 'Match popular country names with their flags for geography review.',
    pickerHint: 'Call out the country name and show the flag.',
    items: COUNTRIES,
    colors: ['#FF5C7A', '#51B7FF', '#FFB800', '#2DDBA4', '#845EF7'],
    preview: COUNTRIES.slice(0, 9),
  },
];

export const GRID_SIZES = [2, 3, 4, 5];
export const MAX_CARD_COUNT = 20;
export const CUSTOM_BINGO_GAME_ID = 'custom';

export function parseCustomBingoWords(value) {
  const seen = new Set();
  return String(value || '')
    .split(/[\n,]/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => {
      const key = word.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeCustomBingoItem(item, index) {
  if (item && typeof item === 'object') {
    const label = String(item.label || item.word || '').trim();
    const image = String(item.image || '').trim();
    if (!label && !image) return null;
    return {
      id: item.id || `custom-${index}-${label || image.slice(0, 18)}`,
      label,
      image,
    };
  }

  const label = String(item || '').trim();
  if (!label) return null;
  return { id: `custom-${index}-${label}`, label, image: '' };
}

export function normalizeCustomBingoItems(items) {
  const sourceItems = Array.isArray(items) ? items : parseCustomBingoWords(items);
  const seen = new Set();

  return sourceItems
    .map(normalizeCustomBingoItem)
    .filter(Boolean)
    .filter((item) => {
      const key = `${item.label.toLocaleLowerCase()}|${item.image}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function createCustomBingoGame({ title, words, items, pickerHint }) {
  const normalizedItems = normalizeCustomBingoItems(items || words);

  return {
    id: CUSTOM_BINGO_GAME_ID,
    isCustom: true,
    title: title?.trim() || 'Custom Bingo',
    shortTitle: 'DIY',
    description: 'A temporary custom Bingo set.',
    pickerHint: pickerHint || 'Call out the word on the card.',
    items: normalizedItems,
    colors: ['#FF5C7A', '#51B7FF', '#FFB800', '#2DDBA4', '#845EF7'],
    preview: normalizedItems.slice(0, 9),
  };
}

export function getBingoGame(gameId) {
  return BINGO_GAMES.find((game) => game.id === gameId);
}

export function getBingoItemKey(item) {
  if (item && typeof item === 'object' && 'id' in item) return item.id;
  return String(item);
}

export function getBingoItemLabel(item) {
  if (item && typeof item === 'object' && 'label' in item) return item.label || '';
  return String(item);
}

export function getBingoItemEmoji(item) {
  if (item && typeof item === 'object' && 'emoji' in item) return item.emoji;
  return '';
}

export function getBingoItemImage(item) {
  if (item && typeof item === 'object' && 'image' in item) return item.image || '';
  return '';
}

function randomIndex(max) {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    window.crypto.getRandomValues(value);
    return value[0] % max;
  }

  return Math.floor(Math.random() * max);
}

export function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function generateBingoCards(game, gridSize, count) {
  const cellCount = gridSize * gridSize;
  const cards = [];
  const seenCards = new Set();
  let attempts = 0;

  while (cards.length < count && attempts < count * 30) {
    const cells = shuffle(game.items).slice(0, cellCount);
    const signature = cells.map(getBingoItemKey).join('|');
    attempts += 1;

    if (!seenCards.has(signature)) {
      seenCards.add(signature);
      cards.push(cells);
    }
  }

  return cards;
}

export function pickRandomItem(items) {
  return items[randomIndex(items.length)];
}
