import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameHowToPanel from '../components/GameHowToPanel';
import {
  countBlankCandidates,
  fetchSongLyrics,
  parseLyrics,
  pickRandomBlankIds,
  searchSongs,
} from '../games/lyricsPlay/lyricsApi';
import './LyricsPlay.css';

const BLANK_COUNTS = [6, 8, 10, 12, 16];

// Album art lives on Deezer's CDN; the hash is the only part that varies.
const cover = (hash) => `https://cdn-images.dzcdn.net/images/cover/${hash}/250x250-000000-80-0-0.jpg`;

// Starter shelf so the library is never an empty box. Picking one runs a real
// song search behind the scenes and selects the closest match.
const FEATURED_SONGS = [
  { id: 'feat-good-day-sunshine', title: 'Good Day Sunshine', artist: 'The Beatles', genre: 'Classic', artworkUrl: cover('6e1e24a3e4311371abd2c888b1f0e13e') },
  { id: 'feat-count-on-me', title: 'Count on Me', artist: 'Bruno Mars', genre: 'Pop', artworkUrl: cover('5b59dc18e109515420f8237719bd2186') },
  { id: 'feat-firework', title: 'Firework', artist: 'Katy Perry', genre: 'Pop', artworkUrl: cover('c7283218e496f35f1d804d3617eecb73') },
  { id: 'feat-best-day', title: 'Best Day of My Life', artist: 'American Authors', genre: 'Rock', artworkUrl: cover('b965a1aa1b44e52fa89ab7b393a80eeb') },
  { id: 'feat-happy', title: 'Happy', artist: 'Pharrell Williams', genre: 'Pop', artworkUrl: cover('a1939a9a40dc97ed404cc4597c6a32bc') },
  { id: 'feat-cant-stop', title: "Can't Stop the Feeling!", artist: 'Justin Timberlake', genre: 'Pop', artworkUrl: cover('209aa560e3b5fbe679e91887fc0c7332') },
  { id: 'feat-sky-full-of-stars', title: 'A Sky Full of Stars', artist: 'Coldplay', genre: 'Rock', artworkUrl: cover('b8caede4e53ed433a2566d9fec29d638') },
  { id: 'feat-viva-la-vida', title: 'Viva La Vida', artist: 'Coldplay', genre: 'Rock', artworkUrl: cover('eede3cd0dc3a5a87c7a5b1085b022e2d') },
  { id: 'feat-let-it-go', title: 'Let It Go', artist: 'Idina Menzel', genre: 'Kids', artworkUrl: cover('f669aa7623ad8af5fbeb5a196346013a') },
  { id: 'feat-how-far-ill-go', title: "How Far I'll Go", artist: "Auli'i Cravalho", genre: 'Kids', artworkUrl: cover('846f7d5f33ade67c54841ae1db6756ef') },
  { id: 'feat-friend-in-me', title: "You've Got a Friend in Me", artist: 'Randy Newman', genre: 'Kids', artworkUrl: cover('8db611b3f6e9e3b846413fc566267cb2') },
  { id: 'feat-stand-by-me', title: 'Stand by Me', artist: 'Ben E. King', genre: 'Classic', artworkUrl: cover('efe117f19e86acfddfb8d047f2d1ab06') },
  { id: 'feat-wonderful-world', title: 'What a Wonderful World', artist: 'Louis Armstrong', genre: 'Classic', artworkUrl: cover('a7a471ea9f14193811d0af5ece533585') },
  { id: 'feat-dynamite', title: 'Dynamite', artist: 'BTS', genre: 'K-Pop', artworkUrl: cover('a4cd18eed9833c7d10fc7a830573bf23') },
  { id: 'feat-boy-with-luv', title: 'Boy With Luv', artist: 'BTS', genre: 'K-Pop', artworkUrl: cover('ba01e3de4d64a272543c427914c49e8b') },
];

const GENRES = ['All', 'Pop', 'Rock', 'Kids', 'Classic', 'K-Pop'];

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

