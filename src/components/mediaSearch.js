// Shared media-search helpers (Wikimedia Commons — no API key needed).
// Used by the MediaSearchPicker modal and, programmatically, by the AI quiz
// generator to auto-match a picture to each key word.

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export function cleanTitle(title) {
  return (title || '')
    .replace(/^File:/i, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function makeCommonsSearchUrl(query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '28',
    gsrsearch: query,
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '420',
  });
  return `${COMMONS_API}?${params.toString()}`;
}

export function normalizeCommonsResults(data) {
  const pages = Object.values(data?.query?.pages || {});
  return pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info?.url || !info.mime?.startsWith('image/')) return null;
      return {
        id: `commons-${page.pageid}`,
        title: cleanTitle(page.title),
        url: info.thumburl || info.url,
        previewUrl: info.thumburl || info.url,
        mime: info.mime,
      };
    })
    .filter(Boolean);
}

export async function searchMediaImages(query, { signal, limit = 6 } = {}) {
  const response = await fetch(makeCommonsSearchUrl(query), { signal });
  if (!response.ok) throw new Error('search-failed');
  const data = await response.json();
  return normalizeCommonsResults(data).slice(0, limit);
}
