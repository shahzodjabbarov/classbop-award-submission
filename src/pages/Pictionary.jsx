import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import DeckCard from '../components/DeckCard';
import GameMenuToolbar from '../components/GameMenuToolbar';
import MasonryDeckGrid from '../components/MasonryDeckGrid';
import { matchesSearch } from '../components/gameSearch';
import {
  PICTIONARY_CATEGORIES,
  getPromptById,
} from '../games/pictionary/pictionaryData';
import {
  deletePictionarySet,
  fetchPictionarySetList,
  usePictionaryCategory,
} from '../games/pictionary/pictionarySets';
import { usePictionarySession } from '../games/pictionary/usePictionarySession';
import { playMachineRevealSound, playMachineSpinSound } from '../games/bingo/pickerSounds';
import { useAuth } from '../auth/useAuth';
import { useI18n } from '../i18n/useI18n';
import abcBlocksImage from '../assets/landing/abc-blocks.png';
import bookImage from '../assets/landing/book.png';
import gameControllerImage from '../assets/landing/game-controller.png';
import pencilImage from '../assets/landing/pencil.png';
import {
  DEFAULT_TEAM_NAMES,
  TEAM_COLORS,
  TIMER_OPTIONS,
  addPoint,
  buildControlUrl,
  createPictionarySession,
  createSessionCode,
  getCurrentPrompt,
  getEffectiveTimeLeft,
  getSessionStats,
  hideAnswer,
  nextRound,
  pauseTimer,
  previousRound,
  resetTimer,
  revealAnswer,
  setTeamCount,
  setTeamName,
  setTimerDuration,
  shuffleDeck,
  startTimer,
  updateSession,
} from '../games/pictionary/pictionaryUtils';
import './Pictionary.css';

const PROMPT_DRAW_DURATION_MS = 1450;
const PICTIONARY_STAGE_WIDTH = 1920;
const PICTIONARY_STAGE_HEIGHT = 1080;

const TEAM_SETUP_KEY = 'pictionary-team-setup';