// Catalog titles carry reissue tags the classroom does not need to see. The
// untouched title still goes to the lyrics lookup.
const displayTitle = (title) => String(title || '')
  .replace(/\s*[([][^)\]]*(remaster|remastered|version|edit|mono|stereo|deluxe|bonus|anniversary|explicit)[^)\]]*[)\]]/gi, '')
  .replace(/\s*-\s*(remaster|remastered|single version|album version)[^-]*$/gi, '')
  .trim() || String(title || '');

// Search returns tribute/karaoke acts alongside the real thing, and those
// rarely have lyrics — score title *and* artist so the original wins.
function rankMatches(results, item) {
  const wantedTitle = normalizeText(item.title);
  const wantedArtist = normalizeText(item.artist);

  const score = (song) => {
    const title = normalizeText(song.title);
    const artist = normalizeText(song.artist);
    let points = 0;
    if (title === wantedTitle) points += 5;
    else if (title.startsWith(wantedTitle)) points += 3;
    else if (title.includes(wantedTitle)) points += 1;
    if (artist === wantedArtist) points += 5;
    else if (artist.includes(wantedArtist) || wantedArtist.includes(artist)) points += 2;
    return points;
  };

  return results
    .map((song) => ({ song, points: score(song) }))
    .filter((entry) => entry.points > 0)
    .sort((left, right) => right.points - left.points)
    .map((entry) => entry.song);
}

