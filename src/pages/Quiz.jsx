import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QUIZ_MATCHES, pickQuizQuestions } from '../games/quiz/quizData';
import {
  DEFAULT_QUIZ_QUESTION_POINTS,
  QUIZ_CHOICE_STYLES,
  QUIZ_DESCRIPTION_MAX_LENGTH,
  deleteQuizSet,
  fetchQuizSetList,
  normalizeQuizQuestionPoints,
  useQuizMatch,
} from '../games/quiz/quizSets';
import { useAuth } from '../auth/useAuth';
import GameMenuToolbar from '../components/GameMenuToolbar';
import './Quiz.css';

const TEAM_OPTIONS = [1, 2, 3, 4];
const QUIZ_START_SOUND_SRC = '/quiz_media/game-start.mp3';
const QUIZ_CORRECT_SOUND_SRC = '/quiz_media/correct-answer-trimmed.m4a';
const QUIZ_INCORRECT_SOUND_SRC = '/quiz_media/incorrect-answer.mp3';
const QUIZ_QUESTION_CLICK_SOUND_SRC = '/quiz_media/question-click.mp3';
const QUIZ_ANSWER_REVEAL_SOUND_SRC = '/quiz_media/answer-reveal.mp3';
const QUIZ_FAVORITES_STORAGE_KEY = 'classbop:quiz-favorites';
const QUIZ_SET_LIST_CACHE_KEY = 'classbop:quiz-set-list-cache:v1';
const QUIZ_THUMBNAIL_RATIO_CACHE_KEY = 'classbop:quiz-thumbnail-ratios:v1';
const DEFAULT_QUIZ_THUMBNAIL_RATIO = 1.6;
const QUIZ_FALLBACK_THUMBNAIL = '/quiz_media/thumbnails/quiz-fallback.jpg';
const activeQuizAudio = new Set();

const SOUND_PATTERNS = {
  start: [
    { frequency: 392, endFrequency: 523, duration: 0.11, type: 'triangle', gain: 0.08 },
    { frequency: 523, endFrequency: 659, delay: 0.1, duration: 0.13, type: 'triangle', gain: 0.08 },
    { frequency: 784, delay: 0.22, duration: 0.18, type: 'sine', gain: 0.07 },
  ],
  tile: [
    { frequency: 320, endFrequency: 620, duration: 0.08, type: 'square', gain: 0.035 },
    { frequency: 900, delay: 0.035, duration: 0.06, type: 'triangle', gain: 0.028 },
  ],
  hover: [
    { frequency: 620, endFrequency: 760, duration: 0.035, type: 'sine', gain: 0.018 },
  ],
  whoosh: [
    { frequency: 150, endFrequency: 420, duration: 0.24, type: 'sawtooth', gain: 0.018 },
    { frequency: 360, endFrequency: 780, delay: 0.04, duration: 0.2, type: 'triangle', gain: 0.02 },
    { frequency: 920, endFrequency: 560, delay: 0.14, duration: 0.16, type: 'sine', gain: 0.015 },
  ],
  reveal: [
    { frequency: 196, endFrequency: 392, duration: 0.34, type: 'triangle', gain: 0.032 },
    { frequency: 523, delay: 0.14, duration: 0.2, type: 'sine', gain: 0.026 },
    { frequency: 659, delay: 0.23, duration: 0.2, type: 'sine', gain: 0.024 },
    { frequency: 988, endFrequency: 1319, delay: 0.36, duration: 0.18, type: 'triangle', gain: 0.018 },
    { frequency: 1568, delay: 0.48, duration: 0.16, type: 'sine', gain: 0.012 },
  ],
  correct: [
    { frequency: 523, duration: 0.1, type: 'triangle', gain: 0.075 },
    { frequency: 659, delay: 0.09, duration: 0.1, type: 'triangle', gain: 0.075 },
    { frequency: 784, delay: 0.18, duration: 0.18, type: 'triangle', gain: 0.085 },
  ],
  wrong: [
    { frequency: 220, endFrequency: 150, duration: 0.18, type: 'sawtooth', gain: 0.055 },
    { frequency: 175, endFrequency: 110, delay: 0.11, duration: 0.16, type: 'sawtooth', gain: 0.045 },
  ],
  finish: [
    { frequency: 523, duration: 0.11, type: 'triangle', gain: 0.07 },
    { frequency: 659, delay: 0.1, duration: 0.11, type: 'triangle', gain: 0.07 },
    { frequency: 784, delay: 0.2, duration: 0.11, type: 'triangle', gain: 0.075 },
    { frequency: 1047, delay: 0.3, duration: 0.24, type: 'sine', gain: 0.08 },
  ],
  restart: [
    { frequency: 740, endFrequency: 360, duration: 0.16, type: 'triangle', gain: 0.055 },
    { frequency: 500, endFrequency: 760, delay: 0.13, duration: 0.14, type: 'triangle', gain: 0.055 },
  ],
  close: [
    { frequency: 420, endFrequency: 260, duration: 0.1, type: 'triangle', gain: 0.045 },
  ],
  switch: [
    { frequency: 470, duration: 0.055, type: 'sine', gain: 0.03 },
  ],
};

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function BookmarkMenuIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path fill={filled ? 'currentColor' : 'none'} d="M6 4.8A2.8 2.8 0 0 1 8.8 2h6.4A2.8 2.8 0 0 1 18 4.8V21l-6-3.7L6 21Z" />
    </svg>
  );
}

function TeamAvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 20v-1.6a3.6 3.6 0 0 0-3.6-3.6H7.6A3.6 3.6 0 0 0 4 18.4V20" />
      <circle cx="9.5" cy="8.6" r="3.4" />
      <path d="M16.5 20v-1.6a3.6 3.6 0 0 0-2.2-3.32" />
      <path d="M14.2 5.32a3.4 3.4 0 0 1 0 6.56" />
    </svg>
  );
}

function StarBadgeIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="m32 5.5 7.4 15.3 16.9 2.3-12.2 11.8 3 16.8L32 43.8l-15.1 7.9 3-16.8L7.7 23.1l16.9-2.3L32 5.5Z"
        fill="currentColor"
      />
      <path
        d="m23.8 23.8 8.3-2.4 5.3-7.4"
        stroke="#fff6c7"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".7"
      />
    </svg>
  );
}

