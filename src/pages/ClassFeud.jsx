import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Backpack,
  Briefcase,
  Bus,
  Cake,
  Clapperboard,
  CloudSun,
  Gamepad2,
  Globe,
  HeartPulse,
  House,
  Languages,
  ListOrdered,
  Maximize2,
  Music,
  PartyPopper,
  PawPrint,
  PencilLine,
  Pizza,
  Plane,
  Rocket,
  Shield,
  Shirt,
  Shapes,
  Shuffle,
  Sparkles,
  Smartphone,
  Trophy,
  Users,
  X as CloseIcon,
  Zap,
} from 'lucide-react';
import DeckCard from '../components/DeckCard';
import GameMenuToolbar from '../components/GameMenuToolbar';
import MasonryDeckGrid from '../components/MasonryDeckGrid';
import { FEUD_BOARDS, pickFeudRounds } from '../games/classFeud/classFeudData';
import {
  deleteFeudBoard,
  fetchFeudBoardList,
  useFeudBoard,
} from '../games/classFeud/classFeudSets';
import { findFeudMatch, findRevealedMatch } from '../games/classFeud/feudMatching';
import { useAuth } from '../auth/useAuth';
import './ClassFeud.css';

const TEAM_OPTIONS = [1, 2, 3, 4];
const STRIKE_OPTIONS = [2, 3, 4];
const MIC_LANGUAGES = [
  { id: 'en-US', label: 'English' },
  { id: 'ko-KR', label: '한국어' },
];
const TEAM_COLORS = ['#2563EB', '#EF4444', '#16A34A', '#A855F7'];

const FEUD_START_SOUND_SRC = '/quiz_media/game-start.mp3';
const FEUD_CORRECT_SOUND_SRC = '/quiz_media/correct-answer-trimmed.m4a';
const FEUD_WRONG_SOUND_SRC = '/quiz_media/incorrect-answer.mp3';
const FEUD_REVEAL_SOUND_SRC = '/quiz_media/answer-reveal.mp3';

const FEUD_BOARD_LIST_CACHE_KEY = 'classbop:feud-board-list-cache:v1';

const FEUD_TOPIC_ICONS = {
  'around-the-house': House,
  'school-days': Backpack,
  'food-fight': Pizza,
  'animal-planet': PawPrint,
  'sports-day': Trophy,
  'travel-time': Plane,
  'weather-and-seasons': CloudSun,
  'when-i-grow-up': Briefcase,
  'movies-and-tv': Clapperboard,
  'music-and-dance': Music,
  'phones-and-tech': Smartphone,
  'clothes-and-style': Shirt,
  'body-and-health': HeartPulse,
  'family-life': Users,
  'holidays-and-parties': PartyPopper,
  'space-and-science': Rocket,
  'getting-around': Bus,
  'birthday-bash': Cake,
  'heroes-and-cartoons': Shield,
  'korea-and-the-world': Globe,
};

const FEUD_TOPIC_ART_POSITIONS = {
  'around-the-house': [0, 0],
  'school-days': [1, 0],
  'food-fight': [2, 0],
  'animal-planet': [3, 0],
  'sports-day': [4, 0],
  'travel-time': [0, 1],
  'weather-and-seasons': [1, 1],
  'when-i-grow-up': [2, 1],
  'movies-and-tv': [3, 1],
  'music-and-dance': [4, 1],
  'phones-and-tech': [0, 2],
  'clothes-and-style': [1, 2],
  'body-and-health': [2, 2],
  'family-life': [3, 2],
  'holidays-and-parties': [4, 2],
  'space-and-science': [0, 3],
  'getting-around': [1, 3],
  'birthday-bash': [2, 3],
  'heroes-and-cartoons': [3, 3],
  'korea-and-the-world': [4, 3],
};

