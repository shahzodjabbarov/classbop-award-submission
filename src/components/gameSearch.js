/**
 * Normalize a string for forgiving search:
 * lowercase, strip accents/diacritics, collapse whitespace.
 */
export function normalizeForSearch(value) {
  return (value ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Smart multi-token match: every whitespace-separated token in `query`
 * must appear somewhere across the provided `fields`.
 * Returns true for an empty query so lists show everything by default.
 */
export function matchesSearch(query, fields) {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeForSearch(
    (Array.isArray(fields) ? fields : [fields]).filter(Boolean).join(' ')
  );

  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}