function makeDefaultTeamNames(count) {
  return Array.from({ length: count }, (_, index) => `TEAM ${index + 1}`);
}

const TEAM_COLOR_PRESETS = [
  { id: 'blue', color: '#4169e1', dark: '#2f4fbd', tint: '#eef3ff' },
  { id: 'red', color: '#e35b59', dark: '#c43f3d', tint: '#fff0f0' },
  { id: 'yellow', color: '#f2b51d', dark: '#c78600', tint: '#fff8dc' },
  { id: 'green', color: '#20a464', dark: '#147a48', tint: '#eafaf2' },
];

function getTeamColorPreset(colorId) {
  return TEAM_COLOR_PRESETS.find((preset) => preset.id === colorId) || TEAM_COLOR_PRESETS[0];
}

function makeDefaultTeamColors(count) {
  return Array.from({ length: count }, (_, index) => TEAM_COLOR_PRESETS[index % TEAM_COLOR_PRESETS.length].id);
}

function teamColorStyle(colorId, fallbackIndex = 0) {
  const preset = colorId
    ? getTeamColorPreset(colorId)
    : TEAM_COLOR_PRESETS[fallbackIndex % TEAM_COLOR_PRESETS.length];
  return {
    '--team-color': preset.color,
    '--team-color-dark': preset.dark,
    '--team-tint': preset.tint,
  };
}

function getStoredQuizFavorites() {
  try {
    const stored = window.localStorage.getItem(QUIZ_FAVORITES_STORAGE_KEY);
    const parsed = JSON.parse(stored || '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function getCachedQuizSetList() {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUIZ_SET_LIST_CACHE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cacheQuizSetList(sets) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(QUIZ_SET_LIST_CACHE_KEY, JSON.stringify(sets));
  } catch {
    // Cache is only for smoother menu entry; failing to write should not affect the quiz menu.
  }
}

function getCachedQuizThumbnailRatios() {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUIZ_THUMBNAIL_RATIO_CACHE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function cacheQuizThumbnailRatios(ratios) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(QUIZ_THUMBNAIL_RATIO_CACHE_KEY, JSON.stringify(ratios));
  } catch {
    // Image dimensions still apply for this visit if browser storage is unavailable.
  }
}

function getQuizDescriptionPreview(value) {
  const description = String(value || '').replace(/\s+/g, ' ').trim();
  if (description.length <= QUIZ_DESCRIPTION_MAX_LENGTH) return description;
  return `${description.slice(0, QUIZ_DESCRIPTION_MAX_LENGTH - 3).trimEnd()}...`;
}

function getQuizMenuColumnCount() {
  if (typeof window === 'undefined') return 5;
  if (window.innerWidth <= 640) return 1;
  if (window.innerWidth <= 920) return 2;
  if (window.innerWidth <= 1180) return 3;
  return 5;
}

function distributeQuizCards(matches, columnCount, offset = 0) {
  const columns = Array.from({ length: columnCount }, () => []);
  matches.forEach((match, index) => {
    columns[(index + offset) % columnCount].push({ match, index: index + offset });
  });
  return columns;
}

function getQuizMediaSrc(item) {
  return item?.thumbnail || item?.image || item?.thumbnailGif || item?.gif || '';
}

function playQuizAudio(src, volume = 0.82, stopAfterMs = 0) {
  if (typeof Audio === 'undefined') return;

  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = Math.min(1, Math.max(0, volume));
  activeQuizAudio.add(audio);
  const releaseAudio = () => activeQuizAudio.delete(audio);
  audio.addEventListener('ended', releaseAudio, { once: true });
  audio.addEventListener('error', releaseAudio, { once: true });

  if (stopAfterMs > 0) {
    window.setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
      releaseAudio();
    }, stopAfterMs);
  }

  audio.play().catch((error) => {
    releaseAudio();
    console.warn('Quiz audio could not play:', error);
    // Browsers can still block audio in rare cases; gameplay should never fail because of sound.
  });
}

function useQuizSounds(enabled = true, volume = 1) {
  const audioContextRef = useRef(null);

  return useCallback((name) => {
    if (!enabled || typeof window === 'undefined') return;

    const pattern = SOUND_PATTERNS[name];
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!pattern || !AudioContext) return;

    const audioContext = audioContextRef.current || new AudioContext();
    audioContextRef.current = audioContext;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const baseTime = audioContext.currentTime;

    pattern.forEach((note) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const startTime = baseTime + (note.delay || 0);
      const endTime = startTime + note.duration;

      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, startTime);
      if (note.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, endTime);
      }

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(note.gain * volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(endTime + 0.02);
    });
  }, [enabled, volume]);
}

function MatchMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const restoredMenuState = location.state?.quizMenuState;
  const didRestoreScrollRef = useRef(false);
  const [searchTerm, setSearchTerm] = useState(restoredMenuState?.searchTerm || '');
  const [showMineOnly, setShowMineOnly] = useState(Boolean(restoredMenuState?.showMineOnly));
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(Boolean(restoredMenuState?.showFavoritesOnly));
  const [favoriteIds, setFavoriteIds] = useState(getStoredQuizFavorites);
  const [customMatches, setCustomMatches] = useState(getCachedQuizSetList);
  const [menuColumnCount, setMenuColumnCount] = useState(getQuizMenuColumnCount);
  const [thumbnailRatios, setThumbnailRatios] = useState(getCachedQuizThumbnailRatios);

  useEffect(() => {
    let isActive = true;
    fetchQuizSetList()
      .then((sets) => {
        cacheQuizSetList(sets);
        if (isActive) setCustomMatches(sets);
      })
      .catch(() => {});
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    const handleResize = () => setMenuColumnCount(getQuizMenuColumnCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (didRestoreScrollRef.current || typeof restoredMenuState?.scrollY !== 'number') return;
    didRestoreScrollRef.current = true;
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: restoredMenuState.scrollY, behavior: 'auto' });
    });
  }, [restoredMenuState]);

  const handleDeleteMatch = async (match) => {
    if (!window.confirm(`Delete "${match.title}" forever?`)) return;
    try {
      await deleteQuizSet(match.id);
      setCustomMatches((sets) => {
        const nextSets = (sets || []).filter((set) => set.id !== match.id);
        cacheQuizSetList(nextSets);
        return nextSets;
      });
    } catch (deleteError) {
      window.alert(`Could not delete the quiz. ${deleteError.message}`);
    }
  };

  const visibleCustom = (customMatches || []).filter(
    (set) => set.isPublic || (user && set.authorId === user.id)
  );
  const query = searchTerm.trim().toLowerCase();
  const filterMatch = (match) => {
    if (showMineOnly && (!user || match.authorId !== user.id)) return false;
    if (showFavoritesOnly && !favoriteIds.has(match.id)) return false;
    if (!query) return true;

    return [match.title, match.subtitle, match.level, ...(match.hashtags || []).map((tag) => `#${tag}`)]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  };
  const filteredBuiltInMatches = QUIZ_MATCHES.filter(filterMatch);
  const filteredCustomMatches = visibleCustom.filter(filterMatch);
  const hasFilteredMatches = filteredBuiltInMatches.length > 0 || filteredCustomMatches.length > 0;
  const builtInColumns = useMemo(
    () => distributeQuizCards(filteredBuiltInMatches, menuColumnCount),
    [filteredBuiltInMatches, menuColumnCount]
  );
  const customColumns = useMemo(
    () => distributeQuizCards(filteredCustomMatches, menuColumnCount, filteredBuiltInMatches.length),
    [filteredCustomMatches, filteredBuiltInMatches.length, menuColumnCount]
  );

  const openQuizSignup = () => {
    navigate('/auth?mode=signup&next=%2Fquiz');
  };

  const toggleFavorite = (matchId) => {
    if (!user) {
      openQuizSignup();
      return;
    }

    setFavoriteIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(matchId)) {
        nextIds.delete(matchId);
      } else {
        nextIds.add(matchId);
      }
      window.localStorage.setItem(QUIZ_FAVORITES_STORAGE_KEY, JSON.stringify([...nextIds]));
      return nextIds;
    });
  };

  const openMatch = (match) => navigate(`/quiz/${match.id}`, {
    state: {
      quizMenuState: {
        searchTerm,
        showMineOnly,
        showFavoritesOnly,
        scrollY: window.scrollY,
      },
    },
  });

  const renderMatchCard = (match, index) => {
    const isOwner = Boolean(user && match.isCustom && match.authorId === user.id);
    const isFavorite = Boolean(user && favoriteIds.has(match.id));
    const mediaSrc = getQuizMediaSrc(match);
    const displayMediaSrc = mediaSrc || QUIZ_FALLBACK_THUMBNAIL;
    const questionCount = match.questionCount ?? match.questions.length;
    const description = match.subtitle
      || (match.hashtags?.length ? match.hashtags.map((tag) => `#${tag}`).join(' ') : 'Custom teacher quiz');
    const thumbnailRatio = thumbnailRatios[displayMediaSrc] || DEFAULT_QUIZ_THUMBNAIL_RATIO;

    const handleThumbnailLoad = (event) => {
      const image = event.currentTarget;
      if (!image.naturalWidth || !image.naturalHeight) return;

      const loadedSrc = image.currentSrc || image.src;
      const nextRatio = Math.min(2, Math.max(1, image.naturalWidth / image.naturalHeight));
      image.parentElement?.style.setProperty('--quiz-thumbnail-ratio', String(nextRatio));
      setThumbnailRatios((currentRatios) => {
        if (Math.abs((currentRatios[loadedSrc] || 0) - nextRatio) < 0.001) return currentRatios;
        const nextRatios = { ...currentRatios, [loadedSrc]: nextRatio };
        cacheQuizThumbnailRatios(nextRatios);
        return nextRatios;
      });
    };

    const handleThumbnailError = (event) => {
      const image = event.currentTarget;
      if (image.src.endsWith(QUIZ_FALLBACK_THUMBNAIL)) return;
      image.src = QUIZ_FALLBACK_THUMBNAIL;
      image.parentElement?.style.setProperty('--quiz-thumbnail-ratio', String(DEFAULT_QUIZ_THUMBNAIL_RATIO));
    };

    return (
      <div
        className={`quiz-match-card quiz-match-card-${(index % 4) + 1}`}
        key={match.id}
        role="button"
        tabIndex={0}
        onClick={() => openMatch(match)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMatch(match);
          }
        }}
      >
        <button
          type="button"
          className={`quiz-favorite-button ${isFavorite ? 'is-favorite' : ''}`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(match.id);
          }}
        >
          <BookmarkMenuIcon filled={isFavorite} />
        </button>
        {isOwner && (
          <div className="quiz-card-actions">
            <button
              type="button"
              aria-label="Edit quiz"
              title="Edit quiz"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/quiz/edit/${match.id}`);
              }}
            >
              ✎
            </button>
            <button
              type="button"
              className="danger"
              aria-label="Delete quiz"
              title="Delete quiz"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteMatch(match);
              }}
            >
              <TrashIcon />
            </button>
          </div>
        )}
        <div
          className="quiz-match-media"
          style={{ '--quiz-thumbnail-ratio': thumbnailRatio }}
        >
          <img
            className="quiz-match-image"
            src={displayMediaSrc}
            alt=""
            onLoad={handleThumbnailLoad}
            onError={handleThumbnailError}
          />
        </div>
        <div className="quiz-match-copy">
          <h2>{match.title}</h2>
          <p title={description}>{getQuizDescriptionPreview(description)}</p>
          <div className="quiz-match-meta">
            <span className="quiz-match-author" title={match.isCustom ? (isOwner ? 'Created by you' : 'Created by a teacher') : 'Created by ClassBop'} aria-label={match.isCustom ? (isOwner ? 'Created by you' : 'Created by a teacher') : 'Created by ClassBop'}>
              <i aria-hidden="true">●</i>{match.isCustom ? (isOwner ? 'You' : 'Teacher') : 'ClassBop'}
            </span>
            {!match.isCustom && (
              <span className="quiz-match-plays" title={`${90 + index * 137} plays`} aria-label={`${90 + index * 137} plays`}>
                <i aria-hidden="true">▶</i>{90 + index * 137}
              </span>
            )}
            <span className="quiz-match-questions" title={`${questionCount} questions`} aria-label={`${questionCount} questions`}>
              <i aria-hidden="true">?</i>{questionCount}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="quiz-page quiz-menu-page game-catalog-page">
      <div className="quiz-menu-shell game-catalog-shell">
        <GameMenuToolbar
          searchValue={searchTerm}
          onSearchChange={(event) => setSearchTerm(event.target.value)}
          searchPlaceholder="Search quizzes..."
          mineLabel="My Quizzes"
          mineActive={showMineOnly}
          onMineClick={() => {
              if (!user) {
                openQuizSignup();
                return;
              }
              setShowMineOnly((value) => !value);
          }}
          favoritesActive={showFavoritesOnly}
          onFavoritesClick={() => {
              if (!user) {
                openQuizSignup();
                return;
              }
              setShowFavoritesOnly((value) => !value);
          }}
          onCreateClick={() => navigate('/quiz/create')}
          onGenerateClick={() => navigate('/quiz/generate')}
          createAriaLabel="Create new quiz"
          generateAriaLabel="Generate a quiz with AI"
        />

        <div
          className={`quiz-browser-grid ${showFavoritesOnly || query ? 'is-filtered-list' : ''}`}
          style={{ '--quiz-column-count': menuColumnCount }}
        >
          {builtInColumns.map((column, columnIndex) => (
            <div className="quiz-browser-column" key={`built-in-column-${columnIndex}`}>
              {column.map(({ match, index }) => renderMatchCard(match, index))}
              {customColumns[columnIndex]?.map(({ match, index }) => renderMatchCard(match, index))}
            </div>
          ))}
        </div>

        {!hasFilteredMatches && (
          <p className="quiz-empty-results">No quizzes found.</p>
        )}
      </div>
    </div>
  );
}

function QuestionImage({ question }) {
  const src = getQuizMediaSrc(question);
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return <img src={src} alt="" onError={() => setErrored(true)} />;
  }
  return <div className="quiz-preview-question-placeholder" aria-hidden="true">?</div>;
}

function PreviewQuestionCard({ question, index }) {
  const [revealed, setRevealed] = useState(false);
  const answer = question.answer || '—';

  return (
    <article
      className={`quiz-preview-question-card ${revealed ? 'is-revealed' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Question ${index + 1}. Reveal answer.`}
      onClick={() => setRevealed((value) => !value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setRevealed((value) => !value);
        }
      }}
    >
      <div className="quiz-preview-question-media">
        <QuestionImage question={question} />
        <span className="quiz-preview-question-num">{index + 1}</span>
        <div className="quiz-preview-answer">
          <span className="quiz-preview-answer-label">Answer</span>
          <span className="quiz-preview-answer-text">{answer}</span>
        </div>
      </div>
      <h3>{question.question || 'Picture question'}</h3>
    </article>
  );
}

function QuizSetup({ match, onStart, sfxVolume, onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState(makeDefaultTeamNames(2));
  const [lengthMode, setLengthMode] = useState('ALL');
  const [customLength, setCustomLength] = useState('');
  const [shuffle, setShuffle] = useState(false);
  const [mode, setMode] = useState('TEAMS');
  const [copied, setCopied] = useState(false);

  const parsedLength = Number(customLength);
  const isCustom = lengthMode === 'CUSTOM';
  const customInvalid = isCustom && (
    customLength.trim() === '' ||
    !Number.isInteger(parsedLength) ||
    parsedLength < 1 ||
    parsedLength > match.questions.length
  );
  const canStart = !customInvalid;

  const isOwner = Boolean(user && match.isCustom && match.authorId === user.id);
  const questionCount = match.questionCount ?? match.questions.length;
  const author = match.isCustom ? (isOwner ? 'You' : 'Teacher') : 'ClassBop';
  const category = (match.hashtags && match.hashtags[0]) || match.level || 'Quiz';
  const description = match.subtitle
    || (match.hashtags?.length ? match.hashtags.map((tag) => `#${tag}`).join(' ') : 'A fun classroom quiz to play in teams.');

  const setTeams = (count) => {
    setTeamCount(count);
    setTeamNames((previous) => Array.from({ length: count }, (_, index) => previous[index] || `TEAM ${index + 1}`));
  };

  const updateTeamName = (index, value) => {
    setTeamNames((previous) => {
      const nextNames = [...previous];
      nextNames[index] = value.toUpperCase();
      return nextNames;
    });
  };

  const startGame = () => {
    if (!canStart) return;

    playQuizAudio(QUIZ_START_SOUND_SRC, sfxVolume * 0.8, 3800);
    onStart({
      teamNames,
      teamColors: makeDefaultTeamColors(teamNames.length),
      length: isCustom ? parsedLength : 'ALL',
      shuffle,
      mode,
    });
  };

  const playLabel = mode === 'LEARN' ? 'Start slides' : 'Play game';

  const shareGame = async () => {
    const url = `${window.location.origin}/quiz/${match.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        return;
      }
    } catch {
      // Fall back to a manual prompt below.
    }
    window.prompt('Copy this quiz link:', url);
  };

  return (
    <div className="quiz-page quiz-preview-page">
      <div className="quiz-preview-shell quiz-preview-shell--modern">
        <div className="quiz-preview-main">
          <div className="quiz-preview-side">
          <aside className="quiz-preview-info">
            <div className="quiz-preview-info-pills">
              <span className="quiz-preview-info-pill">📋 {questionCount} Questions</span>
              <span className="quiz-preview-info-pill quiz-preview-info-pill--soft">🏷️ {category}</span>
            </div>

            <h1 className="quiz-preview-info-title">{match.title}</h1>

            <div className="quiz-preview-creator">
              <span className="quiz-preview-avatar" aria-hidden="true">{author.charAt(0)}</span>
              Created by <strong>{author}</strong>
            </div>

            {description && (
              <div className="quiz-preview-desc">
                <span aria-hidden="true">💡</span>
                <p>{description}</p>
              </div>
            )}

            <div className="quiz-preview-settings-card">
              <h2>Game settings</h2>
              <div className="quiz-preview-settings">
                <div className="quiz-preview-setting">
                  <span>Mode</span>
                  <div className="quiz-mini-segments quiz-mode-segments">
                    <button
                      type="button"
                      className={mode === 'TEAMS' ? 'active' : ''}
                      onClick={() => setMode('TEAMS')}
                    >
                      Teams
                    </button>
                    <button
                      type="button"
                      className={mode === 'LEARN' ? 'active' : ''}
                      onClick={() => setMode('LEARN')}
                    >
                      Learn
                    </button>
                  </div>
                </div>

                {mode === 'TEAMS' && (
                  <>
                    <div className="quiz-preview-setting">
                      <span>Teams</span>
                      <div className="quiz-mini-segments">
                        {TEAM_OPTIONS.map((count) => (
                          <button
                            type="button"
                            className={teamCount === count ? 'active' : ''}
                            key={count}
                            onClick={() => setTeams(count)}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="quiz-preview-team-names">
                      {teamNames.map((name, index) => (
                        <input
                          key={index}
                          value={name}
                          maxLength={12}
                          aria-label={`Team ${index + 1} name`}
                          onChange={(event) => updateTeamName(index, event.target.value)}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="quiz-preview-setting">
                  <span>Questions</span>
                  <div className="quiz-mini-segments">
                    <button
                      type="button"
                      className={lengthMode === 'ALL' ? 'active' : ''}
                      onClick={() => setLengthMode('ALL')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={lengthMode === 'CUSTOM' ? 'active' : ''}
                      onClick={() => setLengthMode('CUSTOM')}
                    >
                      Pick
                    </button>
                  </div>
                </div>

                {isCustom && (
                  <label className="quiz-preview-number">
                    <span>Number</span>
                    <input
                      type="number"
                      min="1"
                      max={match.questions.length}
                      value={customLength}
                      placeholder={`1-${match.questions.length}`}
                      onChange={(event) => setCustomLength(event.target.value)}
                    />
                  </label>
                )}

                <label className="quiz-preview-toggle">
                  <input
                    type="checkbox"
                    checked={shuffle}
                    onChange={(event) => setShuffle(event.target.checked)}
                  />
                  Shuffle questions
                </label>

                {customInvalid && <p className="quiz-preview-error">Choose 1-{match.questions.length} questions.</p>}
              </div>
            </div>
          </aside>

          <button type="button" className="quiz-preview-back quiz-preview-back--side" onClick={onBack}>
            ← Back to games
          </button>
          </div>

          <div className="quiz-preview-cards-wrap">
            <div className="quiz-preview-cards-col">
              <div className="quiz-preview-cards-grid">
                {match.questions.map((question, index) => (
                  <PreviewQuestionCard question={question} index={index} key={`${question.question}-${index}`} />
                ))}
              </div>
            </div>

            <div className="quiz-preview-cards-actions">
              {isOwner && (
                <button type="button" className="quiz-preview-action" onClick={() => navigate(`/quiz/edit/${match.id}`)}>
                  <span aria-hidden="true">✎</span> Edit game
                </button>
              )}
              <button type="button" className="quiz-preview-action" onClick={shareGame}>
                <span aria-hidden="true">↗</span> {copied ? 'Copied!' : 'Share'}
              </button>
              <button type="button" className="quiz-preview-action quiz-preview-action--primary" onClick={startGame} disabled={!canStart}>
                {playLabel} <span aria-hidden="true">▶</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizLearn({ match, settings, onReset }) {
  const questions = useMemo(
    () => pickQuizQuestions(match, settings.length, settings.shuffle),
    [match, settings.length, settings.shuffle]
  );
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const total = questions.length;
  const current = questions[index];

  const go = useCallback((delta) => {
    setIndex((value) => Math.min(total - 1, Math.max(0, value + delta)));
    setRevealed(false);
  }, [total]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'ArrowRight') { go(1); }
      else if (event.key === 'ArrowLeft') { go(-1); }
      else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); setRevealed((value) => !value); }
      else if (event.key === 'Escape') { onReset(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [go, onReset]);

  if (!current) return null;

  return (
    <div className="quiz-page quiz-learn-page">
      <div className="quiz-learn-topbar">
        <button type="button" className="quiz-preview-back" onClick={onReset}>← Exit</button>
        <span className="quiz-learn-progress">{index + 1} / {total}</span>
        <span aria-hidden="true" />
      </div>

      <div className="quiz-learn-stage">
        <button
          type="button"
          className="quiz-learn-nav"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Previous card"
        >
          ‹
        </button>

        <div
          key={index}
          className={`quiz-learn-card ${revealed ? 'is-revealed' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => setRevealed((value) => !value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setRevealed((value) => !value);
            }
          }}
        >
          <div className="quiz-learn-media">
            <QuestionImage question={current} />
            <span className="quiz-learn-points">{normalizeQuizQuestionPoints(current.points)} pts</span>
            <div className="quiz-learn-answer">
              <span className="quiz-learn-answer-label">Answer</span>
              <span className="quiz-learn-answer-text">{current.answer || '—'}</span>
            </div>
          </div>
          <div className="quiz-learn-question">{current.question || 'Picture question'}</div>
          <div className="quiz-learn-hint">{revealed ? 'Tap to hide answer' : 'Tap to reveal answer'}</div>
        </div>

        <button
          type="button"
          className="quiz-learn-nav"
          onClick={() => go(1)}
          disabled={index === total - 1}
          aria-label="Next card"
        >
          ›
        </button>
      </div>

      <div className="quiz-learn-dots">
        {questions.map((question, dotIndex) => (
          <button
            key={`${question.question}-${dotIndex}`}
            type="button"
            className={`quiz-learn-dot ${dotIndex === index ? 'is-active' : ''}`}
            aria-label={`Card ${dotIndex + 1}`}
            onClick={() => { setIndex(dotIndex); setRevealed(false); }}
          />
        ))}
      </div>
    </div>
  );
}

function getQuizBoardLayout(questionCount) {
  const count = Math.max(1, questionCount);

  // Prefer a complete, balanced rectangle whenever the question count has
  // usable factors: 12 -> 4x3, 15 -> 5x3, 18 -> 6x3, 20 -> 5x4.
  for (let rows = Math.floor(Math.sqrt(count)); rows >= 2; rows -= 1) {
    if (count % rows === 0) {
      return {
        columns: count / rows,
        rows,
        slots: count,
      };
    }
  }

  // Prime counts cannot fill a rectangle exactly, so use the smallest
  // near-square board and reserve the remaining cells as quiet placeholders.
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);

  return {
    columns,
    rows,
    slots: columns * rows,
  };
}