const SOUND_PATTERNS = {
  hover: [{ frequency: 620, endFrequency: 760, duration: 0.035, type: 'sine', gain: 0.018 }],
  flip: [
    { frequency: 300, endFrequency: 720, duration: 0.09, type: 'square', gain: 0.03 },
    { frequency: 980, delay: 0.05, duration: 0.07, type: 'triangle', gain: 0.024 },
  ],
  strike: [
    { frequency: 210, endFrequency: 120, duration: 0.22, type: 'sawtooth', gain: 0.06 },
    { frequency: 160, endFrequency: 90, delay: 0.12, duration: 0.2, type: 'sawtooth', gain: 0.05 },
  ],
  duplicate: [
    { frequency: 480, endFrequency: 380, duration: 0.1, type: 'triangle', gain: 0.035 },
    { frequency: 380, delay: 0.09, duration: 0.09, type: 'triangle', gain: 0.03 },
  ],
  round: [
    { frequency: 392, endFrequency: 523, duration: 0.12, type: 'triangle', gain: 0.06 },
    { frequency: 659, delay: 0.11, duration: 0.16, type: 'sine', gain: 0.05 },
  ],
  finish: [
    { frequency: 523, duration: 0.11, type: 'triangle', gain: 0.07 },
    { frequency: 659, delay: 0.1, duration: 0.11, type: 'triangle', gain: 0.07 },
    { frequency: 784, delay: 0.2, duration: 0.11, type: 'triangle', gain: 0.075 },
    { frequency: 1047, delay: 0.3, duration: 0.24, type: 'sine', gain: 0.08 },
  ],
  close: [{ frequency: 420, endFrequency: 260, duration: 0.1, type: 'triangle', gain: 0.045 }],
};

const activeFeudAudio = new Set();

function playFeudAudio(src, volume = 0.8) {
  if (typeof Audio === 'undefined' || volume <= 0) return;

  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = Math.min(1, Math.max(0, volume));
  activeFeudAudio.add(audio);
  const release = () => activeFeudAudio.delete(audio);
  audio.addEventListener('ended', release, { once: true });
  audio.addEventListener('error', release, { once: true });

  audio.play().catch(() => {
    release();
    // Autoplay policies can block the very first sound; gameplay must not fail.
  });
}

function useFeudSounds(enabled = true, volume = 1) {
  const audioContextRef = useRef(null);

  return useCallback((name) => {
    if (!enabled || typeof window === 'undefined') return;

    const pattern = SOUND_PATTERNS[name];
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!pattern || !AudioContext) return;

    const audioContext = audioContextRef.current || new AudioContext();
    audioContextRef.current = audioContext;
    if (audioContext.state === 'suspended') audioContext.resume();

    const baseTime = audioContext.currentTime;

    pattern.forEach((note) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const startTime = baseTime + (note.delay || 0);
      const endTime = startTime + note.duration;

      oscillator.type = note.type || 'sine';
      oscillator.frequency.setValueAtTime(note.frequency, startTime);
      if (note.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, endTime);
      }

      const peak = Math.max(0.0001, (note.gain || 0.05) * volume);
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(peak, startTime + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(startTime);
      oscillator.stop(endTime + 0.02);
    });
  }, [enabled, volume]);
}

/* --------------------------------------------------------------------------
   Icons
   -------------------------------------------------------------------------- */

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3.5M8.5 21.5h7" />
    </svg>
  );
}

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

/* --------------------------------------------------------------------------
   Shared bits
   -------------------------------------------------------------------------- */

function FeudTopicIcon({ boardId }) {
  const TopicIcon = FEUD_TOPIC_ICONS[boardId] || Shapes;
  return <TopicIcon aria-hidden="true" />;
}

function FeudTopicArt({ boardId }) {
  const position = FEUD_TOPIC_ART_POSITIONS[boardId];
  if (!position) return <FeudTopicIcon boardId={boardId} />;

  const [column, row] = position;
  return (
    <span
      className="feud-topic-art"
      style={{
        '--feud-art-x': `${column * 25}%`,
        '--feud-art-y': `${row * (100 / 3)}%`,
      }}
      aria-hidden="true"
    />
  );
}

function compactFeudLevel(level) {
  if (level === 'Easy-Medium ESL') return 'Easy-Med';
  if (level === 'Medium ESL') return 'Medium';
  return level;
}

function makeDefaultTeamNames(count) {
  return Array.from({ length: count }, (_, index) => `TEAM ${index + 1}`);
}

function getCachedBoardList() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FEUD_BOARD_LIST_CACHE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function cacheBoardList(boards) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FEUD_BOARD_LIST_CACHE_KEY, JSON.stringify(boards));
  } catch {
    // The cache only smooths menu entry; failing to write is harmless.
  }
}

function roundCountOf(board) {
  return board.roundCount ?? board.rounds?.length ?? 0;
}