function Icon({ name, className }) {
  const paths = {
    back: <path d="M15 5 8 12l7 7" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    play: <path d="M9 6.5v11l9-5.5-9-5.5Z" fill="currentColor" stroke="none" />,
    chevron: <path d="m6 9.5 6 6 6-6" />,
    arrow: <path d="M5 12h13m-5.5-6 6 6-6 6" />,
    refresh: <><path d="M20 11a8 8 0 1 0-.9 4.6" /><path d="M20 5v6h-6" /></>,
    printer: <><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="7" rx="2" /><path d="M7 14h10v6H7z" /></>,
    key: <><path d="M4 20 13 11" /><path d="m8 16 2 2" /><circle cx="16.5" cy="7.5" r="3.5" /></>,
    share: <><circle cx="17" cy="6" r="2.6" /><circle cx="6.5" cy="12" r="2.6" /><circle cx="17" cy="18" r="2.6" /><path d="m8.9 10.7 5.7-3.2m0 9.1-5.7-3.2" /></>,
    external: <><path d="M14 5h5v5" /><path d="M19 5 11 13" /><path d="M18 14.5V19H5V6h4.5" /></>,
    sparkle: <path d="M12 4.5c.8 4.4 2 6.2 6.5 7-4.5.8-5.7 2.6-6.5 7-.8-4.4-2-6.2-6.5-7 4.5-.8 5.7-2.6 6.5-7Z" />,
    cursor: <path d="M6 3.5 18.5 11l-5.6 1.4L10.4 18 6 3.5Z" />,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1.6" /><rect x="13" y="4" width="7" height="7" rx="1.6" /><rect x="4" y="13" width="7" height="7" rx="1.6" /><rect x="13" y="13" width="7" height="7" rx="1.6" /></>,
    check: <path d="m5 12.5 4.5 4.5L19 7" />,
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

function MusicNoteIcon() {
  return <span className="lyrics-play-note" aria-hidden="true">♪</span>;
}

function SongArtwork({ song, size = 'small', tone = 0 }) {
  // Tracking the failed URL (rather than a boolean) lets a new song retry on
  // its own without resetting state from an effect.
  const [failedUrl, setFailedUrl] = useState('');

  return song.artworkUrl && failedUrl !== song.artworkUrl ? (
    <img
      className={`lyrics-play-artwork is-${size}`}
      src={song.artworkUrl}
      alt=""
      loading="lazy"
      onError={() => setFailedUrl(song.artworkUrl)}
    />
  ) : (
    <div className={`lyrics-play-artwork lyrics-play-artwork-placeholder is-${size} tone-${tone % 5}`} aria-hidden="true">
      <MusicNoteIcon />
    </div>
  );
}

function SongRow({ song, tone, selected, busy, onSelect }) {
  return (
    <button
      type="button"
      className={`lyrics-play-song-row${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(song)}
      disabled={busy}
    >
      <span className="lyrics-play-row-art">
        <SongArtwork song={song} tone={tone} />
        <span className="lyrics-play-row-badge" aria-hidden="true">
          <Icon name="play" />
        </span>
      </span>
      <span className="lyrics-play-song-row-copy">
        <strong>{displayTitle(song.title)}</strong>
        <small>{song.artist}</small>
        {song.album && <em>{song.album}</em>}
      </span>
      <span className="lyrics-play-row-go" aria-hidden="true">
        {busy ? <i className="lyrics-play-spinner" /> : <Icon name="arrow" />}
      </span>
    </button>
  );
}

function LyricsSheet({ song, lines, blankIds, showAnswers = false, onWordClick }) {
  return (
    <article className={`lyrics-play-sheet${showAnswers ? ' is-answer-key' : ''}${onWordClick ? ' is-picking' : ''}`}>
      <div className="lyrics-play-sheet-topline">
        <span className="lyrics-play-sheet-brand"><MusicNoteIcon /> LYRICS PLAY</span>
        <span className="lyrics-play-sheet-label">{showAnswers ? 'ANSWER KEY' : 'STUDENT SHEET'}</span>
      </div>
      <div className="lyrics-play-sheet-heading">
        <div>
          <p>Listen • Read • Sing</p>
          <h2>{displayTitle(song.title)}</h2>
          <span>{song.artist}</span>
        </div>
        <div className="lyrics-play-name-line">
          <span>NAME</span>
          <i />
        </div>
      </div>
      <div className="lyrics-play-lyrics" aria-label={`${song.title} lyrics`}>
        {lines.map((line) => (
          <p key={line.id} className="lyrics-play-lyric-line">
            {line.parts.map((part) => {
              if (part.type === 'space') return <span key={part.id}>{part.value}</span>;
              const isBlank = !showAnswers && blankIds.has(part.id);
              // In pick-your-own mode every word is fair game; the "smart word"
              // filter only matters for the random generator.
              const clickable = onWordClick ? true : part.eligible;
              return (
                <button
                  key={part.id}
                  type="button"
                  className={`lyrics-play-word${isBlank ? ' is-blank' : ''}${clickable ? ' is-eligible' : ''}`}
                  onClick={() => onWordClick?.(part)}
                  disabled={!onWordClick || showAnswers}
                  aria-label={isBlank ? 'Blank' : part.value}
                >
                  {isBlank ? '________' : part.value}
                </button>
              );
            })}
          </p>
        ))}
      </div>
      <footer className="lyrics-play-sheet-footer">
        <span>classbop.com</span>
        <span>{showAnswers ? 'Teacher copy' : 'Sing it together!'}</span>
      </footer>
    </article>
  );
}

export default function LyricsPlay() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [genre, setGenre] = useState('All');
  const [selectedSong, setSelectedSong] = useState(null);
  const [activeFeaturedId, setActiveFeaturedId] = useState('');
  const [pendingId, setPendingId] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [error, setError] = useState('');
  const [howToOpen, setHowToOpen] = useState(false);
  const [blankMode, setBlankMode] = useState('random');
  const [blankCount, setBlankCount] = useState(10);
  const [blankIds, setBlankIds] = useState(() => new Set());
  const [printMode, setPrintMode] = useState('worksheet');
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  const lyricLines = useMemo(() => parseLyrics(lyrics), [lyrics]);
  const candidateCount = useMemo(() => countBlankCandidates(lyricLines), [lyricLines]);
  const featured = useMemo(
    () => (genre === 'All' ? FEATURED_SONGS : FEATURED_SONGS.filter((song) => song.genre === genre)),
    [genre],
  );
  const activeBlankCount = blankIds.size;
  const showingResults = songs.length > 0;

  useEffect(() => {
    document.body.classList.add('lyrics-play-print-context');
    return () => document.body.classList.remove('lyrics-play-print-context');
  }, []);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const runSearch = async (query = searchTerm) => {
    const term = query.trim();
    if (!term) return;
    setSearchTerm(term);
    setSearching(true);
    setError('');
    try {
      const results = await searchSongs(term);
      setSongs(results);
      setActiveQuery(term);
      if (!results.length) setError(`No songs matched “${term}”. Try another title or artist.`);
    } catch {
      setSongs([]);
      setActiveQuery(term);
      setError('We could not reach the song library. Check the internet connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveQuery('');
    setSongs([]);
    setError('');
  };

  const loadSong = async (song) => {
    setSelectedSong(song);
    setLyrics('');
    setBlankIds(new Set());
    setLoadingLyrics(true);
    setError('');
    try {
      const nextLyrics = await fetchSongLyrics(song);
      const nextLines = parseLyrics(nextLyrics);
      setLyrics(nextLyrics);
      // Only the random generator pre-fills blanks — manual and no-blanks
      // modes should hand over a fully visible sheet for every new song.
      if (blankMode === 'random') setBlankIds(new Set(pickRandomBlankIds(nextLines, blankCount)));
    } catch {
      setError(`Lyrics are not available for “${song.title}” right now. Try another song.`);
    } finally {
      setLoadingLyrics(false);
    }
  };

  const chooseSong = (song) => {
    setActiveFeaturedId('');
    loadSong(song);
  };

  // Featured picks are only a title + artist, so resolve them through the same
  // search endpoint. Ranked candidates are tried in order because the top match
  // occasionally has no lyrics entry.
  const chooseFeatured = async (item) => {
    setPendingId(item.id);
    setError('');
    try {
      const candidates = rankMatches(await searchSongs(`${item.title} ${item.artist}`), item).slice(0, 4);
      if (!candidates.length) {
        setError(`We could not find “${item.title}” in the song library right now.`);
        return;
      }

      setActiveFeaturedId(item.id);
      setSelectedSong(candidates[0]);
      setLyrics('');
      setBlankIds(new Set());
      setLoadingLyrics(true);

      for (const candidate of candidates) {
        try {
          const nextLyrics = await fetchSongLyrics(candidate);
          const nextLines = parseLyrics(nextLyrics);
          setSelectedSong(candidate);
          setLyrics(nextLyrics);
          if (blankMode === 'random') setBlankIds(new Set(pickRandomBlankIds(nextLines, blankCount)));
          return;
        } catch {
          // Try the next-best match before giving up on this song.
        }
      }

      setError(`Lyrics are not available for “${item.title}” right now. Try another song.`);
    } catch {
      setError('We could not reach the song library. Check the internet connection and try again.');
    } finally {
      setPendingId('');
      setLoadingLyrics(false);
    }
  };

  const toggleWord = (part) => {
    if (blankMode !== 'manual') return;
    setBlankIds((current) => {
      const next = new Set(current);
      if (next.has(part.id)) next.delete(part.id);
      else next.add(part.id);
      return next;
    });
  };

  const regenerate = () => setBlankIds(new Set(pickRandomBlankIds(lyricLines, blankCount)));

  // Manual mode starts from a full, readable sheet — the teacher builds the
  // blanks by tapping, so carrying the random set over just confuses things.
  const handleBlankModeChange = (nextMode) => {
    setBlankMode(nextMode);
    if (nextMode === 'random') regenerate();
    else setBlankIds(new Set());
  };

  const handleBlankCountChange = (nextCount) => {
    setBlankCount(nextCount);
    if (blankMode === 'random') setBlankIds(new Set(pickRandomBlankIds(lyricLines, nextCount)));
  };

  const printSheet = (mode) => {
    setPrintMode(mode);
    window.setTimeout(() => window.print(), 0);
  };

  const copySongLink = async () => {
    const link = selectedSong?.trackUrl || window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copying is blocked in this browser. Use the “Open song” link instead.');
    }
  };

  return (
    <div className="lyrics-play-page">
      <div className="lyrics-play-decor" aria-hidden="true">
        <span className="lyrics-play-decor-note is-one">♪</span>
        <span className="lyrics-play-decor-note is-two">♫</span>
        <span className="lyrics-play-decor-note is-three">♪</span>
        <span className="lyrics-play-decor-dots" />
      </div>

      <header className="lyrics-play-header">
        <button type="button" className="lyrics-play-back" onClick={() => navigate('/activities')}>
          <Icon name="back" /> Activities
        </button>
        <div className="lyrics-play-title-block">
          <p className="lyrics-play-kicker">CLASSROOM MUSIC GAME</p>
          <h1><MusicNoteIcon /> Lyrics Play</h1>
          <p>Find a real song, turn key words into blanks, and print a sing-along worksheet.</p>
        </div>
        <GameHowToPanel
          render="toggle"
          isOpen={howToOpen}
          onToggle={() => setHowToOpen((open) => !open)}
        />
      </header>

      <GameHowToPanel
        render="panel"
        isOpen={howToOpen}
        paragraphs={[
          'Search for a song, choose how the blanks should be made, then print the student sheet. Random mode favors words that appear once in the full song, so repeated choruses do not give away most answers. Use the answer key for checking.',
        ]}
        tags={['Song search', 'Smart blanks', 'Print ready']}
      />

      <main className="lyrics-play-layout">
        <aside className="lyrics-play-library">
          <div className="lyrics-play-panel-heading">
            <p className="lyrics-play-eyebrow">SONG LIBRARY</p>
            <h2>Choose a song</h2>
          </div>

          <form className="lyrics-play-search" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
            <div className="lyrics-play-search-field">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search a song or artist…"
                aria-label="Search a song or artist"
              />
              {searchTerm && (
                <button type="button" className="lyrics-play-search-clear" onClick={clearSearch} aria-label="Clear search">
                  <Icon name="close" />
                </button>
              )}
            </div>
            <button type="submit" className="lyrics-play-search-go" disabled={searching} aria-label="Search songs">
              {searching ? <i className="lyrics-play-spinner is-light" /> : <Icon name="search" />}
            </button>
          </form>

          <div className="lyrics-play-chips">
            {GENRES.map((item) => (
              <button
                type="button"
                key={item}
                className={`lyrics-play-chip${genre === item ? ' is-active' : ''}`}
                onClick={() => setGenre(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {showingResults && (
            <div className="lyrics-play-result-note">
              <span>Results for “{activeQuery}”</span>
              <button type="button" onClick={clearSearch}>Clear</button>
            </div>
          )}

          {error && !selectedSong && <p className="lyrics-play-error">{error}</p>}

          <div className="lyrics-play-results">
            {searching && <p className="lyrics-play-library-status">Finding songs…</p>}

            {!searching && showingResults && songs.map((song, index) => (
              <SongRow
                key={song.id}
                song={song}
                tone={index}
                selected={selectedSong?.id === song.id && !activeFeaturedId}
                busy={false}
                onSelect={chooseSong}
              />
            ))}

            {!searching && !showingResults && featured.map((song, index) => (
              <SongRow
                key={song.id}
                song={song}
                tone={index}
                selected={activeFeaturedId === song.id}
                busy={pendingId === song.id}
                onSelect={chooseFeatured}
              />
            ))}

            {!searching && !showingResults && !featured.length && (
              <p className="lyrics-play-library-empty">Nothing here yet — search a title or artist instead.</p>
            )}
          </div>

          <p className="lyrics-play-source-note">Song search and lyrics use the public lyrics.ovh music API.</p>
        </aside>

        <section className="lyrics-play-workspace">
          {!selectedSong ? (
            <div className="lyrics-play-empty-workspace">
              <div className="lyrics-play-empty-note"><MusicNoteIcon /></div>
              <p className="lyrics-play-eyebrow">READY WHEN YOU ARE</p>
              <h2>Pick a song to make a worksheet</h2>
              <span>Students can sing, read, and fill in the missing words.</span>
            </div>
          ) : (
            <>
              <div className="lyrics-play-workspace-heading">
                <div className="lyrics-play-selected-song">
                  <SongArtwork song={selectedSong} size="medium" />
                  <div>
                    <p className="lyrics-play-eyebrow">NOW MAKING</p>
                    <h2>{displayTitle(selectedSong.title)}</h2>
                    <span>{selectedSong.artist}</span>
                  </div>
                </div>
                {selectedSong.trackUrl && (
                  <a className="lyrics-play-listen" href={selectedSong.trackUrl} target="_blank" rel="noreferrer">
                    Open song <Icon name="external" />
                  </a>
                )}
              </div>

              {loadingLyrics ? (
                <div className="lyrics-play-loading"><span>♪</span><strong>Loading lyrics…</strong></div>
              ) : lyrics ? (
                <>
                  <div className="lyrics-play-controls">
                    <label className="lyrics-play-control">
                      <span>BLANKS</span>
                      <div className="lyrics-play-select">
                        <Icon name="sparkle" className="lyrics-play-select-icon" />
                        <select value={blankMode} onChange={(event) => handleBlankModeChange(event.target.value)}>
                          <option value="random">Random smart words</option>
                          <option value="manual">Choose them myself</option>
                          <option value="none">No blanks</option>
                        </select>
                        <Icon name="chevron" className="lyrics-play-select-caret" />
                      </div>
                    </label>
                    <label className={`lyrics-play-control${blankMode === 'random' ? '' : ' is-disabled'}`}>
                      <span>HOW MANY</span>
                      <div className="lyrics-play-select">
                        <Icon name="grid" className="lyrics-play-select-icon" />
                        <select
                          value={blankMode === 'random' ? blankCount : ''}
                          onChange={(event) => handleBlankCountChange(Number(event.target.value))}
                          disabled={blankMode !== 'random'}
                        >
                          {blankMode !== 'random' && <option value="">Not used</option>}
                          {BLANK_COUNTS.map((count) => <option key={count} value={count}>{count} blanks</option>)}
                        </select>
                        <Icon name="chevron" className="lyrics-play-select-caret" />
                      </div>
                    </label>
                    {blankMode === 'random' && (
                      <button type="button" className="lyrics-play-regenerate" onClick={regenerate}>
                        <Icon name="refresh" /> New set
                      </button>
                    )}
                    {blankMode === 'manual' ? (
                      <p className="lyrics-play-hint">
                        <Icon name="cursor" />
                        <span>Tap an <b>underlined word</b> to hide it — tap again to undo.</span>
                        <em>{activeBlankCount} hidden</em>
                      </p>
                    ) : (
                      <span className="lyrics-play-control-status">
                        {blankMode === 'none' ? 'Full lyrics' : `${activeBlankCount} of ${candidateCount} smart words`}
                      </span>
                    )}
                  </div>

                  {error && selectedSong && <p className="lyrics-play-error">{error}</p>}
                  <div className="lyrics-play-preview-label"><span>LIVE PREVIEW</span><i /></div>
                  <div className="lyrics-play-preview">
                    <LyricsSheet
                      song={selectedSong}
                      lines={lyricLines}
                      blankIds={blankMode === 'none' ? new Set() : blankIds}
                      onWordClick={blankMode === 'manual' ? toggleWord : undefined}
                    />
                  </div>
                  <div className="lyrics-play-print-actions">
                    <button type="button" className="lyrics-play-action is-primary" onClick={() => printSheet('worksheet')}>
                      <Icon name="printer" /> Print worksheet
                    </button>
                    <button type="button" className="lyrics-play-action" onClick={() => printSheet('answer')}>
                      <Icon name="key" /> Print answer key
                    </button>
                    <button type="button" className="lyrics-play-action" onClick={copySongLink}>
                      <Icon name={copied ? 'check' : 'share'} /> {copied ? 'Link copied' : 'Copy song link'}
                    </button>
                  </div>
                  <p className="lyrics-play-lyrics-source">Lyrics fetched from lyrics.ovh when available. Keep classroom use within your local copyright rules.</p>
                </>
              ) : (
                <div className="lyrics-play-no-lyrics">
                  <p className="lyrics-play-error">{error || 'Lyrics are not available for this song.'}</p>
                  <span>Choose another result from the library to keep going.</span>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {selectedSong && lyrics && (
        <div className="lyrics-play-print-only">
          <LyricsSheet
            song={selectedSong}
            lines={lyricLines}
            blankIds={printMode === 'worksheet' && blankMode !== 'none' ? blankIds : new Set()}
            showAnswers={printMode === 'answer'}
          />
        </div>
      )}
    </div>
  );
}
