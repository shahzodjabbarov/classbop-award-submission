/**
 * Answer matching for Class Feud.
 *
 * A guess arrives either typed or from the microphone, so it is rarely an
 * exact string match: speech recognition adds articles and punctuation,
 * students type plurals, and everyone misspells. The matcher walks from the
 * strictest test to the loosest so an obvious answer never gets rejected while
 * two genuinely different tiles never collide.
 */

const FILLER_WORDS = new Set([
  'a', 'an', 'the', 'some', 'any', 'my', 'your', 'his', 'her', 'their', 'our', 'its',
  'is', 'are', 'was', 'were', 'be', 'to', 'of', 'in', 'on', 'at', 'and', 'or',
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'that', 'this', 'these', 'those',
  'something', 'someone', 'maybe', 'like', 'um', 'uh', 'well', 'please',
]);

/** Lowercases, drops accents and punctuation, and collapses whitespace. */
export function normalizeGuess(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Crude but predictable singulariser — enough for classroom vocabulary. */
function singularize(word) {
  if (word.length <= 3) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ches') || word.endsWith('shes') || word.endsWith('xes') || word.endsWith('sses')) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us')) return word.slice(0, -1);
  return word;
}

/** Content words only, singularised, so "the dogs" and "a dog" line up. */
function keyWords(value) {
  return normalizeGuess(value)
    .split(' ')
    .filter((word) => word && !FILLER_WORDS.has(word))
    .map(singularize);
}

function keyForm(value) {
  return keyWords(value).join(' ');
}

/** Standard Levenshtein distance, bailing out once it passes `limit`. */
function editDistance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowBest = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
      rowBest = Math.min(rowBest, current[j]);
    }

    if (rowBest > limit) return limit + 1;
    previous = current;
  }

  return previous[b.length];
}

/** Typo tolerance grows with word length: 0 for tiny words, up to 2 for long ones. */
function typoAllowance(length) {
  if (length <= 3) return 0;
  if (length <= 6) return 1;
  return 2;
}

function isCloseEnough(guessKey, targetKey) {
  if (!guessKey || !targetKey) return false;
  if (guessKey === targetKey) return true;

  const limit = typoAllowance(Math.min(guessKey.length, targetKey.length));
  if (limit === 0) return false;
  return editDistance(guessKey, targetKey, limit) <= limit;
}

/**
 * Scores one guess against one answer.
 * Returns 0 when it does not match, or a confidence between 1 and 4 so the
 * caller can pick the single best tile when a guess brushes against several.
 */
function scoreAgainstAnswer(guess, answer) {
  const guessKey = keyForm(guess);
  if (!guessKey) return 0;

  const targets = [answer.text, ...(answer.aliases || [])].filter(Boolean);
  let best = 0;

  for (const target of targets) {
    const targetKey = keyForm(target);
    if (!targetKey) continue;

    // Exact (after normalising) — the strongest possible signal.
    if (normalizeGuess(guess) === normalizeGuess(target)) return 4;
    if (guessKey === targetKey) return 4;

    // A short answer said inside a longer sentence: "I think it's the fridge".
    const guessWords = guessKey.split(' ');
    const targetWords = targetKey.split(' ');
    if (targetWords.every((word) => guessWords.includes(word))) best = Math.max(best, 3);
    if (guessWords.every((word) => targetWords.includes(word))) best = Math.max(best, 3);

    // Typos and speech-to-text slips.
    if (isCloseEnough(guessKey, targetKey)) best = Math.max(best, 2);

    // A single key word landing on a multi-word answer ("bbq" → "Korean BBQ").
    if (guessWords.length === 1 && targetWords.some((word) => isCloseEnough(guessWords[0], word))) {
      best = Math.max(best, 1);
    }
  }

  return best;
}

/**
 * Finds the best unrevealed answer for a guess.
 * Returns { index, score } or null when nothing matched.
 */
export function findFeudMatch(guess, answers, revealedIndexes = []) {
  const revealed = new Set(revealedIndexes);
  let bestIndex = -1;
  let bestScore = 0;

  answers.forEach((answer, index) => {
    if (revealed.has(index)) return;
    const score = scoreAgainstAnswer(guess, answer);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex === -1 ? null : { index: bestIndex, score: bestScore };
}

/**
 * True when the guess matches an answer that is already face-up, so the board
 * can say "already revealed" instead of handing out a strike.
 */
export function findRevealedMatch(guess, answers, revealedIndexes = []) {
  for (const index of revealedIndexes) {
    if (answers[index] && scoreAgainstAnswer(guess, answers[index]) > 0) return index;
  }
  return -1;
}