function loadTeamSetup() {
  try {
    const saved = window.localStorage.getItem(TEAM_SETUP_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveTeamSetup(setup) {
  try {
    window.localStorage.setItem(TEAM_SETUP_KEY, JSON.stringify(setup));
  } catch {
    /* ignore */
  }
}

const STAGE_DECORATIONS = [
  { name: 'pencil', image: pencilImage },
  { name: 'book', image: bookImage },
  { name: 'abc', image: abcBlocksImage },
  { name: 'controller', image: gameControllerImage },
];

function StageDecorations() {
  return (
    <div className="pictionary-stage-decor" aria-hidden="true">
      {STAGE_DECORATIONS.map((decoration, index) => (
        <span
          key={decoration.name}
          className={`pictionary-decor-${decoration.name}`}
          style={{ '--order': index }}
        >
          <img src={decoration.image} alt="" draggable="false" />
        </span>
      ))}
    </div>
  );
}

function getStageScale() {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.innerWidth / PICTIONARY_STAGE_WIDTH, window.innerHeight / PICTIONARY_STAGE_HEIGHT);
}

function useStageScale() {
  const [scale, setScale] = useState(() => getStageScale());

  useEffect(() => {
    const handleResize = () => setScale(getStageScale());
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return scale;
}

function useNow(active) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [active]);

  return now;
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function getCategoryName(t, category) {
  if (!category) return t('pictionary.landing.title');
  if (category.isCustom) return category.name;
  return t(`pictionary.categories.${category.id}.name`);
}

function getCategoryDescription(t, category) {
  if (!category) return '';
  if (category.isCustom) {
    return category.hashtags?.length
      ? category.hashtags.map((tag) => `#${tag}`).join(' ')
      : t('pictionary.landing.customDescription');
  }
  return t(`pictionary.categories.${category.id}.description`);
}

function isImageSource(image) {
  return typeof image === 'string' &&
    (image.startsWith('data:') || image.startsWith('http') || image.startsWith('/'));
}

function PromptVisual({ prompt }) {
  const image = prompt?.image || '';
  if (!image) return null;
  if (isImageSource(image)) return <img src={image} alt="" draggable="false" />;
  return <span>{image}</span>;
}

function PictionaryLoading() {
  const { t } = useI18n();

  return (
    <div className="pictionary-page pictionary-missing">
      <p className="pictionary-muted">{t('common.loading')}</p>
    </div>
  );
}

function getActiveTeamIndex(session) {
  const teamCount = Math.max(1, Number(session?.teamCount) || 1);
  return Math.max(0, (Number(session?.roundIndex) || 0) % teamCount);
}

function MissingPictionaryThing({ label }) {
  const { t } = useI18n();

  return (
    <div className="pictionary-page pictionary-missing">
      <h1>{label || t('pictionary.missing.page')}</h1>
      <Link className="pictionary-button secondary" to="/pictionary">{t('pictionary.missing.back')}</Link>
    </div>
  );
}

function PictionaryCategoryArt({ category }) {
  if (category?.artX == null || category?.artY == null) return null;

  return (
    <span
      className="pictionary-category-art"
      style={{ '--pic-art-x': category.artX, '--pic-art-y': category.artY }}
      aria-hidden="true"
    />
  );
}

function CategoryCard({ category, isOwner = false, onEdit, onDelete }) {
  const { t } = useI18n();
  const author = category.isCustom
    ? (isOwner ? 'You' : t('common.teacher'))
    : t('common.classBop');
  const promptsLabel = t('common.prompts', { count: category.promptCount });
  const hasIllustratedCover = category.artX != null && category.artY != null;

  return (
    <DeckCard
      to={`/pictionary/${category.id}`}
      title={getCategoryName(t, category)}
      description={getCategoryDescription(t, category)}
      image={hasIllustratedCover ? undefined : category.thumbnail}
      media={hasIllustratedCover ? <PictionaryCategoryArt category={category} /> : undefined}
      mediaRatio={hasIllustratedCover ? 1 : undefined}
      emoji={category.icon}
      mediaBackground={`linear-gradient(150deg, ${category.accent} 0%, ${category.color}55 100%)`}
      meta={[
        { id: 'author', tone: 'author', icon: '●', label: author },
        { id: 'prompts', tone: 'count', icon: '✎', label: category.promptCount, title: promptsLabel },
      ]}
      actions={isOwner && (
        <>
          <button
            type="button"
            aria-label={t('pictionary.landing.edit')}
            title={t('pictionary.landing.edit')}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onEdit?.();
            }}
          >
            ✎
          </button>
          <button
            type="button"
            className="danger"
            aria-label={t('pictionary.landing.delete')}
            title={t('pictionary.landing.delete')}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete?.();
            }}
          >
            🗑
          </button>
        </>
      )}
    />
  );
}

export function PictionaryLanding() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customSets, setCustomSets] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const handleDeleteSet = async (category) => {
    if (!window.confirm(t('pictionary.landing.deleteConfirm', { title: category.name }))) return;
    try {
      await deletePictionarySet(category.id);
      setCustomSets((sets) => (sets || []).filter((set) => set.id !== category.id));
    } catch (deleteError) {
      window.alert(t('pictionary.landing.deleteFailed', { message: deleteError.message }));
    }
  };

  useEffect(() => {
    let isActive = true;
    fetchPictionarySetList()
      .then((sets) => { if (isActive) setCustomSets(sets); })
      .catch(() => { if (isActive) setCustomSets([]); });
    return () => { isActive = false; };
  }, []);

  const visibleSets = (customSets || []).filter(
    (set) => set.isPublic || (user && set.authorId === user.id)
  );

  const matchesCategory = (category) =>
    matchesSearch(searchTerm, [
      getCategoryName(t, category),
      getCategoryDescription(t, category),
    ]);

  const filteredOfficial = (showMineOnly || showFavoritesOnly)
    ? []
    : PICTIONARY_CATEGORIES.filter(matchesCategory);
  const filteredSets = visibleSets
    .filter((set) => !showMineOnly || (user && set.authorId === user.id))
    .filter(() => !showFavoritesOnly)
    .filter(matchesCategory);
  const totalResults = filteredOfficial.length + filteredSets.length;

  return (
    <div className="pictionary-page game-catalog-page">
      <div className="game-catalog-shell">
        <GameMenuToolbar
          searchValue={searchTerm}
          onSearchChange={(event) => setSearchTerm(event.target.value)}
          searchPlaceholder={t('pictionary.landing.searchPlaceholder')}
          mineLabel="My Packs"
          mineActive={showMineOnly}
          onMineClick={() => {
              if (!user) {
                navigate('/auth?mode=login&next=/pictionary');
                return;
              }
              setShowMineOnly((value) => !value);
          }}
          favoritesActive={showFavoritesOnly}
          onFavoritesClick={() => setShowFavoritesOnly((value) => !value)}
          onCreateClick={() => navigate('/pictionary/create')}
          onGenerateClick={() => navigate('/pictionary/create')}
          createAriaLabel="Create new word pack"
          generateAriaLabel="Generate a word pack"
        />
      </div>

      {totalResults > 0 && (
        <MasonryDeckGrid as="main" className="pictionary-deck-grid">
          {filteredOfficial.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          {filteredSets.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isOwner={Boolean(user && category.authorId === user.id)}
              onEdit={() => navigate(`/pictionary/edit/${category.id}`)}
              onDelete={() => handleDeleteSet(category)}
            />
          ))}
        </MasonryDeckGrid>
      )}

      {searchTerm && totalResults === 0 && (
        <p style={{ textAlign: 'center', margin: '8px auto 48px', fontWeight: 700, color: '#0F172A' }}>
          {t('pictionary.landing.noResults')}
        </p>
      )}
    </div>
  );
}