/* --------------------------------------------------------------------------
   Menu
   -------------------------------------------------------------------------- */

function FeudMenu() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customBoards, setCustomBoards] = useState(getCachedBoardList);
  const [query, setQuery] = useState('');
  const [listError, setListError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    let isActive = true;
    fetchFeudBoardList()
      .then((boards) => {
        if (!isActive) return;
        setCustomBoards(boards);
        cacheBoardList(boards);
      })
      .catch(() => {
        // A missing feud_items table just means "no custom boards yet".
        if (isActive) setCustomBoards((previous) => previous);
      });
    return () => { isActive = false; };
  }, []);

  const visibleCustom = customBoards.filter((board) => board.isPublic !== false || board.authorId === user?.id);
  const allBoards = showFavoritesOnly
    ? []
    : [
      ...visibleCustom.filter((board) => !showMineOnly || board.authorId === user?.id),
      ...(showMineOnly ? [] : FEUD_BOARDS),
    ];

  const search = query.trim().toLowerCase();
  const boards = search
    ? allBoards.filter((board) => (
      `${board.title} ${board.subtitle} ${(board.hashtags || []).join(' ')}`.toLowerCase().includes(search)
    ))
    : allBoards;

  const removeBoard = async (board) => {
    if (busyId) return;
    const confirmed = window.confirm(`Delete "${board.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setBusyId(board.id);
    try {
      await deleteFeudBoard(board.id);
      setCustomBoards((previous) => {
        const next = previous.filter((row) => row.id !== board.id);
        cacheBoardList(next);
        return next;
      });
    } catch (error) {
      setListError(`Could not delete that board. ${error.message}`);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="feud-page feud-menu-page game-catalog-page">
      <div className="game-catalog-shell">
        <GameMenuToolbar
          searchValue={query}
          onSearchChange={(event) => setQuery(event.target.value)}
          searchPlaceholder="Search boards, topics, hashtags..."
          mineLabel="My Boards"
          mineActive={showMineOnly}
          onMineClick={() => {
              if (!user) {
                navigate('/auth?mode=login&next=/class-feud');
                return;
              }
              setShowMineOnly((value) => !value);
          }}
          favoritesActive={showFavoritesOnly}
          onFavoritesClick={() => setShowFavoritesOnly((value) => !value)}
          onCreateClick={() => navigate('/class-feud/create')}
          onGenerateClick={() => navigate('/class-feud/create')}
          createAriaLabel="Create a Class Feud board"
          generateAriaLabel="Generate a Class Feud board"
        />
      </div>

      {listError && <p className="feud-menu-error">{listError}</p>}

      <MasonryDeckGrid className="feud-board-grid">
        {boards.map((board) => {
          const isOwner = Boolean(board.isCustom && user && board.authorId === user.id);
          const author = board.isCustom ? (isOwner ? 'You' : 'Teacher') : 'Classbop';
          const rounds = roundCountOf(board);
          const level = board.level || 'Custom';

          return (
            <DeckCard
              key={board.id}
              onClick={() => navigate(`/class-feud/${board.id}`)}
              title=""
              ariaLabel={`${board.title}. ${board.subtitle || 'A custom Class Feud board.'}`}
              className="feud-topic-card"
              media={(
                <div className="feud-topic-card-identity" style={{ '--feud-topic-color': board.color || '#38BDF8' }}>
                  <span className="feud-topic-card-art-frame"><FeudTopicArt boardId={board.id} /></span>
                  <span className="feud-topic-card-copy">
                    <h2>{board.title}</h2>
                    <p>{board.subtitle || 'A custom Class Feud board.'}</p>
                  </span>
                </div>
              )}
              meta={[
                { id: 'author', tone: 'author', icon: '●', label: author },
                { id: 'level', tone: 'level', icon: '★', label: compactFeudLevel(level), title: level },
                { id: 'rounds', tone: 'count', icon: '#', label: rounds, title: `${rounds} rounds` },
              ]}
              actions={isOwner && (
                <>
                  <button
                    type="button"
                    aria-label={`Edit ${board.title}`}
                    title="Edit board"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/class-feud/edit/${board.id}`);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={busyId === board.id}
                    aria-label={`Delete ${board.title}`}
                    title="Delete board"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeBoard(board);
                    }}
                  >
                    <TrashIcon />
                  </button>
                </>
              )}
            />
          );
        })}
      </MasonryDeckGrid>

      {boards.length === 0 && <p className="feud-menu-empty">No boards match “{query}”.</p>}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Setup
   -------------------------------------------------------------------------- */

