import { useEffect, useMemo, useState } from 'react';
import { makeCommonsSearchUrl, normalizeCommonsResults } from './mediaSearch';
import './MediaSearchPicker.css';

const GIPHY_API = 'https://api.giphy.com/v1/gifs/search';
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';

function makeGiphySearchUrl(query) {
  const params = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    q: query,
    limit: '30',
    rating: 'g',
    lang: 'en',
    bundle: 'messaging_non_clips',
  });
  return `${GIPHY_API}?${params.toString()}`;
}

function normalizeGiphyResults(data) {
  return (data?.data || [])
    .map((gif) => {
      const preview = gif.images?.fixed_width_small?.url
        || gif.images?.preview_gif?.url
        || gif.images?.downsized?.url;
      const full = gif.images?.downsized_medium?.url
        || gif.images?.downsized?.url
        || gif.images?.original?.url;
      if (!preview || !full) return null;
      return {
        id: `giphy-${gif.id}`,
        title: gif.title || 'GIF',
        url: full,
        previewUrl: preview,
        mime: 'image/gif',
      };
    })
    .filter(Boolean);
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default function MediaSearchPicker({
  title = 'Search Images & GIFs',
  initialQuery = '',
  allowedModes = ['image', 'gif'],
  onClose,
  onSelect,
}) {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [requestId, setRequestId] = useState(0);
  const [mode, setMode] = useState(() => allowedModes[0] || 'image');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(initialQuery.trim()));
  const [error, setError] = useState('');

  const visibleItems = useMemo(() => items.slice(0, 18), [items]);

  useEffect(() => {
    if (!submittedQuery.trim()) {
      return undefined;
    }

    const controller = new AbortController();
    const searchUrl = mode === 'gif'
      ? makeGiphySearchUrl(submittedQuery.trim())
      : makeCommonsSearchUrl(submittedQuery.trim());

    const searchRequest = mode === 'gif' && !GIPHY_API_KEY
      ? Promise.reject(new Error('missing-giphy-key'))
      : fetch(searchUrl, { signal: controller.signal });

    searchRequest
      .then((response) => {
        if (!response.ok) throw new Error('search-failed');
        return response.json();
      })
      .then((data) => {
        setItems(mode === 'gif' ? normalizeGiphyResults(data) : normalizeCommonsResults(data));
      })
      .catch((searchError) => {
        if (searchError.name !== 'AbortError') {
          setError(searchError.message === 'missing-giphy-key'
            ? 'GIF search needs a GIPHY API key.'
            : 'Search is unavailable right now. Try again in a moment.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [mode, submittedQuery, requestId]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      setItems([]);
      setError('');
      setSubmittedQuery('');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    setSubmittedQuery(nextQuery);
    setRequestId((currentId) => currentId + 1);
  };

  const handleModeChange = (nextMode) => {
    if (nextMode === mode || !allowedModes.includes(nextMode)) return;
    setMode(nextMode);
    setItems([]);
    setError('');
    if (submittedQuery.trim()) {
      setIsLoading(true);
      setRequestId((currentId) => currentId + 1);
    }
  };

  const handlePick = (item) => {
    onSelect({
      url: item.mime === 'image/gif' ? item.url : item.previewUrl,
      title: item.title,
      mime: item.mime,
    });
  };

  return (
    <div className="media-search-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <section className="media-search-panel">
        <header className="media-search-head">
          <div>
            <p>Quick media</p>
            <h2>{title}</h2>
          </div>
          <button type="button" className="media-search-close" onClick={onClose} aria-label="Close search">×</button>
        </header>

        <form className="media-search-form" onSubmit={handleSubmit}>
          <input
            value={query}
            autoFocus
            placeholder="Search a word, phrase, or topic..."
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" aria-label="Search media"><SearchIcon /></button>
        </form>

        {allowedModes.length > 1 && (
          <div className="media-search-tabs" role="tablist" aria-label="Media type">
            <button type="button" className={mode === 'image' ? 'selected' : ''} onClick={() => handleModeChange('image')}>Images</button>
            <button type="button" className={mode === 'gif' ? 'selected' : ''} onClick={() => handleModeChange('gif')}>GIFs</button>
          </div>
        )}

        <div className="media-search-results">
          {isLoading && <p className="media-search-message">Searching...</p>}
          {!isLoading && error && <p className="media-search-message error">{error}</p>}
          {!isLoading && !error && submittedQuery && visibleItems.length === 0 && (
            <p className="media-search-message">No {mode === 'gif' ? 'GIFs' : 'images'} found. Try another search.</p>
          )}
          {!isLoading && !error && !submittedQuery && (
            <p className="media-search-message">Search once, tap a result, and it is added to the question.</p>
          )}
          {visibleItems.map((item) => (
            <button key={item.id} type="button" className="media-search-result" onClick={() => handlePick(item)}>
              <img src={item.previewUrl} alt="" loading="lazy" />
              <span>{item.title}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