export function PictionaryModeSelect() {
  const { categoryId } = useParams();
  const { t } = useI18n();
  const { category, isLoading } = usePictionaryCategory(categoryId);
  const [teamCount, setSelectedTeamCount] = useState(() => {
    const saved = Number(loadTeamSetup()?.teamCount);
    return saved >= 1 && saved <= 4 ? saved : 2;
  });
  const [teamNames, setTeamNamesState] = useState(() => {
    const saved = loadTeamSetup()?.teamNames;
    return Array.from({ length: 4 }, (_, index) => saved?.[index] || DEFAULT_TEAM_NAMES[index]);
  });

  if (isLoading) return <PictionaryLoading />;
  if (!category) return <MissingPictionaryThing label={t('pictionary.missing.category')} />;

  const handleNameChange = (index, value) => {
    setTeamNamesState((currentNames) => currentNames.map((name, nameIndex) => nameIndex === index ? value.slice(0, 18) : name));
  };

  const handleStart = () => saveTeamSetup({ teamCount, teamNames });

  return (
    <div className="pictionary-page">
      <header className="pictionary-compact-header">
        <Link className="pictionary-back-link" to="/pictionary">{t('pictionary.mode.back')}</Link>
        <div className="pictionary-selected-category" style={{ '--category-color': category.color }}>
          <span>
            {category.artX != null
              ? <PictionaryCategoryArt category={category} />
              : category.thumbnail
                ? <img src={category.thumbnail} alt="" />
                : category.icon}
          </span>
          <div>
            <p className="pictionary-kicker">{t('pictionary.mode.readyPrompts', { count: category.promptCount })}</p>
            <h1>{getCategoryName(t, category)}</h1>
          </div>
        </div>
      </header>

      <main className="pictionary-start-layout">
        <section className="pictionary-start-panel" style={{ '--category-color': category.color }}>
          <div className="pictionary-start-copy">
            <p className="pictionary-kicker">{t('pictionary.mode.kicker')}</p>
            <h2>{t('pictionary.mode.title')}</h2>
            <p>{t('pictionary.mode.text')}</p>

            <Link
              className="pictionary-button primary pictionary-start-button"
              to={`/pictionary/${category.id}/qr`}
              state={{ teamCount, teamNames }}
              onClick={handleStart}
            >
              {t('pictionary.mode.start')}
            </Link>
          </div>

          <div className="pictionary-team-setup">
            <p>{t('pictionary.teams.title')}</p>
            <div className="pictionary-team-count">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={teamCount === count ? 'selected' : ''}
                  onClick={() => setSelectedTeamCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
            <div className="pictionary-team-names">
              {Array.from({ length: teamCount }, (_, index) => (
                <label key={index} style={{ '--team-color': TEAM_COLORS[index] }}>
                  <span />
                  <input
                    value={teamNames[index]}
                    maxLength={18}
                    placeholder={DEFAULT_TEAM_NAMES[index]}
                    onChange={(event) => handleNameChange(index, event.target.value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProjectorScoreboard({ session, activeTeamIndex }) {
  return (
    <div className="pictionary-scoreboard">
      {session.teamNames.slice(0, session.teamCount).map((teamName, index) => (
        <div
          key={`${teamName}-${index}`}
          className={index === activeTeamIndex ? 'active' : ''}
          style={{ '--team-color': TEAM_COLORS[index] }}
        >
          <span>{index === activeTeamIndex ? `✏️ ${teamName}` : teamName}</span>
          <strong>{session.scores[index]}</strong>
        </div>
      ))}
    </div>
  );
}

function ProjectorView({ session, category, setSession }) {
  const { t } = useI18n();
  const [isRevealZoomed, setIsRevealZoomed] = useState(false);
  useNow(session?.timerStatus === 'running');

  useEffect(() => {
    if (session?.revealed) return undefined;
    const resetRevealZoom = window.setTimeout(() => setIsRevealZoomed(false), 0);
    return () => window.clearTimeout(resetRevealZoom);
  }, [session?.revealed]);
  const displayTime = getEffectiveTimeLeft(session);
  const stats = getSessionStats(session);
  const activeTeamIndex = getActiveTeamIndex(session);
  const isWarning = displayTime <= 10 && session.timerStatus === 'running';
  const isRunning = session.timerStatus === 'running' && displayTime > 0;
  const apply = (action) => setSession?.((currentSession) => currentSession ? action(currentSession) : currentSession);
  const prompt = getCurrentPrompt(session);
  const statusText = session.timerStatus === 'running'
    ? t('pictionary.projector.drawingTime')
    : t('pictionary.projector.startFromPhone');

  return (
    <section className={`pictionary-projector ${isWarning ? 'timer-warning' : ''} ${session.revealed ? 'is-revealed' : ''}`}>
      <ProjectorScoreboard session={session} activeTeamIndex={activeTeamIndex} />

      <div className="pictionary-projector-top">
        <span>{t('pictionary.projector.round', { round: stats.roundNumber, total: stats.total })}</span>
        <span>{t('common.promptsLeft', { count: stats.remaining })}</span>
      </div>

      <div className="pictionary-timer-stage" style={{ '--active-team-color': TEAM_COLORS[activeTeamIndex] }}>
        {session.revealed ? (
          <div
            className="pictionary-stage-reveal"
            key={prompt?.id || 'answer'}
            role="button"
            tabIndex={0}
            onClick={() => setIsRevealZoomed(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setIsRevealZoomed(true);
            }}
          >
            <em>{t('pictionary.projector.answerRevealed')}</em>
            <PromptVisual prompt={prompt} />
            <strong>{prompt?.word || ''}</strong>
          </div>
        ) : (
          <>
            <div className="pictionary-time-shell">
              <strong>{formatTime(displayTime)}</strong>
              {session.timerStatus === 'running' && <em>{statusText}</em>}
            </div>

            <button
              type="button"
              className={`pictionary-stage-start ${isRunning ? 'is-running' : ''}`}
              onClick={() => apply(isRunning ? pauseTimer : startTimer)}
            >
              <span aria-hidden="true">{isRunning ? '❚❚' : '▶'}</span>
              {isRunning ? t('pictionary.teacher.pause') : t('pictionary.teacher.start')}
            </button>
          </>
        )}
      </div>

      <div className="pictionary-projector-controls">
        <button
          type="button"
          className={`pictionary-projector-reveal ${session.revealed ? 'is-revealed' : ''}`}
          onClick={() => apply(session.revealed ? hideAnswer : revealAnswer)}
        >
          {session.revealed ? t('pictionary.teacher.hideAnswer') : t('pictionary.teacher.revealAnswer')}
        </button>

        <div className="pictionary-projector-score-controls" aria-label={t('pictionary.teacher.score')}>
          {session.teamNames.slice(0, session.teamCount).map((teamName, index) => (
            <div
              key={`${teamName}-${index}`}
              className={index === activeTeamIndex ? 'active' : ''}
              style={{ '--team-color': TEAM_COLORS[index] }}
            >
              <span>{teamName}</span>
              <button
                type="button"
                onClick={() => apply((currentSession) => addPoint(currentSession, index, -1))}
                aria-label={`${teamName} -1`}
              >
                -
              </button>
              <strong>{session.scores[index] || 0}</strong>
              <button
                type="button"
                onClick={() => apply((currentSession) => addPoint(currentSession, index))}
                aria-label={`${teamName} +1`}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pictionary-stage-footer">
        <span>{getCategoryName(t, category)} · {t('pictionary.landing.title')}</span>
      </div>

      {session.revealed && isRevealZoomed && (
        <div
          className="pictionary-stage-zoom"
          role="button"
          tabIndex={0}
          onClick={() => setIsRevealZoomed(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' || event.key === 'Enter') setIsRevealZoomed(false);
          }}
        >
          <PromptVisual prompt={prompt} />
          <strong>{prompt?.word || ''}</strong>
        </div>
      )}
    </section>
  );
}

function TimerSettings({ session, setSession }) {
  const { t } = useI18n();
  const [customTimer, setCustomTimer] = useState('');
  const apply = (action) => setSession((currentSession) => currentSession ? action(currentSession) : currentSession);

  return (
    <div className="pictionary-teacher-section">
      <h3>{t('pictionary.timer.title')}</h3>
      <div className="pictionary-timer-options">
        {TIMER_OPTIONS.map((seconds) => (
          <button
            key={seconds}
            type="button"
            className={session.timerDuration === seconds ? 'selected' : ''}
            onClick={() => apply((currentSession) => setTimerDuration(currentSession, seconds))}
          >
            {seconds}s
          </button>
        ))}
      </div>
      <form
        className="pictionary-custom-timer"
        onSubmit={(event) => {
          event.preventDefault();
          if (customTimer.trim()) {
            apply((currentSession) => setTimerDuration(currentSession, Number(customTimer)));
            setCustomTimer('');
          }
        }}
      >
        <input
          type="number"
          min="5"
          max="600"
          placeholder={t('pictionary.timer.customPlaceholder')}
          value={customTimer}
          onChange={(event) => setCustomTimer(event.target.value)}
        />
        <button type="submit">{t('pictionary.timer.set')}</button>
      </form>
    </div>
  );
}

function TeamSettings({ session, setSession }) {
  const { t } = useI18n();
  const apply = (action) => setSession((currentSession) => currentSession ? action(currentSession) : currentSession);

  return (
    <div className="pictionary-teacher-section">
      <h3>{t('pictionary.teams.title')}</h3>
      <div className="pictionary-team-count">
        {[1, 2, 3, 4].map((count) => (
          <button
            key={count}
            type="button"
            className={session.teamCount === count ? 'selected' : ''}
            onClick={() => apply((currentSession) => setTeamCount(currentSession, count))}
          >
            {count}
          </button>
        ))}
      </div>

      <div className="pictionary-team-names">
        {Array.from({ length: session.teamCount }, (_, index) => (
          <label key={index} style={{ '--team-color': TEAM_COLORS[index] }}>
            <span />
            <input
              value={session.teamNames[index] || DEFAULT_TEAM_NAMES[index]}
              onChange={(event) => apply((currentSession) => setTeamName(currentSession, index, event.target.value))}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function PromptPickerMachine({ session, setSession }) {
  const { t } = useI18n();
  const [isDrawing, setIsDrawing] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const timeoutRef = useRef(null);
  const stats = getSessionStats(session);
  const displayPrompt = getCurrentPrompt(session);
  const currentIndex = Math.max(0, Number(session.roundIndex) || 0);
  const remainingPromptIds = (session.promptOrder || []).slice(currentIndex + 1);
  const progress = stats.total ? (stats.roundNumber / stats.total) * 100 : 0;
  const canDrawNext = remainingPromptIds.length > 0 && !isDrawing;

  const clearDrawTimers = () => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  useEffect(() => () => clearDrawTimers(), []);

  const apply = (action) => setSession((currentSession) => currentSession ? action(currentSession) : currentSession);

  const drawNextPrompt = () => {
    if (!canDrawNext) return;

    clearDrawTimers();
    setIsDrawing(true);

    if (session.soundEnabled) playMachineSpinSound('gumball', PROMPT_DRAW_DURATION_MS);

    timeoutRef.current = window.setTimeout(() => {
      clearDrawTimers();
      setIsDrawing(false);
      apply(nextRound);
      if (session.soundEnabled) playMachineRevealSound();
    }, PROMPT_DRAW_DURATION_MS);
  };

  const shuffleFreshDeck = () => {
    clearDrawTimers();
    setIsDrawing(false);
    apply(shuffleDeck);
  };

  return (
    <div className={`pictionary-prompt-machine ${isDrawing ? 'is-drawing' : ''}`}>
      <div className="pictionary-prompt-machine-head">
        <p>{isDrawing ? t('pictionary.promptMachine.drawing') : t('pictionary.promptMachine.showThis')}</p>
        <span>{t('common.left', { count: stats.remaining })}</span>
      </div>

      <div className="pictionary-prompt-window" aria-live="polite">
        {isDrawing ? (
          <div className="pictionary-prompt-ticket is-back" key="drawing">
            <small>{t('pictionary.promptMachine.card')}</small>
            <span>❓</span>
            <strong>{t('pictionary.promptMachine.drawing')}</strong>
            <em>✦</em>
          </div>
        ) : (
          <div
            className={`pictionary-prompt-ticket ${displayPrompt?.image ? '' : 'text-only'}`}
            key={displayPrompt?.id || 'empty'}
            role="button"
            tabIndex={0}
            onClick={() => setIsZoomed(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setIsZoomed(true);
            }}
          >
            <small>{displayPrompt?.cardId || t('pictionary.promptMachine.card')}</small>
            <PromptVisual prompt={displayPrompt} />
            <strong>{displayPrompt?.word || t('pictionary.promptMachine.noPrompt')}</strong>
            <em>⤢</em>
          </div>
        )}
      </div>

      <div className="pictionary-prompt-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="pictionary-prompt-actions">
        <button
          type="button"
          onClick={() => apply(previousRound)}
          disabled={isDrawing || currentIndex === 0}
          aria-label={t('pictionary.promptMachine.previous')}
          title={t('pictionary.promptMachine.previous')}
        >
          ‹
        </button>
        <button
          type="button"
          className="primary"
          onClick={drawNextPrompt}
          disabled={!canDrawNext}
        >
          {isDrawing ? t('pictionary.promptMachine.drawing') : remainingPromptIds.length === 0 ? t('pictionary.promptMachine.deckFinished') : t('pictionary.promptMachine.drawNext')}
        </button>
        <button
          type="button"
          onClick={shuffleFreshDeck}
          disabled={isDrawing}
          aria-label={t('pictionary.promptMachine.shuffle')}
          title={t('pictionary.promptMachine.shuffle')}
        >
          ⟳
        </button>
      </div>

      {isZoomed && (
        <div
          className={`pictionary-prompt-zoom ${displayPrompt?.image ? '' : 'text-only'}`}
          role="button"
          tabIndex={0}
          onClick={() => setIsZoomed(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' || event.key === 'Enter') setIsZoomed(false);
          }}
        >
          <PromptVisual prompt={displayPrompt} />
          <strong>{displayPrompt?.word || ''}</strong>
          <i>×</i>
        </div>
      )}
    </div>
  );
}

function TeacherControlView({ session, setSession, standalone = false }) {
  const { t } = useI18n();
  useNow(session?.timerStatus === 'running');
  const [showMore, setShowMore] = useState(false);
  const stats = getSessionStats(session);
  const displayTime = getEffectiveTimeLeft(session);
  const activeTeamIndex = getActiveTeamIndex(session);
  const currentTeam = session.teamNames[activeTeamIndex] || t('pictionary.projector.team');
  const isRunning = session.timerStatus === 'running' && displayTime > 0;
  const apply = (action) => setSession((currentSession) => currentSession ? action(currentSession) : currentSession);

  return (
    <section className={`pictionary-teacher-control ${standalone ? 'standalone' : ''}`}>
      <div className="pictionary-phone-top">
        <div>
          <p>{t('pictionary.teacher.header', { round: stats.roundNumber })}</p>
          <h1>{currentTeam}</h1>
        </div>
        <button
          type="button"
          className={`pictionary-more-toggle ${showMore ? 'open' : ''}`}
          onClick={() => setShowMore((value) => !value)}
          aria-expanded={showMore}
          aria-label={t('pictionary.teacher.score')}
        >
          ⚙
        </button>
      </div>

      <PromptPickerMachine session={session} setSession={setSession} />

      <div className="pictionary-mobile-timer">
        <span>{formatTime(displayTime)}</span>
        <div className="pictionary-mobile-timer-actions">
          <button
            type="button"
            className="primary"
            onClick={() => apply(isRunning ? pauseTimer : startTimer)}
            aria-label={isRunning ? t('pictionary.teacher.pause') : t('pictionary.teacher.start')}
          >
            {isRunning ? '❚❚' : '▶'}
          </button>
          <button
            type="button"
            onClick={() => apply(resetTimer)}
            aria-label={t('pictionary.teacher.reset')}
          >
            ↺
          </button>
        </div>
      </div>

      <div className="pictionary-score-controls">
        {session.teamNames.slice(0, session.teamCount).map((teamName, index) => (
          <div
            key={`${teamName}-${index}`}
            className="pictionary-score-row"
            style={{ '--team-color': TEAM_COLORS[index] }}
          >
            <span>{teamName}</span>
            <strong>{session.scores[index] || 0}</strong>
            <button
              type="button"
              onClick={() => apply((currentSession) => addPoint(currentSession, index, -1))}
              aria-label={`${teamName} −1`}
            >
              −
            </button>
            <button
              type="button"
              className="plus"
              onClick={() => apply((currentSession) => addPoint(currentSession, index))}
              aria-label={`${teamName} +1`}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`pictionary-reveal-button ${session.revealed ? 'is-revealed' : ''}`}
        onClick={() => apply(session.revealed ? hideAnswer : revealAnswer)}
      >
        {session.revealed ? t('pictionary.teacher.hideAnswer') : t('pictionary.teacher.revealAnswer')}
      </button>

      {showMore && (
        <div className="pictionary-more-panel">
          <TimerSettings session={session} setSession={setSession} />
          <TeamSettings session={session} setSession={setSession} />

          <button
            type="button"
            className="pictionary-sound-toggle"
            onClick={() => apply((currentSession) => updateSession(currentSession, { soundEnabled: !currentSession.soundEnabled }))}
          >
            {t('pictionary.teacher.sound', { state: session.soundEnabled ? t('pictionary.teacher.on') : t('pictionary.teacher.off') })}
          </button>
        </div>
      )}
    </section>
  );
}

function QRJoinCard({ session, category, onClose }) {
  const { t } = useI18n();
  const controlUrl = buildControlUrl(session, category.id);
  const [qrImage, setQrImage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isActive = true;
    QRCode.toDataURL(controlUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    }).then((dataUrl) => {
      if (isActive) setQrImage(dataUrl);
    });

    return () => {
      isActive = false;
    };
  }, [controlUrl]);

  return (
    <section className="pictionary-qr-card">
      <button type="button" className="pictionary-qr-close" onClick={onClose} aria-label={t('pictionary.qr.hide')}>×</button>
      <p className="pictionary-qr-title">{t('pictionary.qr.teacherOnly')}</p>
      <div className="pictionary-qr-frame">
        {qrImage ? <img src={qrImage} alt={t('pictionary.qr.qrAlt')} /> : <div className="pictionary-qr-placeholder">QR</div>}
      </div>
      <div className="pictionary-qr-meta">
        <span>{t('pictionary.qr.session')}</span>
        <strong>{session.id}</strong>
      </div>
      <button
        type="button"
        className="pictionary-qr-copy-button"
        onClick={async () => {
          await navigator.clipboard?.writeText(controlUrl);
          setCopied(true);
        }}
      >
        {copied ? t('common.copied') : t('common.copyLink')}
      </button>
    </section>
  );
}

export function PictionaryLive() {
  const { categoryId } = useParams();
  const { t } = useI18n();
  const { category, isLoading } = usePictionaryCategory(categoryId);

  if (isLoading) return <PictionaryLoading />;
  if (!category) return <MissingPictionaryThing label={t('pictionary.missing.session')} />;
  return <PictionaryLiveInner category={category} />;
}

function PictionaryLiveInner({ category }) {
  const location = useLocation();
  const { t } = useI18n();
  const categoryId = category.id;
  const [sessionId] = useState(() => createSessionCode());
  const [showQr, setShowQr] = useState(false);
  const stageScale = useStageScale();
  const [teamSetup] = useState(() => {
    const fromNavigation = location.state;
    return fromNavigation?.teamCount ? fromNavigation : loadTeamSetup();
  });
  const [linkCopied, setLinkCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  useEffect(() => () => window.clearTimeout(copyTimeoutRef.current), []);
  const initialSession = useMemo(
    () => category
      ? createPictionarySession({
          categoryId: category.id,
          sessionId,
          teamCount: teamSetup?.teamCount ?? 2,
          teamNames: teamSetup?.teamNames ?? DEFAULT_TEAM_NAMES,
        })
      : null,
    [category, sessionId, teamSetup]
  );
  const { session, setSession, isConnected } = usePictionarySession({
    sessionId,
    categoryId,
    initialSession,
  });

  if (!category || !session) return <MissingPictionaryThing label={t('pictionary.missing.session')} />;

  return (
    <div className="pictionary-stage-screen">
      <div className="pictionary-stage" style={{ transform: `scale(${stageScale})` }}>
        <StageDecorations />

        <div className="pictionary-stage-controls">
          <Link className="pictionary-stage-button" to={`/pictionary/${category.id}`}>{t('pictionary.qr.setup')}</Link>
          <button
            type="button"
            className="pictionary-stage-button"
            onClick={async () => {
              await navigator.clipboard?.writeText(buildControlUrl(session, category.id));
              setLinkCopied(true);
              window.clearTimeout(copyTimeoutRef.current);
              copyTimeoutRef.current = window.setTimeout(() => setLinkCopied(false), 2000);
            }}
          >
            {linkCopied ? t('common.copied') : t('common.copyLink')}
          </button>
          <button
            type="button"
            className="pictionary-stage-button qr icon"
            onClick={() => setShowQr(true)}
            aria-label={t('pictionary.qr.showQr')}
            title={t('pictionary.qr.showQr')}
          >
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10-2h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-4 4h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z"
              />
            </svg>
          </button>
        </div>

        <span className={`pictionary-stage-sync ${isConnected ? 'connected' : ''}`}>
          {isConnected ? t('common.live') : t('common.local')}
        </span>

        <main className="pictionary-live-layout qr-layout">
          <ProjectorView session={session} category={category} setSession={setSession} />
        </main>

        {showQr && (
          <div className="pictionary-qr-overlay" role="dialog" aria-modal="true" aria-label={t('pictionary.qr.dialog')}>
            <QRJoinCard session={session} category={category} onClose={() => setShowQr(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export function PictionaryControl() {
  const { sessionId } = useParams();
  const location = useLocation();
  const { t } = useI18n();
  const categoryId = new URLSearchParams(location.search).get('category') || 'animals';
  const { category, isLoading } = usePictionaryCategory(categoryId);

  if (isLoading) return <PictionaryLoading />;
  if (!category) return <MissingPictionaryThing label={t('pictionary.missing.control')} />;
  return <PictionaryControlInner category={category} sessionId={sessionId} />;
}

function PictionaryControlInner({ category, sessionId }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const categoryId = category.id;
  const initialSession = useMemo(
    () => createPictionarySession({ categoryId, sessionId }),
    [categoryId, sessionId]
  );
  const { session, setSession, isConnected } = usePictionarySession({
    sessionId,
    categoryId,
    initialSession,
  });

  if (!session) return <MissingPictionaryThing label={t('pictionary.missing.control')} />;

  const prompt = getPromptById(session.promptOrder?.[session.roundIndex]);

  return (
    <div className="pictionary-control-page">
      <header className="pictionary-control-header">
        <button type="button" onClick={() => navigate('/pictionary')}>←</button>
        <div>
          <p>{getCategoryName(t, category)}</p>
          <h1>{t('pictionary.control.title')}</h1>
        </div>
        <span className={isConnected ? 'connected' : ''}>{isConnected ? t('common.live') : t('common.local')}</span>
      </header>
      {!prompt && <p className="pictionary-muted">{t('pictionary.control.waiting')}</p>}
      <TeacherControlView session={session} setSession={setSession} standalone />
    </div>
  );
}