function FeudSetup({ board, onStart, onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const totalRounds = board.rounds.length;
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState(() => makeDefaultTeamNames(2));
  const [strikes, setStrikes] = useState(3);
  const [roundCount, setRoundCount] = useState(totalRounds);
  const [shuffle, setShuffle] = useState(false);
  const [micLang, setMicLang] = useState('en-US');
  const isOwner = Boolean(board.isCustom && user && board.authorId === user.id);

  const changeTeamCount = (count) => {
    setTeamCount(count);
    setTeamNames((previous) => Array.from({ length: count }, (_, index) => previous[index] || `TEAM ${index + 1}`));
  };

  return (
    <div className="feud-page feud-setup-page">
      <button type="button" className="feud-back" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        <span>All boards</span>
      </button>

      <div className="feud-setup-shell">
        <section className="feud-setup-card">
          <header className="feud-setup-banner">
            <div className="feud-setup-heading">
              <span className="feud-setup-heading-icon"><Gamepad2 aria-hidden="true" /></span>
              <div>
                <h1>Game Setup</h1>
                <p>Set up <strong>{board.title}</strong> and get ready to play.</p>
              </div>
            </div>
          </header>

          <div className="feud-setup-options">
            <section className="feud-setup-field">
              <div className="feud-setup-field-heading">
                <span><Users aria-hidden="true" /></span>
                <h2>Teams</h2>
              </div>
              <div className="feud-segments feud-team-count-segments">
                {TEAM_OPTIONS.map((count) => (
                  <button
                    type="button"
                    key={count}
                    className={teamCount === count ? 'selected' : ''}
                    aria-pressed={teamCount === count}
                    onClick={() => changeTeamCount(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </section>

            <section className="feud-setup-field">
              <div className="feud-setup-field-heading">
                <span><PencilLine aria-hidden="true" /></span>
                <h2>Team Names</h2>
              </div>
              <div className="feud-team-names">
                {teamNames.map((name, index) => (
                  <input
                    key={index}
                    value={name}
                    maxLength={16}
                    aria-label={`Team ${index + 1} name`}
                    style={{ '--team-color': TEAM_COLORS[index % TEAM_COLORS.length] }}
                    onChange={(event) => setTeamNames((previous) => previous.map((row, rowIndex) => (
                      rowIndex === index ? event.target.value : row
                    )))}
                  />
                ))}
              </div>
            </section>

            <section className="feud-setup-field">
              <div className="feud-setup-field-heading">
                <span><Zap aria-hidden="true" /></span>
                <h2>Strikes Before Round Ends</h2>
              </div>
              <div className="feud-segments feud-strike-segments">
                {STRIKE_OPTIONS.map((count) => (
                  <button
                    type="button"
                    key={count}
                    className={strikes === count ? 'selected' : ''}
                    aria-pressed={strikes === count}
                    aria-label={`${count} strikes`}
                    onClick={() => setStrikes(count)}
                  >
                    {'X'.repeat(count)}
                  </button>
                ))}
              </div>
            </section>

            <section className="feud-setup-field">
              <div className="feud-setup-field-heading">
                <span><ListOrdered aria-hidden="true" /></span>
                <h2>Rounds to Play</h2>
              </div>
              <div className="feud-round-setting">
                <input
                  className="feud-number-input"
                  type="number"
                  min={1}
                  max={totalRounds}
                  value={roundCount}
                  aria-label="Rounds to play"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setRoundCount(Number.isFinite(value) ? Math.min(totalRounds, Math.max(1, value)) : totalRounds);
                  }}
                />
                <p className="feud-setup-note">This board has {totalRounds} survey questions.</p>
              </div>
            </section>

            <section className="feud-setup-field">
              <div className="feud-setup-field-heading">
                <span><Languages aria-hidden="true" /></span>
                <h2>Microphone Language</h2>
              </div>
              <div className="feud-segments feud-language-segments">
                {MIC_LANGUAGES.map((language) => (
                  <button
                    type="button"
                    key={language.id}
                    className={micLang === language.id ? 'selected' : ''}
                    aria-pressed={micLang === language.id}
                    onClick={() => setMicLang(language.id)}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="feud-setup-field feud-setup-toggle-field">
              <div className="feud-setup-field-heading">
                <span><Shuffle aria-hidden="true" /></span>
                <h2>Shuffle the Round Order</h2>
              </div>
              <label className="feud-toggle">
                <input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} />
                <span className="feud-toggle-track" aria-hidden="true"><span /></span>
                <span className="feud-visually-hidden">Shuffle the round order</span>
              </label>
            </section>
          </div>

          <div className="feud-setup-actions">
            {isOwner && (
              <button type="button" className="feud-ghost-button" onClick={() => navigate(`/class-feud/edit/${board.id}`)}>
                Edit this board
              </button>
            )}
            <button
              type="button"
              className="feud-primary-button feud-setup-start"
              onClick={() => {
                playFeudAudio(FEUD_START_SOUND_SRC, 0.6);
                onStart({
                  teamNames: teamNames.map((name, index) => name.trim() || `TEAM ${index + 1}`),
                  strikes,
                  roundCount,
                  shuffle,
                  micLang,
                });
              }}
            >
              <Sparkles aria-hidden="true" />
              <span>Start the feud</span>
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Microphone
   -------------------------------------------------------------------------- */

/**
 * Wraps the Web Speech API. `onFinalResult` fires once per utterance; interim
 * text is streamed back so the input shows what the student is saying.
 */
function useSpeechInput({ lang, onInterim, onFinalResult }) {
  const recognitionRef = useRef(null);
  const callbacksRef = useRef({ onInterim, onFinalResult });
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');

  useEffect(() => {
    callbacksRef.current = { onInterim, onFinalResult };
  });

  const isSupported = typeof window !== 'undefined'
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      setMicError('This browser cannot listen. Chrome works best — you can still type the answer.');
      return;
    }

    if (recognitionRef.current) {
      stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          // Alternatives give the matcher a second chance at accented English.
          const alternatives = Array.from(result).map((option) => option.transcript);
          callbacksRef.current.onFinalResult?.(transcript, alternatives);
        } else {
          interim += transcript;
        }
      }
      if (interim) callbacksRef.current.onInterim?.(interim);
    };

    recognition.onerror = (event) => {
      setMicError(event.error === 'not-allowed'
        ? 'Microphone blocked. Allow mic access in the browser, or just type the answer.'
        : 'The microphone did not catch that. Try again or type the answer.');
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setMicError('');
    setIsListening(true);
    recognition.start();
  }, [isSupported, lang, stop]);

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
  }, []);

  return { isSupported, isListening, micError, start, stop, clearError: () => setMicError('') };
}

/* --------------------------------------------------------------------------
   Board
   -------------------------------------------------------------------------- */

function FeudBoard({ board, settings, onReset, sfxVolume, onSfxVolumeChange }) {
  const playSound = useFeudSounds(sfxVolume > 0, sfxVolume);
  const rounds = useMemo(
    () => pickFeudRounds(board, settings.roundCount, settings.shuffle),
    [board, settings.roundCount, settings.shuffle]
  );

  const [roundIndex, setRoundIndex] = useState(0);
  const [revealed, setRevealed] = useState([]);
  // Answers a team actually scored. Anything revealed but not in here was
  // opened up by "Reveal the rest" or a strike-out, and shows red not gold.
  const [earned, setEarned] = useState([]);
  const [strikes, setStrikes] = useState(0);
  const [scores, setScores] = useState(() => settings.teamNames.map(() => 0));
  const [activeTeam, setActiveTeam] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [strikeFlash, setStrikeFlash] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [soundPanelOpen, setSoundPanelOpen] = useState(false);
  const inputRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const strikeTimerRef = useRef(null);

  const round = rounds[roundIndex];
  const answers = useMemo(() => round?.answers || [], [round]);
  const roundComplete = answers.length > 0 && revealed.length === answers.length;
  const roundBusted = strikes >= settings.strikes;
  const roundOver = roundComplete || roundBusted;
  const isLastRound = roundIndex >= rounds.length - 1;

  const showFeedback = useCallback((next) => {
    window.clearTimeout(feedbackTimerRef.current);
    setFeedback(next);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 2200);
  }, []);

  const awardAnswer = useCallback((answerIndex, { fromGuess = true } = {}) => {
    const answer = answers[answerIndex];
    if (!answer) return;

    setRevealed((previous) => (previous.includes(answerIndex) ? previous : [...previous, answerIndex]));
    setEarned((previous) => (previous.includes(answerIndex) ? previous : [...previous, answerIndex]));
    setScores((previous) => previous.map((score, index) => (
      index === activeTeam ? score + answer.points : score
    )));
    playFeudAudio(fromGuess ? FEUD_CORRECT_SOUND_SRC : FEUD_REVEAL_SOUND_SRC, sfxVolume * 0.75);
    playSound('flip');
    showFeedback({ type: 'correct', text: `${answer.text} — ${answer.points} points!` });
  }, [answers, activeTeam, playSound, sfxVolume, showFeedback]);

  const addStrike = useCallback((message) => {
    playFeudAudio(FEUD_WRONG_SOUND_SRC, sfxVolume * 0.72);
    playSound('strike');
    setStrikeFlash(true);
    window.clearTimeout(strikeTimerRef.current);
    strikeTimerRef.current = window.setTimeout(() => setStrikeFlash(false), 950);

    const nextStrikes = strikes + 1;
    setStrikes(nextStrikes);

    if (nextStrikes < settings.strikes) {
      // The turn only moves on while the round is still alive.
      setActiveTeam((team) => (team + 1) % settings.teamNames.length);
    } else {
      // Striking out ends the round, so the rest of the board opens up.
      setRevealed(answers.map((_, index) => index));
    }

    showFeedback({ type: 'wrong', text: message });
  }, [answers, playSound, settings.strikes, settings.teamNames.length, sfxVolume, showFeedback, strikes]);

  const submitGuess = useCallback((rawGuess, alternatives = []) => {
    const candidates = [rawGuess, ...alternatives].map((value) => String(value || '').trim()).filter(Boolean);
    if (candidates.length === 0 || roundOver) return;

    setGuess('');

    for (const candidate of candidates) {
      const match = findFeudMatch(candidate, answers, revealed);
      if (match) {
        awardAnswer(match.index);
        return;
      }
    }

    for (const candidate of candidates) {
      if (findRevealedMatch(candidate, answers, revealed) !== -1) {
        playSound('duplicate');
        showFeedback({ type: 'duplicate', text: `“${candidate}” is already on the board — no strike.` });
        return;
      }
    }

    addStrike(`“${candidates[0]}” is not up there.`);
  }, [addStrike, answers, awardAnswer, playSound, revealed, roundOver, showFeedback]);

  const speech = useSpeechInput({
    lang: settings.micLang,
    onInterim: (text) => setGuess(text),
    onFinalResult: (text, alternatives) => submitGuess(text, alternatives),
  });

  const revealRest = () => {
    if (revealed.length === answers.length) return;
    playFeudAudio(FEUD_REVEAL_SOUND_SRC, sfxVolume * 0.7);
    setRevealed(answers.map((_, index) => index));
  };

  const goToNextRound = () => {
    window.clearTimeout(feedbackTimerRef.current);
    setFeedback(null);

    if (isLastRound) {
      playSound('finish');
      setGameOver(true);
      return;
    }

    playSound('round');
    setRoundIndex((previous) => previous + 1);
    setRevealed([]);
    setEarned([]);
    setStrikes(0);
    setGuess('');
    setActiveTeam((team) => (team + 1) % settings.teamNames.length);
  };

  const restartGame = () => {
    playSound('round');
    setRoundIndex(0);
    setRevealed([]);
    setEarned([]);
    setStrikes(0);
    setScores(settings.teamNames.map(() => 0));
    setActiveTeam(0);
    setGuess('');
    setFeedback(null);
    setGameOver(false);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    document.documentElement.requestFullscreen?.();
  };

  // The teacher types most of the time, so the input keeps focus between rounds.
  useEffect(() => {
    if (!roundOver && !gameOver) inputRef.current?.focus();
  }, [roundIndex, roundOver, gameOver]);

  useEffect(() => {
    if (roundComplete) playSound('round');
  }, [roundComplete, playSound]);

  useEffect(() => () => {
    window.clearTimeout(feedbackTimerRef.current);
    window.clearTimeout(strikeTimerRef.current);
  }, []);

  const topScore = Math.max(...scores);
  const winners = settings.teamNames.filter((_, index) => scores[index] === topScore);
  const roundTotal = answers.reduce((total, answer) => total + answer.points, 0);
  const foundTotal = revealed.reduce((total, index) => total + (answers[index]?.points || 0), 0);

  if (!round) {
    return (
      <div className="feud-page feud-play-page">
        <p className="feud-menu-empty">This board has no playable rounds yet.</p>
        <button type="button" className="feud-primary-button" onClick={onReset}>Back to setup</button>
      </div>
    );
  }

  return (
    <div className={`feud-page feud-play-page${strikeFlash ? ' is-striking' : ''}`}>
      <header className="feud-play-topbar">
        <div className="feud-play-round">
          <span>Round {roundIndex + 1} / {rounds.length}</span>
          <strong>{foundTotal} / {roundTotal} pts found</strong>
        </div>

        <div className="feud-team-row" style={{ '--team-count': settings.teamNames.length }}>
          {settings.teamNames.map((teamName, index) => (
            <div
              key={`${teamName}-${index}`}
              className={`feud-team-card${activeTeam === index ? ' is-active' : ''}`}
              style={{ '--team-color': TEAM_COLORS[index % TEAM_COLORS.length] }}
            >
              <button
                type="button"
                className="feud-team-pick"
                onClick={() => setActiveTeam(index)}
                aria-label={`Give the turn to ${teamName}`}
              >
                <strong>{teamName}</strong>
                <span>{scores[index]}</span>
              </button>
            </div>
          ))}
        </div>

        <div className="feud-play-tools">
          <div className="feud-sound-menu">
            <button
              type="button"
              className="feud-circle-button"
              onClick={() => setSoundPanelOpen((open) => !open)}
              aria-label="Sound settings"
              aria-expanded={soundPanelOpen}
            >
              <Music aria-hidden="true" />
            </button>
            {soundPanelOpen && (
              <div className="feud-sound-popover">
                <label>
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
          <button type="button" className="feud-circle-button" onClick={toggleFullscreen} aria-label="Fullscreen">
            <Maximize2 aria-hidden="true" />
          </button>
          <button
            type="button"
            className="feud-circle-button feud-exit-button"
            onClick={() => { playSound('close'); onReset(); }}
            aria-label="Exit game"
          >
            <CloseIcon aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="feud-game-board">
        <div className="feud-prompt-card">
          {round.image && (
            <div className="feud-prompt-image">
              <img src={round.image} alt="" />
            </div>
          )}
          <h2>{round.prompt || 'Name the top answers.'}</h2>
        </div>

        <div className={`feud-answer-board${answers.length > 5 ? ' is-two-column' : ''}`}>
          {answers.map((answer, index) => {
            const isRevealed = revealed.includes(index);
            const isExposed = isRevealed && !earned.includes(index);

            return (
              <button
                type="button"
                key={`${answer.text}-${index}`}
                className={`feud-tile${isRevealed ? ' is-revealed' : ''}${isExposed ? ' is-exposed' : ''}`}
                style={{ '--tile-index': index }}
                onMouseEnter={() => playSound('hover')}
                onClick={() => {
                  if (isRevealed || roundOver) return;
                  awardAnswer(index, { fromGuess: false });
                }}
                aria-label={isRevealed ? `${answer.text}, ${answer.points} points` : `Hidden answer ${index + 1}`}
              >
                <span className="feud-tile-inner">
                  <span className="feud-tile-face feud-tile-front">
                    <span className="feud-tile-rank">{index + 1}</span>
                    <span className="feud-tile-star" aria-hidden="true">★</span>
                  </span>
                  <span className="feud-tile-face feud-tile-back">
                    <em>{answer.text}</em>
                    <b>{answer.points}</b>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="feud-strike-row" aria-label={`${strikes} of ${settings.strikes} strikes`}>
        <div className="feud-strike-marks">
          {Array.from({ length: settings.strikes }, (_, index) => (
            <span key={index} className={`feud-strike${index < strikes ? ' is-on' : ''}`}>✕</span>
          ))}
        </div>
        {!roundOver && (
          <div className="feud-strike-actions">
            <button type="button" className="feud-ghost-button feud-strike-manual" onClick={() => addStrike('Strike!')}>
              Give a strike
            </button>
            <button type="button" className="feud-ghost-button feud-strike-manual" onClick={revealRest}>
              Reveal the rest
            </button>
          </div>
        )}
        {roundOver && !gameOver && (
          <div className="feud-strike-actions">
            <button type="button" className="feud-ghost-button feud-strike-manual feud-next-round" onClick={goToNextRound}>
              {isLastRound ? 'See the final scores →' : 'Next round →'}
            </button>
          </div>
        )}
      </div>

      <div className="feud-control-dock">
        <div className="feud-answer-input-row">
          <input
            ref={inputRef}
            className="feud-answer-input"
            value={guess}
            placeholder={roundOver ? 'Round over — check the scores below' : `${settings.teamNames[activeTeam]}, what's the answer?`}
            disabled={roundOver}
            onChange={(event) => setGuess(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitGuess(guess);
              }
            }}
          />
          <button
            type="button"
            className={`feud-mic-button${speech.isListening ? ' is-listening' : ''}`}
            onClick={speech.isListening ? speech.stop : speech.start}
            disabled={roundOver}
            aria-label={speech.isListening ? 'Stop listening' : 'Answer with your voice'}
            aria-pressed={speech.isListening}
          >
            <MicIcon />
          </button>
          <button
            type="button"
            className="feud-primary-button feud-submit-button"
            disabled={roundOver || !guess.trim()}
            onClick={() => submitGuess(guess)}
          >
            Answer
          </button>
        </div>

        {speech.micError && <p className="feud-mic-error">{speech.micError}</p>}
        {speech.isListening && <p className="feud-mic-status">Listening... say the answer.</p>}
      </div>

      {feedback && (
        <div className={`feud-feedback is-${feedback.type}`} role="status">{feedback.text}</div>
      )}

      {strikeFlash && (
        <div className="feud-strike-overlay" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <path d="M22 22 98 98" />
            <path d="M98 22 22 98" />
          </svg>
          <span>STRIKE!</span>
        </div>
      )}

      {gameOver && (
        <div className="feud-modal-backdrop" role="dialog" aria-modal="true">
          <section className="feud-modal">
            <p className="feud-modal-kicker">Game over</p>
            <h2>{winners.length > 1 ? `It's a tie: ${winners.join(' & ')}` : `${winners[0]} wins!`}</h2>
            <div className="feud-modal-scores">
              {settings.teamNames.map((teamName, index) => (
                <div key={`${teamName}-final-${index}`} style={{ '--team-color': TEAM_COLORS[index % TEAM_COLORS.length] }}>
                  <span>{teamName}</span>
                  <strong>{scores[index]}</strong>
                </div>
              ))}
            </div>
            <div className="feud-modal-actions">
              <button type="button" className="feud-primary-button" onClick={restartGame}>Play again</button>
              <button type="button" className="feud-ghost-button" onClick={onReset}>Back to setup</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Route entry
   -------------------------------------------------------------------------- */

export default function ClassFeud() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { board, isLoading } = useFeudBoard(boardId);
  // The session is tagged with its board so switching boards drops any
  // in-progress settings without an extra effect.
  const [session, setSession] = useState({ boardId: null, settings: null });
  const [sfxVolume, setSfxVolume] = useState(0.68);
  const settings = session.boardId === boardId ? session.settings : null;
  const setSettings = (nextSettings) => setSession({ boardId, settings: nextSettings });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('classbop:quiz-play-navbar', {
      detail: { hidden: Boolean(settings && boardId) },
    }));

    return () => {
      window.dispatchEvent(new CustomEvent('classbop:quiz-play-navbar', { detail: { hidden: false } }));
    };
  }, [boardId, settings]);

  if (!boardId) return <FeudMenu />;

  if (isLoading) {
    return (
      <div className="feud-page">
        <p className="feud-menu-empty">Loading board…</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="feud-page">
        <p className="feud-menu-empty">That Class Feud board could not be found.</p>
        <button type="button" className="feud-primary-button" onClick={() => navigate('/class-feud')}>
          Back to all boards
        </button>
      </div>
    );
  }

  if (!settings) {
    return <FeudSetup board={board} onStart={setSettings} onBack={() => navigate('/class-feud')} />;
  }

  return (
    <FeudBoard
      board={board}
      settings={settings}
      onReset={() => setSettings(null)}
      sfxVolume={sfxVolume}
      onSfxVolumeChange={setSfxVolume}
    />
  );
}