function QuizBoard({ match, settings, onReset, sfxVolume, onSfxVolumeChange }) {
  const playSound = useQuizSounds(sfxVolume > 0, sfxVolume);
  const questions = useMemo(
    () => pickQuizQuestions(match, settings.length, settings.shuffle),
    [match, settings.length, settings.shuffle]
  );
  const [scores, setScores] = useState(() => settings.teamNames.map(() => 0));
  const [answered, setAnswered] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeTeam, setActiveTeam] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [resultFeedback, setResultFeedback] = useState(null);
  const [soundPanelOpen, setSoundPanelOpen] = useState(false);
  const [activeMediaLayout, setActiveMediaLayout] = useState({ kind: 'landscape', ratio: 16 / 9 });
  const wasDoneRef = useRef(false);
  const resultTimerRef = useRef(null);
  const activeMediaWrapRef = useRef(null);

  const activeQuestion = activeIndex === null ? null : questions[activeIndex];
  const activeQuestionMediaSrc = activeQuestion ? getQuizMediaSrc(activeQuestion) : '';
  const activeQuestionPoints = activeQuestion
    ? normalizeQuizQuestionPoints(activeQuestion.points)
    : DEFAULT_QUIZ_QUESTION_POINTS;
  const activeChoices = Array.isArray(activeQuestion?.choices) && activeQuestion.choices.length >= 2
    ? activeQuestion.choices
    : null;
  const activeQuestionDone = activeIndex !== null && answered.includes(activeIndex);
  const allDone = answered.length === questions.length;
  const topScore = Math.max(...scores);
  const winners = settings.teamNames.filter((_, index) => scores[index] === topScore);
  const boardLayout = getQuizBoardLayout(questions.length);
  const emptyBoardSlots = boardLayout.slots - questions.length;

  useLayoutEffect(() => {
    const mediaWrap = activeMediaWrapRef.current;
    if (!mediaWrap || !activeQuestionMediaSrc) return undefined;

    const fitMediaToAvailableSpace = () => {
      const availableWidth = mediaWrap.clientWidth;
      const availableHeight = mediaWrap.clientHeight;
      const ratio = activeMediaLayout.ratio || (16 / 9);

      if (!availableWidth || !availableHeight || !ratio) return;

      const fittedWidth = Math.min(availableWidth, availableHeight * ratio);
      const fittedHeight = fittedWidth / ratio;

      mediaWrap.style.setProperty('--quiz-media-fit-width', `${fittedWidth}px`);
      mediaWrap.style.setProperty('--quiz-media-fit-height', `${fittedHeight}px`);
      mediaWrap.style.setProperty('--quiz-media-fit-center', `${fittedHeight / 2}px`);
    };

    fitMediaToAvailableSpace();

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(fitMediaToAvailableSpace);
    resizeObserver?.observe(mediaWrap);
    window.addEventListener('resize', fitMediaToAvailableSpace);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', fitMediaToAvailableSpace);
    };
  }, [activeQuestionMediaSrc, activeMediaLayout.ratio, answerVisible, activeChoices]);

  const closeQuestion = ({ playCloseSound = true } = {}) => {
    if (playCloseSound && activeIndex !== null) {
      playSound('close');
    }
    window.clearTimeout(resultTimerRef.current);
    setResultFeedback(null);
    setActiveIndex(null);
    setAnswerVisible(false);
    setHintVisible(false);
  };

  const restartGame = () => {
    playSound('restart');
    setScores(settings.teamNames.map(() => 0));
    setAnswered([]);
    setActiveTeam(0);
    closeQuestion({ playCloseSound: false });
  };

  const toggleFullscreen = () => {
    const root = document.documentElement;

    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }

    root.requestFullscreen?.();
  };

  const markQuestion = (isCorrect) => {
    if (activeIndex === null || answered.includes(activeIndex) || resultFeedback) return;

    playQuizAudio(isCorrect ? QUIZ_CORRECT_SOUND_SRC : QUIZ_INCORRECT_SOUND_SRC, sfxVolume * (isCorrect ? 0.78 : 0.72));
    setResultFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScores((previous) => previous.map((score, index) => (
        index === activeTeam ? score + activeQuestionPoints : score
      )));
    }

    const scoredIndex = activeIndex;
    resultTimerRef.current = window.setTimeout(() => {
      setAnswered((previous) => previous.includes(scoredIndex) ? previous : [...previous, scoredIndex]);
      setActiveTeam((previous) => (previous + 1) % settings.teamNames.length);
      closeQuestion({ playCloseSound: false });
    }, 1000);
  };

  useEffect(() => {
    if (allDone && !wasDoneRef.current) {
      playSound('finish');
    }
    wasDoneRef.current = allDone;
  }, [allDone, playSound]);

  useEffect(() => () => {
    window.clearTimeout(resultTimerRef.current);
  }, []);

  return (
    <div className="quiz-page quiz-play-page">
      <div className="quiz-shell">
        <header className="quiz-play-topbar">
          <div className={`quiz-play-scores quiz-play-scores--${settings.teamNames.length}`}>
            {settings.teamNames.map((teamName, index) => (
              <div
                className={`quiz-play-score-card${activeTeam === index ? ' active' : ''}`}
                key={`${teamName}-${index}`}
                style={teamColorStyle(settings.teamColors?.[index], index)}
              >
                <strong>{teamName || `TEAM ${index + 1}`}</strong>
                <span className="quiz-score-points">{scores[index]}</span>
              </div>
            ))}
          </div>
          <div className="quiz-play-actions">
            <div className="quiz-sound-menu">
              <button
                type="button"
                className="quiz-circle-button quiz-sound-button"
                onMouseEnter={() => playSound('hover')}
                onClick={() => setSoundPanelOpen((previous) => !previous)}
                aria-label="Sound settings"
                aria-expanded={soundPanelOpen}
              >
                ♪
              </button>
              {soundPanelOpen && (
                <div className="quiz-sound-popover">
                  <label className="quiz-sound-row">
                    <span>SFX</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(sfxVolume * 100)}
                      onChange={(event) => onSfxVolumeChange(Number(event.target.value) / 100)}
                    />
                    <strong>{Math.round(sfxVolume * 100)}</strong>
                  </label>
                </div>
              )}
            </div>
            <button type="button" className="quiz-circle-button quiz-maximize-button" onMouseEnter={() => playSound('hover')} onClick={toggleFullscreen} aria-label="Maximize quiz">⛶</button>
            <button
              type="button"
              className="quiz-circle-button quiz-close-button"
              onMouseEnter={() => playSound('hover')}
              onClick={() => {
                playSound('close');
                onReset();
              }}
              aria-label="Exit quiz"
            >
              ×
            </button>
          </div>
        </header>

        <div
          className="quiz-board"
          style={{
            '--quiz-board-columns': boardLayout.columns,
            '--quiz-board-rows': boardLayout.rows,
            '--quiz-board-mobile-columns': boardLayout.rows,
            '--quiz-board-mobile-rows': boardLayout.columns,
          }}
        >
          {questions.map((question, index) => {
            const isDone = answered.includes(index);

            return (
            <button
              type="button"
              className={`quiz-tile-slot quiz-tile${isDone ? ' answered' : ''}`}
              key={`${question.question}-${index}`}
              onMouseEnter={() => playSound('hover')}
              onClick={() => {
                playQuizAudio(QUIZ_QUESTION_CLICK_SOUND_SRC, sfxVolume * 0.72);
                setActiveMediaLayout({ kind: 'landscape', ratio: 16 / 9 });
                setActiveIndex(index);
                setAnswerVisible(isDone);
                setHintVisible(false);
              }}
              aria-label={`Question ${index + 1}${isDone ? ', answered' : ''}`}
              style={{ '--tile-enter-index': index }}
            >
              <span className="quiz-tile-number" data-number={index + 1}>{index + 1}</span>
            </button>
            );
          })}
          {Array.from({ length: emptyBoardSlots }, (_, index) => (
            <span
              className="quiz-tile-slot empty"
              key={`empty-board-slot-${index}`}
              aria-hidden="true"
            />
          ))}
        </div>

        {allDone && (
          <div className="quiz-modal-backdrop" role="dialog" aria-modal="true">
            <section className="quiz-finished">
              <p className="quiz-finished-kicker">Game Over</p>
              <h2>{winners.length > 1 ? 'Tie Game!' : `${winners[0]} Wins!`}</h2>
              <div className="quiz-final-scores">
                {settings.teamNames.map((teamName, index) => (
                  <div
                    className={`quiz-final-score${scores[index] === topScore ? ' winner' : ''}`}
                    key={`${teamName}-${index}`}
                  >
                    <strong>{teamName || `TEAM ${index + 1}`}</strong>
                    <span>{scores[index]}</span>
                  </div>
                ))}
              </div>
              <div className="quiz-finished-actions">
                <button type="button" className="quiz-brutal-button quiz-primary-button" onClick={restartGame}>Play Again</button>
                <button type="button" className="quiz-brutal-button" onClick={onReset}>Setup</button>
              </div>
            </section>
          </div>
        )}
      </div>

      {activeQuestion && (
        <div className="quiz-modal-backdrop quiz-question-backdrop" role="dialog" aria-modal="true">
          <span className="quiz-stage-sparkle quiz-stage-sparkle-1" aria-hidden="true">★</span>
          <span className="quiz-stage-sparkle quiz-stage-sparkle-2" aria-hidden="true">✦</span>
          <span className="quiz-stage-sparkle quiz-stage-sparkle-3" aria-hidden="true">★</span>
          <span className="quiz-stage-sparkle quiz-stage-sparkle-4" aria-hidden="true">✦</span>
          <span className="quiz-stage-squiggle quiz-stage-squiggle-1" aria-hidden="true" />
          <span className="quiz-stage-squiggle quiz-stage-squiggle-2" aria-hidden="true" />
          <span className="quiz-stage-spotlight quiz-stage-spotlight-left" aria-hidden="true" />
          <span className="quiz-stage-spotlight quiz-stage-spotlight-right" aria-hidden="true" />
          <span className="quiz-stage-floor" aria-hidden="true" />

          <section className="quiz-question-card">
            <div className="quiz-question-hud">
              <span className="quiz-question-points"><span aria-hidden="true">⭐</span> {activeQuestionPoints} pts</span>

              {settings.teamNames.length === 2 ? (
                <div className="quiz-question-vs" aria-label="Team scores">
                  {settings.teamNames.map((teamName, index) => (
                    <div
                      className={`quiz-question-vs-team${activeTeam === index ? ' active' : ''}`}
                      key={`${teamName}-${index}`}
                      style={teamColorStyle(settings.teamColors?.[index], index)}
                    >
                      {scores[index] > 0 && scores[index] === topScore && (
                        <span className="quiz-question-vs-crown" aria-hidden="true">👑</span>
                      )}
                      <span className="quiz-question-vs-avatar" aria-hidden="true"><TeamAvatarIcon /></span>
                      <span className="quiz-question-vs-body">
                        <strong>{teamName || `TEAM ${index + 1}`}</strong>
                        <span>{scores[index]}</span>
                      </span>
                    </div>
                  ))}
                  <span className="quiz-question-vs-badge" aria-hidden="true">VS</span>
                </div>
              ) : (
                <div className="quiz-question-scores" aria-label="Team scores">
                  {settings.teamNames.map((teamName, index) => (
                    <div
                      className={`quiz-question-score${activeTeam === index ? ' active' : ''}`}
                      key={`${teamName}-${index}`}
                      style={teamColorStyle(settings.teamColors?.[index], index)}
                    >
                      <strong>{teamName || `TEAM ${index + 1}`}</strong>
                      <span>{scores[index]}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="quiz-play-actions quiz-question-controls">
                <div className="quiz-sound-menu">
                  <button
                    type="button"
                    className="quiz-circle-button quiz-sound-button"
                    onMouseEnter={() => playSound('hover')}
                    onClick={() => setSoundPanelOpen((previous) => !previous)}
                    aria-label="Sound settings"
                    aria-expanded={soundPanelOpen}
                  >
                    ♪
                  </button>
                  {soundPanelOpen && (
                    <div className="quiz-sound-popover">
                      <label className="quiz-sound-row">
                        <span>SFX</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(sfxVolume * 100)}
                          onChange={(event) => onSfxVolumeChange(Number(event.target.value) / 100)}
                        />
                        <strong>{Math.round(sfxVolume * 100)}</strong>
                      </label>
                    </div>
                  )}
                </div>
                <button type="button" className="quiz-circle-button quiz-maximize-button" onMouseEnter={() => playSound('hover')} onClick={toggleFullscreen} aria-label="Maximize quiz">⛶</button>
                <button type="button" className="quiz-circle-button quiz-close-button" onMouseEnter={() => playSound('hover')} onClick={closeQuestion} aria-label="Close question">×</button>
              </div>
            </div>

            {resultFeedback && (
              <div className={`quiz-result-feedback ${resultFeedback}`} aria-live="polite">
                {resultFeedback === 'correct' ? '✓' : '×'}
              </div>
            )}

            <div className={`quiz-question-stage-card ${activeQuestionMediaSrc ? `has-media is-media-${activeMediaLayout.kind}` : 'no-media'}${activeChoices ? ' has-choices' : ''}${answerVisible ? ' is-answer-visible' : ''}`}>
              {activeQuestionMediaSrc && (
                <div
                  ref={activeMediaWrapRef}
                  className="quiz-question-media-wrap"
                  style={{ '--quiz-media-aspect': activeMediaLayout.ratio }}
                >
                  <span className="quiz-question-bubble quiz-question-bubble-left" aria-hidden="true">?</span>
                  <div className="quiz-question-media-frame">
                    <img
                      className="quiz-question-media-backdrop"
                      src={activeQuestionMediaSrc}
                      alt=""
                      aria-hidden="true"
                    />
                    <img
                      className="quiz-question-media"
                      src={activeQuestionMediaSrc}
                      alt=""
                      onLoad={(event) => {
                        const { naturalWidth, naturalHeight } = event.currentTarget;
                        if (!naturalWidth || !naturalHeight) return;

                        const ratio = Math.min(4, Math.max(0.25, naturalWidth / naturalHeight));
                        const kind = ratio < 0.9 ? 'portrait' : ratio < 1.2 ? 'square' : 'landscape';
                        setActiveMediaLayout((previous) => (
                          previous.kind === kind && Math.abs(previous.ratio - ratio) < 0.001
                            ? previous
                            : { kind, ratio }
                        ));
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className="quiz-question-bubble quiz-question-bubble-right" aria-hidden="true"><StarBadgeIcon /></span>
                </div>
              )}
              <div className="quiz-question-body">
                {activeQuestion.question && <h2>{activeQuestion.question}</h2>}

              {activeQuestion.hint && (
                hintVisible ? (
                  <p className="quiz-hint" aria-live="polite"><strong>Hint:</strong> {activeQuestion.hint}</p>
                ) : (
                  <button
                    type="button"
                    className="quiz-hint-button"
                    onMouseEnter={() => playSound('hover')}
                    onClick={() => {
                      playSound('switch');
                      setHintVisible(true);
                    }}
                  >
                    Show Hint
                  </button>
                )
              )}

              {activeChoices && (
                <div className="quiz-choice-grid">
                  {activeChoices.map((choice, choiceIndex) => (
                    <div
                      key={`${choice}-${choiceIndex}`}
                      className={`quiz-choice${answerVisible
                        ? (choiceIndex === activeQuestion.correctChoice ? ' correct' : ' dimmed')
                        : ''}`}
                      style={{ '--quiz-choice-color': QUIZ_CHOICE_STYLES[choiceIndex]?.color }}
                    >
                      <span className="quiz-choice-shape" aria-hidden="true">
                        {answerVisible && choiceIndex === activeQuestion.correctChoice
                          ? '✓'
                          : QUIZ_CHOICE_STYLES[choiceIndex]?.symbol}
                      </span>
                      {choice}
                    </div>
                  ))}
                </div>
              )}

              {answerVisible ? (
                <div className="quiz-answer-reveal">
                  {!activeChoices && <div className="quiz-answer">{activeQuestion.answer}</div>}
                  {!activeQuestionDone && (
                    <div className="quiz-controls">
                      <button type="button" className="quiz-mark-button correct" disabled={Boolean(resultFeedback)} onMouseEnter={() => playSound('hover')} onClick={() => markQuestion(true)}>Correct</button>
                      <button type="button" className="quiz-mark-button wrong" disabled={Boolean(resultFeedback)} onMouseEnter={() => playSound('hover')} onClick={() => markQuestion(false)}>Incorrect</button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="quiz-show-answer-button"
                  onMouseEnter={() => playSound('hover')}
                  onClick={() => {
                    playQuizAudio(QUIZ_ANSWER_REVEAL_SOUND_SRC, sfxVolume * 0.72);
                    setAnswerVisible(true);
                  }}
                >
                  <span aria-hidden="true">✨</span> Show Answer
                </button>
              )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function Quiz() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { match, isLoading } = useQuizMatch(matchId);
  const [settings, setSettings] = useState(null);
  const [sfxVolume, setSfxVolume] = useState(0.68);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('classbop:quiz-play-navbar', {
      detail: { hidden: Boolean(settings && matchId) },
    }));

    return () => {
      window.dispatchEvent(new CustomEvent('classbop:quiz-play-navbar', {
        detail: { hidden: false },
      }));
    };
  }, [matchId, settings]);

  if (!matchId) return <MatchMenu />;

  if (isLoading) {
    return (
      <div className="quiz-page">
        <div className="quiz-shell">
          <section className="quiz-setup-card">
            <h2 style={{ fontFamily: '"Lilita One", cursive', fontSize: 38, margin: 0 }}>LOADING QUIZ...</h2>
          </section>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="quiz-page">
        <div className="quiz-shell">
          <header className="quiz-header">
            <span />
            <h1 className="quiz-title">QUIZ-BOP</h1>
            <span />
          </header>
          <section className="quiz-setup-card">
            <h2 style={{ fontFamily: '"Lilita One", cursive', fontSize: 38, margin: 0 }}>QUIZ-BOP not found</h2>
          </section>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <QuizSetup
        match={match}
        onStart={setSettings}
        sfxVolume={sfxVolume}
        onBack={() => navigate('/quiz', { state: location.state || undefined })}
      />
    );
  }

  if (settings.mode === 'LEARN') {
    return (
      <QuizLearn
        match={match}
        settings={settings}
        onReset={() => setSettings(null)}
      />
    );
  }

  return (
    <QuizBoard
      match={match}
      settings={settings}
      onReset={() => setSettings(null)}
      sfxVolume={sfxVolume}
      onSfxVolumeChange={setSfxVolume}
    />
  );
}
