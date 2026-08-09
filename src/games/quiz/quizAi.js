// =========================================================================
// Quiz-Bop AI generation — MOCK IMPLEMENTATION
//
// This is the only file that needs to change when the real API is ready.
// Both functions keep the same signatures and return shapes; swap the
// bodies for fetch() calls to the backend (Supabase Edge Function etc.).
// =========================================================================

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'this', 'that', 'these',
  'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'to', 'of', 'in',
  'on', 'at', 'for', 'with', 'from', 'by', 'as', 'it', 'its', 'they', 'them',
  'their', 'we', 'our', 'you', 'your', 'he', 'she', 'his', 'her', 'i', 'me',
  'my', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'has',
  'have', 'had', 'not', 'no', 'so', 'up', 'out', 'about', 'into', 'over',
  'after', 'before', 'between', 'because', 'when', 'while', 'where', 'which',
  'who', 'what', 'how', 'why', 'there', 'here', 'also', 'than', 'too', 'very',
  'just', 'more', 'most', 'some', 'any', 'each', 'other', 'all', 'both',
  'was', 'were', 'am', 'been', 'get', 'got', 'make', 'made', 'like', 'one',
  'two', 'use', 'used', 'using',
]);

const FALLBACK_KEYWORDS = [
  'Weather', 'Seasons', 'Temperature', 'Rainbow', 'Thunderstorm',
  'Forecast', 'Umbrella', 'Sunshine', 'Blizzard', 'Climate',
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Step 1 — read the teacher's material and pull out the key vocabulary.
 *
 * @param {{ text: string, files: File[] }} input
 * @returns {Promise<{ keywords: string[] }>}
 *
 * TODO(api): replace with a call to the generation endpoint. Files should be
 * sent as-is (the model reads PDFs and photos natively — no OCR step needed).
 */
export async function extractKeywords({ text, files = [] }) {
  await delay(1600 + Math.random() * 900);

  const counts = new Map();
  const words = (text || '').split(/[^\p{L}\p{N}'-]+/u);
  for (const raw of words) {
    const word = raw.replace(/^['-]+|['-]+$/g, '');
    if (word.length < 3) continue;
    const lower = word.toLowerCase();
    if (STOPWORDS.has(lower)) continue;
    const entry = counts.get(lower) || { count: 0, display: titleCase(word) };
    entry.count += 1;
    if (word[0] === word[0].toUpperCase()) entry.display = titleCase(word);
    counts.set(lower, entry);
  }

  const ranked = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map((entry) => entry.display)
    .slice(0, 12);

  // Photos/PDFs can't be read without the real API, so a demo set fills in
  // when the teacher uploaded files but pasted little or no text.
  if (ranked.length < 4 && files.length > 0) {
    const padding = FALLBACK_KEYWORDS.filter((word) => !ranked.includes(word));
    return { keywords: [...ranked, ...padding].slice(0, 10) };
  }

  if (ranked.length === 0) {
    return { keywords: FALLBACK_KEYWORDS.slice(0, 8) };
  }

  return { keywords: ranked };
}

/**
 * Step 2 — turn the reviewed key-word cards into quiz questions.
 *
 * @param {{ items: Array<{ word: string, image?: string }>, count: number,
 *   mode: 'answer'|'choices'|'mix', level: string }} input
 * @returns {Promise<{ title: string, questions: Array<{
 *   question: string, hint: string, answer: string, image: string,
 *   choices: string[]|null, correctChoice: number|null, points: number
 * }> }>}
 *
 * Each item's image (matched on the key-word step) is attached to the
 * question generated from it, so questions arrive in the builder with
 * pictures already in place.
 *
 * TODO(api): replace with a call to the generation endpoint (structured
 * output, one JSON schema — same shape as the return type above). Keep
 * attaching item.image to the generated question client-side.
 */
export async function generateQuizQuestions({ items, count, mode, level }) {
  await delay(2600 + Math.random() * 1200);

  const pool = items.length
    ? items
    : FALLBACK_KEYWORDS.map((word) => ({ word, image: '' }));
  const questions = [];

  for (let index = 0; index < count; index += 1) {
    const item = pool[index % pool.length];
    const keyword = item.word;
    const useChoices = mode === 'choices' || (mode === 'mix' && index % 2 === 1);

    if (useChoices && pool.length >= 4) {
      const distractors = pool
        .filter((other) => other.word !== keyword)
        .slice(0, 3)
        .map((other) => other.word);
      const choices = [keyword, ...distractors];
      // Shuffle so the right answer isn't always first.
      for (let i = choices.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
      }
      questions.push({
        question: `Which word matches this picture or clue: "${keyword}" is the answer!`,
        hint: `Placeholder question — the real API will write a proper clue for ${level} level.`,
        answer: keyword,
        image: item.image || '',
        points: 10,
        choices,
        correctChoice: choices.indexOf(keyword),
      });
    } else {
      questions.push({
        question: `What is the word for "${keyword}"?`,
        hint: `Placeholder question — the real API will write a proper one for ${level} level.`,
        answer: keyword,
        image: item.image || '',
        points: 10,
        choices: null,
        correctChoice: null,
      });
    }
  }

  return {
    title: `${pool[0].word} Review`,
    questions,
  };
}
