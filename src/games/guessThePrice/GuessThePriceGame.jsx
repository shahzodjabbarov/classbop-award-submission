import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../i18n/useI18n';

const ASSET_BASE = '/gtp_media';
const STAGE_WIDTH = 1920;
const STAGE_HEIGHT = 1080;

const teamColors = ['#004AAC', '#D60000', '#00a651', '#8C52FF'];
const cloudFiles = ['cloud_one.png', 'cloud_two.png', 'cloud_three.png'];

function makeClouds() {
  const totalClouds = 25;
  const animationSpeed = 160;
  const lanePositions = [-100, 100, 300, 600, 900];

  return Array.from({ length: totalClouds }).map((_, i) => ({
    id: i,
    img: cloudFiles[i % cloudFiles.length],
    top: `${lanePositions[i % lanePositions.length] + ((i * 17) % 50)}px`,
    duration: animationSpeed,
    delay: -(i * (animationSpeed / totalClouds)),
    scale: 0.8 + ((i * 13) % 80) / 100,
  }));
}

function fitStageScale() {
  return Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
}

function getPriceTagFontSize(value, isRevealed) {
  if (!isRevealed) return 128;

  const text = String(value || '');
  const weightedLength = [...text].reduce((total, char) => {
    if (/[0-9]/.test(char)) return total + 0.72;
    if (/[₩$¥€£₱₫]/.test(char)) return total + 0.82;
    if (char === ',' || char === '.') return total + 0.35;
    if (char === ' ') return total + 0.3;
    return total + 0.95;
  }, 0);

  if (weightedLength === 0) return 120;

  return Math.max(58, Math.min(120, Math.floor(390 / weightedLength)));
}

function Balloons() {
  const balloons = useMemo(() => {
    const colors = ['#FFEB00', '#D60000', '#004AAC', '#00a651', '#FF914D', '#5CE1E6'];

    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: `${80 + ((i * 91) % 1720)}px`,
      duration: `${6 + (i % 6)}s`,
      delay: `${(i % 5) * 0.55}s`,
    }));
  }, []);

  return (
    <div style={styles.balloons}>
      {balloons.map((balloon) => (
        <div
          key={balloon.id}
          style={{
            ...styles.balloon,
            left: balloon.left,
            backgroundColor: balloon.color,
            animation: `floatUp ${balloon.duration} linear ${balloon.delay} infinite`,
          }}
        >
          <div
            style={{
              ...styles.balloonKnot,
              borderBottomColor: balloon.color,
            }}
          />
          <div style={styles.balloonString} />
        </div>
      ))}
    </div>
  );
}

function SoundIcon({ muted = false }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" style={styles.controlIcon}>
      <path d="M8 19h8l11-10v30L16 29H8z" fill="currentColor" />
      {!muted && (
        <>
          <path d="M32 17c3 4 3 10 0 14" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M38 12c6 7 6 17 0 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {muted && <path d="M34 18l9 12M43 18L34 30" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />}
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" style={styles.pencilIcon}>
      <g transform="rotate(-38 24 24)">
        <path d="M19 7h10c2 0 4 2 4 4v22H15V11c0-2 2-4 4-4z" fill="#FFEB00" stroke="#111" strokeWidth="3" />
        <path d="M15 31h18l-9 12z" fill="#F2C28B" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
        <path d="M21 39h6l-3 4z" fill="#111" />
        <path d="M15 13h18" stroke="#111" strokeWidth="3" />
        <path d="M20 7h8v6h-8z" fill="#FF914D" />
      </g>
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" style={styles.controlIcon}>
      <path d="M9 20V9h11M39 20V9H28M9 28v11h11M39 28v11H28" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GuessThePriceGame({ items, onBack, settings }) {
  const { t } = useI18n();
  const activeItems = useMemo(() => {
    const length = settings?.length === 'ALL' ? items.length : Number(settings?.length || items.length);
    return items.slice(0, Math.min(length, items.length));
  }, [items, settings?.length]);

  const teamCount = settings?.teams || 2;
  const timerSeconds = Number(settings?.timerSeconds || 0);
  const timerEnabled = timerSeconds > 0;
  const initialTeamNames = settings?.teamNames || Array.from({ length: teamCount }, (_, i) => t('gtp.setup.teamName', { number: i + 1 }).toUpperCase());
  const [scale, setScale] = useState(() => fitStageScale());
  const [scores, setScores] = useState(() => Array(teamCount).fill(0));
  const [teamNames, setTeamNames] = useState(() => initialTeamNames);
  const [tempTeamNames, setTempTeamNames] = useState([]);
  const [isEditingTeams, setIsEditingTeams] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [scramblePrice, setScramblePrice] = useState('???');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [scorePops, setScorePops] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timerSeconds);
  const [isZoomed, setIsZoomed] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [sfxVolume, setSfxVolume] = useState(1);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [loadedProductImage, setLoadedProductImage] = useState('');

  const clouds = useMemo(() => makeClouds(), []);
  const bgMusicRef = useRef(null);
  const revealSoundRef = useRef(null);
  const transSoundRef = useRef(null);
  const plusSoundRef = useRef(null);
  const minusSoundRef = useRef(null);
  const winnerSoundRef = useRef(null);
  const scorePopIdRef = useRef(0);
  const revealedRef = useRef(revealed);
  const isTransitioningRef = useRef(false);
  const isGameOverRef = useRef(isGameOver);
  const currentIndexRef = useRef(currentIndex);

  const currentItem = activeItems[currentIndex];
  const maxScore = Math.max(...scores);
  const winners = teamNames.filter((_, i) => scores[i] === maxScore).join(' & ');
  const isTie = teamNames.filter((_, i) => scores[i] === maxScore).length > 1;

  useEffect(() => {
    const handleResize = () => setScale(fitStageScale());
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  useEffect(() => {
    isGameOverRef.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!timerEnabled || revealed || isGameOver || remainingTime <= 0) return undefined;

    const timer = setTimeout(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [timerEnabled, revealed, isGameOver, remainingTime]);

  useEffect(() => {
    if (!bgMusicRef.current) return;

    bgMusicRef.current.volume = musicVolume;

    if (musicVolume > 0 && bgMusicRef.current.paused) {
      bgMusicRef.current.play().catch(() => {});
    }

    if (musicVolume === 0) {
      bgMusicRef.current.pause();
    }
  }, [musicVolume]);

  const playSfx = useCallback((ref) => {
    if (!ref.current || sfxVolume <= 0) return;
    ref.current.volume = sfxVolume;
    ref.current.currentTime = 0;
    ref.current.play().catch(() => {});
  }, [sfxVolume]);

  useEffect(() => {
    if (isGameOver) playSfx(winnerSoundRef);
  }, [isGameOver, playSfx]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const revealAnswer = useCallback(() => {
    if (!revealedRef.current) playSfx(revealSoundRef);
    setRevealed(true);
  }, [playSfx]);

  const showNextItem = useCallback(() => {
    if (currentIndexRef.current >= activeItems.length - 1) {
      setIsGameOver(true);
      return;
    }

    setSlideDirection(1);
    setRevealed(false);
    setRemainingTime(timerSeconds);
    setCurrentIndex((prev) => prev + 1);
  }, [activeItems.length, timerSeconds]);

  const showPreviousItem = useCallback(() => {
    if (currentIndexRef.current === 0) return;

    setSlideDirection(-1);
    setRevealed(false);
    setRemainingTime(timerSeconds);
    setCurrentIndex((prev) => prev - 1);
  }, [timerSeconds]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || isGameOverRef.current) return;

      if (e.code === 'Space') {
        e.preventDefault();
        revealAnswer();
      }

      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 500);

        playSfx(transSoundRef);

        if (e.code === 'ArrowRight') showNextItem();
        if (e.code === 'ArrowLeft') showPreviousItem();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSfx, revealAnswer, showNextItem, showPreviousItem]);

  useEffect(() => {
    if (!currentItem) return;

    if (!revealed) return;

    let ticks = 0;
    const interval = setInterval(() => {
      setScramblePrice(`${(Math.random() * 90 + 10).toFixed(1)}k`);
      ticks += 1;

      if (ticks > 10) {
        clearInterval(interval);
        setScramblePrice(currentItem.priceLabel);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [revealed, currentItem]);

  const handleScore = (index, delta, event) => {
    event.currentTarget.blur();
    playSfx(delta > 0 ? plusSoundRef : minusSoundRef);

    scorePopIdRef.current += 1;
    const pop = { id: scorePopIdRef.current, index, delta };
    setScorePops((prev) => [...prev, pop]);
    setTimeout(() => {
      setScorePops((prev) => prev.filter((item) => item.id !== pop.id));
    }, 1000);

    setScores((prev) => {
      const next = [...prev];
      next[index] = Math.max(0, next[index] + delta);
      return next;
    });
  };

  const openEditModal = () => {
    setTempTeamNames([...teamNames]);
    setIsEditingTeams(true);
  };

  const saveTeamNames = () => {
    setTeamNames([...tempTeamNames]);
    setIsEditingTeams(false);
  };

  const restartGame = () => {
    setScores(Array(teamCount).fill(0));
    setCurrentIndex(0);
    setRevealed(false);
    setIsGameOver(false);
    setRemainingTime(timerSeconds);
  };

  if (!currentItem) {
    return (
      <div style={styles.emptyScreen}>
        <h1 style={styles.emptyTitle}>{t('gtp.game.noItems')}</h1>
        <button onClick={onBack} style={styles.emptyButton}>{t('gtp.game.goBack')}</button>
      </div>
    );
  }

  const priceTagText = revealed ? scramblePrice : '???';
  const priceTagFontSize = getPriceTagFontSize(priceTagText, revealed);
  const productImageLoaded = loadedProductImage === currentItem.image;

  return (
    <div style={styles.screen}>
      <style>
        {`
          @keyframes floatUp {
            0% { transform: translateY(1100px) translateX(0) rotate(-5deg); opacity: 1; }
            50% { transform: translateY(500px) translateX(20px) rotate(5deg); }
            100% { transform: translateY(-300px) translateX(-20px) rotate(-5deg); opacity: 1; }
          }

          @keyframes cloudDrift {
            0% { transform: translateX(-520px) scale(var(--cloud-scale)); }
            100% { transform: translateX(2400px) scale(var(--cloud-scale)); }
          }

          @keyframes finaleSpin {
            0% { transform: rotate(0deg) scale(1); }
            100% { transform: rotate(360deg) scale(1.1); }
          }

          @keyframes timerPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }

          @keyframes gtpImageShimmer {
            0% { background-position: 120% 0; }
            100% { background-position: -120% 0; }
          }
        `}
      </style>

      <audio ref={bgMusicRef} src={`${ASSET_BASE}/back_music.mp3`} loop />
      <audio ref={revealSoundRef} src={`${ASSET_BASE}/reveal.mp3`} />
      <audio ref={transSoundRef} src={`${ASSET_BASE}/trans.mp3`} />
      <audio ref={plusSoundRef} src={`${ASSET_BASE}/plus.mp3`} />
      <audio ref={minusSoundRef} src={`${ASSET_BASE}/minus.mp3`} />
      <audio ref={winnerSoundRef} src={`${ASSET_BASE}/winner.mp3`} />

      <div
        style={{
          ...styles.stage,
          transform: `scale(${scale})`,
        }}
      >
        <img src={`${ASSET_BASE}/guess_tp_bg.jpg`} style={styles.background} alt="" />
        <div style={styles.cloudLayer}>
          {clouds.map((cloud) => (
            <img
              key={cloud.id}
              src={`${ASSET_BASE}/${cloud.img}`}
              style={{
                ...styles.cloud,
                top: cloud.top,
                '--cloud-scale': cloud.scale,
                animationDelay: `${cloud.delay}s`,
                animationDuration: `${cloud.duration}s`,
              }}
              alt=""
            />
          ))}
        </div>

        <div style={styles.topLeftControls}>
          <button onClick={onBack} style={styles.exitButton}>
            <span style={styles.exitArrow}>{'<'}</span> {t('gtp.game.exit')}
          </button>
          <button onClick={toggleFullScreen} style={styles.fullScreenButton} aria-label={t('gtp.game.toggleFullscreen')}>
            <MaximizeIcon />
          </button>
        </div>

        <div
          onMouseEnter={() => setShowVolumeMenu(true)}
          onMouseLeave={() => setShowVolumeMenu(false)}
          style={styles.volumeWrap}
        >
          <button
            style={{ ...styles.volumeButton, backgroundColor: musicVolume === 0 && sfxVolume === 0 ? '#B30000' : '#00a651' }}
            aria-label={t('gtp.game.soundSettings')}
          >
            <SoundIcon muted={musicVolume === 0 && sfxVolume === 0} />
          </button>

          <AnimatePresence>
            {showVolumeMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={styles.volumeMenu}
              >
                <label style={styles.volumeLabel}>
                  <span style={styles.volumeLabelText}>{t('gtp.game.music')}</span>
                  <span style={styles.volumePercent}>{Math.round(musicVolume * 100)}%</span>
                  <input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(e) => setMusicVolume(Number(e.target.value))} style={styles.rangeInput} />
                </label>
                <label style={styles.volumeLabel}>
                  <span style={styles.volumeLabelText}>{t('gtp.game.sfx')}</span>
                  <span style={styles.volumePercent}>{Math.round(sfxVolume * 100)}%</span>
                  <input type="range" min="0" max="1" step="0.05" value={sfxVolume} onChange={(e) => setSfxVolume(Number(e.target.value))} style={styles.rangeInput} />
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={openEditModal} style={styles.editButton} aria-label={t('gtp.game.editTeams')}>
          <PencilIcon />
        </button>

        {timerEnabled && (
          <div
            style={{
              ...styles.timerBadge,
              ...(remainingTime <= 10 && !revealed ? styles.timerDanger : null),
            }}
          >
            <span style={styles.timerLabel}>{remainingTime === 0 && !revealed ? t('gtp.game.timesUp') : t('gtp.game.timer')}</span>
            <span style={styles.timerValue}>{remainingTime}s</span>
          </div>
        )}

        <div style={styles.scoreboards}>
          {scores.map((score, index) => (
            <div key={index} style={{ ...styles.scoreboard, backgroundColor: teamColors[index] }}>
              <AnimatePresence>
                {scorePops.filter((pop) => pop.index === index).map((pop) => (
                  <motion.div
                    key={pop.id}
                    initial={{ opacity: 1, y: 0, scale: 0.5 }}
                    animate={{ opacity: 0, y: -80, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      ...styles.scorePop,
                      left: pop.delta > 0 ? '75%' : '15%',
                      color: pop.delta > 0 ? '#00FF00' : '#FF0000',
                    }}
                  >
                    {pop.delta > 0 ? '+1' : '-1'}
                  </motion.div>
                ))}
              </AnimatePresence>
              <button onClick={(event) => handleScore(index, -1, event)} style={styles.scoreButton}>-</button>
              <div style={styles.scoreCenter}>
                <span style={styles.teamName}>{teamNames[index]}</span>
                <span style={styles.scoreValue}>
                  <motion.span
                    key={score}
                    initial={{ scale: 1.3, color: '#FFEB00' }}
                    animate={{ scale: 1, color: '#FFFFFF' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    style={styles.scoreNumber}
                  >
                    {score}
                  </motion.span>
                </span>
              </div>
              <button onClick={(event) => handleScore(index, 1, event)} style={styles.scoreButton}>+</button>
            </div>
          ))}
        </div>

        <div style={styles.gameArea}>
          <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={slideDirection}
              variants={swipeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              style={styles.slide}
            >
              <div style={styles.leftInfo}>
                <h2 style={styles.itemName}>"{currentItem.title}"</h2>
                <div style={styles.rangeWrap}>
                  <div style={styles.rangeBox}>
                    <span style={styles.rangeText}>{currentItem.range || '?'}</span>
                  </div>
                </div>
              </div>

              <div style={styles.productCard}>
                <div onClick={() => setIsZoomed(true)} style={styles.productImageWrap}>
                  {!productImageLoaded && <div style={styles.productImageSkeleton} />}
                  <img
                    src={currentItem.image}
                    style={{
                      ...styles.productImage,
                      opacity: productImageLoaded ? 1 : 0,
                    }}
                    alt={currentItem.title}
                    onLoad={() => setLoadedProductImage(currentItem.image)}
                    onError={() => setLoadedProductImage(currentItem.image)}
                  />
                </div>
                <div style={styles.productBody}>
                  <div>
                    <p style={styles.description}>{currentItem.desc || t('gtp.game.defaultDesc')}</p>
                    <AnimatePresence>
                      {revealed && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          style={styles.exactPrice}
                        >
                          {currentItem.exactPrice}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div style={styles.itemMetaRow}>
                    <span style={styles.metaPill}>{t('gtp.game.question', { current: currentIndex + 1, total: activeItems.length })}</span>
                    <span style={styles.metaPill}>{currentItem.currency}</span>
                  </div>
                </div>
              </div>

              <div style={styles.rightPrice}>
                <h2 style={styles.howMuch}>
                  {t('gtp.game.howMuch').split('\n').map((line, index, lines) => (
                    <Fragment key={line}>
                      {line}
                      {index < lines.length - 1 && <br />}
                    </Fragment>
                  ))}
                </h2>
                <div style={styles.priceSignWrap}>
                  <div style={styles.priceSign}>
                    <svg style={styles.signRopes} width="480" height="140" viewBox="0 0 420 130">
                      <line x1="210" y1="20" x2="41" y2="105" stroke="#f0f0f0" strokeWidth="6" />
                      <line x1="210" y1="20" x2="379" y2="105" stroke="#f0f0f0" strokeWidth="6" />
                      <circle cx="210" cy="20" r="16" fill="#D60000" stroke="#111" strokeWidth="3" />
                    </svg>
                    <div style={styles.signHoleLeft} />
                    <div style={styles.signHoleRight} />
                    <div
                      style={{
                        ...styles.priceTextWrap,
                        top: revealed ? '48px' : '34px',
                        bottom: revealed ? '20px' : '8px',
                        overflow: revealed ? 'hidden' : 'visible',
                        zIndex: revealed ? 12 : 20,
                      }}
                    >
                      <span style={{ ...styles.priceText, fontSize: `${priceTagFontSize}px` }}>
                        {priceTagText}
                      </span>
                    </div>
                  </div>
                  {!revealed && (
                    <button onClick={revealAnswer} style={styles.revealButton}>
                      {t('gtp.game.reveal')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div style={styles.footer}>{t('gtp.game.itemProgress', { current: currentIndex + 1, total: activeItems.length })}</div>

        <AnimatePresence>
          {isEditingTeams && (
            <div style={styles.modalRoot}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsEditingTeams(false)}
                style={styles.modalBackdrop}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                style={styles.teamModal}
              >
                <h2 style={styles.modalTitle}>{t('gtp.game.editTeamNames')}</h2>
                <div style={styles.teamEditList}>
                  {tempTeamNames.map((name, i) => (
                    <div key={i} style={styles.teamEditRow}>
                      <div style={{ ...styles.teamDot, backgroundColor: teamColors[i] }} />
                      <input
                        value={name}
                        onChange={(event) => {
                          const next = [...tempTeamNames];
                          next[i] = event.target.value.toUpperCase();
                          setTempTeamNames(next);
                        }}
                        maxLength={10}
                        style={styles.teamEditInput}
                      />
                    </div>
                  ))}
                </div>
                <div style={styles.modalButtons}>
                  <button onClick={() => setIsEditingTeams(false)} style={styles.cancelButton}>{t('gtp.game.cancel')}</button>
                  <button onClick={saveTeamNames} style={styles.saveButton}>{t('gtp.game.save')}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isZoomed && (
            <>
              <div onClick={() => setIsZoomed(false)} style={styles.zoomBackdrop} />
              <motion.img
                src={currentItem.image}
                initial={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
                animate={{ scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
                exit={{ scale: 0.5, opacity: 0, x: '-50%', y: '-50%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={styles.zoomImage}
                onClick={() => setIsZoomed(false)}
                alt={currentItem.title}
              />
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isGameOver && (
            <div style={styles.gameOverRoot}>
              <Balloons />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.gameOverBackdrop} />
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.5, scale: 1.45 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={styles.finaleSpotlight}
              />
              <motion.div
                initial={{ scale: 0.82, opacity: 0, y: 60 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0.35 }}
                style={styles.gameOverPanel}
              >
                <h2 style={styles.gameOverSmall}>{t('gtp.game.finalScores')}</h2>

                <div style={{ ...styles.finalScoresGrid, gridTemplateColumns: `repeat(${scores.length}, minmax(0, 1fr))` }}>
                  {scores.map((score, index) => (
                    <div
                      key={`${teamNames[index]}-${index}`}
                      style={{
                        ...styles.finalScoreCard,
                        borderColor: teamColors[index],
                        boxShadow: `0 8px 0 rgba(0,0,0,0.38), 0 0 ${score === maxScore ? 30 : 0}px ${teamColors[index]}`,
                      }}
                    >
                      <span style={{ ...styles.finalScoreName, color: teamColors[index] }}>{teamNames[index]}</span>
                      <span style={styles.finalScoreNumber}>{score}</span>
                    </div>
                  ))}
                </div>

                <motion.h1
                  initial={{ scale: 0.2, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', bounce: 0.65, duration: 0.8 }}
                  style={styles.gameOverTitle}
                >
                  {isTie ? t('gtp.game.winners') : t('gtp.game.winner')}
                  <br />
                  <span style={styles.winnerNames}>{winners}</span>
                </motion.h1>

                <div style={styles.gameOverButtons}>
                  <button onClick={restartGame} style={styles.playAgainButton}>{t('gtp.game.playAgain')}</button>
                  <button onClick={onBack} style={styles.arcadeButton}>{t('gtp.game.backToMenu')}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const swipeVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '1920px' : '-1920px',
    opacity: 0,
    rotate: direction > 0 ? 10 : -10,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    rotate: 0,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? '1920px' : '-1920px',
    opacity: 0,
    rotate: direction < 0 ? 10 : -10,
  }),
};

const fontScoreboard = '"Lilita One", cursive';
const fontTitles = '"Alfa Slab One", serif';
const fontPrices = '"League Spartan", sans-serif';
const fontRange = '"Montserrat", sans-serif';
const textStrokeWhite3D = '3px 3px 0 #FFF, -3px -3px 0 #FFF, 3px -3px 0 #FFF, -3px 3px 0 #FFF, 6px 6px 0px rgba(0,0,0,0.4)';
const textStrokeYellow3D = '3px 3px 0 #FFEB00, -3px -3px 0 #FFEB00, 3px -3px 0 #FFEB00, -3px 3px 0 #FFEB00, 6px 6px 0px rgba(0,0,0,0.4)';

const styles = {
  screen: {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #7DD8FB 0%, #B8ECFF 58%, #FFF2BF 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5000,
  },
  stage: {
    width: `${STAGE_WIDTH}px`,
    height: `${STAGE_HEIGHT}px`,
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
    fontFamily: 'sans-serif',
    transformOrigin: 'center center',
    overflow: 'hidden',
    backgroundColor: '#87CEEB',
    boxShadow: '0 0 50px rgba(0,0,0,0.5)',
  },
  background: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
  },
  cloudLayer: {
    position: 'absolute',
    inset: 0,
    zIndex: 3,
    pointerEvents: 'none',
  },
  cloud: {
    position: 'absolute',
    width: '450px',
    opacity: 0.7,
    left: 0,
    animationName: 'cloudDrift',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
    willChange: 'transform',
  },
  topLeftControls: {
    position: 'absolute',
    top: '40px',
    left: '40px',
    zIndex: 100,
    display: 'flex',
    gap: '20px',
  },
  exitButton: {
    cursor: 'pointer',
    backgroundColor: 'white',
    padding: '15px 30px',
    borderRadius: '20px',
    border: '4px solid #111',
    color: '#111',
    fontWeight: 'bold',
    fontFamily: fontScoreboard,
    fontSize: '24px',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  exitArrow: {
    fontSize: '28px',
    lineHeight: 1,
  },
  fullScreenButton: {
    cursor: 'pointer',
    backgroundColor: '#333',
    width: '74px',
    height: '74px',
    borderRadius: '20px',
    border: '4px solid #fff',
    color: 'white',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeWrap: {
    position: 'absolute',
    top: '40px',
    right: '40px',
    zIndex: 2000,
  },
  volumeButton: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '5px solid white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 6px 0px rgba(0,0,0,0.3)',
    transition: 'background-color 0.3s',
  },
  volumeIcon: {
    color: 'white',
    fontFamily: fontScoreboard,
    fontSize: '20px',
    textShadow: '2px 2px 0 #111',
  },
  controlIcon: {
    width: '38px',
    height: '38px',
    color: 'white',
    filter: 'drop-shadow(2px 2px 0 #111)',
    display: 'block',
  },
  pencilIcon: {
    width: '44px',
    height: '44px',
    display: 'block',
    filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.35))',
  },
  volumeMenu: {
    position: 'absolute',
    top: '90px',
    right: 0,
    width: '220px',
    backgroundColor: 'white',
    borderRadius: '15px',
    border: '3px solid #111',
    padding: '15px',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  volumeLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '7px',
    color: '#111',
    fontFamily: fontScoreboard,
  },
  volumeLabelText: {
    backgroundColor: '#111',
    color: '#FFEB00',
    borderRadius: '999px',
    padding: '4px 9px',
    fontSize: '13px',
    letterSpacing: '1px',
    lineHeight: 1,
  },
  volumePercent: {
    color: '#111',
    fontSize: '15px',
    lineHeight: 1,
  },
  rangeInput: {
    width: '100%',
    cursor: 'pointer',
  },
  editButton: {
    position: 'absolute',
    top: '140px',
    right: '40px',
    zIndex: 100,
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#FF914D',
    border: '5px solid white',
    color: 'white',
    cursor: 'pointer',
    boxShadow: '0 6px 0px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBadge: {
    position: 'absolute',
    right: '40px',
    bottom: '34px',
    zIndex: 120,
    minWidth: '190px',
    border: '5px solid #111',
    borderRadius: '22px',
    backgroundColor: '#fff',
    color: '#111',
    boxShadow: '0 8px 0 rgba(0,0,0,0.32)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    padding: '12px 22px',
  },
  timerDanger: {
    backgroundColor: '#D60000',
    borderColor: '#111',
    color: '#fff',
    animation: 'timerPulse 0.75s ease-in-out infinite',
  },
  timerLabel: {
    fontFamily: fontScoreboard,
    fontSize: '21px',
    lineHeight: 1,
    color: 'currentColor',
    letterSpacing: '1px',
    textShadow: 'none',
  },
  timerValue: {
    fontFamily: fontScoreboard,
    fontSize: '34px',
    lineHeight: 1,
    color: 'currentColor',
    textShadow: 'none',
  },
  scoreboards: {
    position: 'absolute',
    top: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
    zIndex: 100,
  },
  scoreboard: {
    border: '5px solid white',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    gap: '20px',
    boxShadow: '0 8px 0px rgba(0,0,0,0.3)',
    position: 'relative',
  },
  scoreButton: {
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.2)',
    border: '2px solid rgba(255,255,255,0.5)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '30px',
    width: '40px',
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 0px rgba(0,0,0,0.2)',
    lineHeight: 0,
    position: 'relative',
  },
  scorePop: {
    position: 'absolute',
    top: '-30px',
    fontFamily: fontScoreboard,
    fontSize: '40px',
    textShadow: '2px 2px 0 #000',
    pointerEvents: 'none',
    zIndex: 200,
  },
  scoreCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '120px',
    color: 'white',
  },
  teamName: {
    fontSize: '18px',
    fontWeight: 'bold',
    fontFamily: 'sans-serif',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontFamily: fontScoreboard,
    fontSize: '60px',
    lineHeight: 1,
    textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
  },
  scoreNumber: {
    display: 'inline-block',
  },
  gameArea: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: 10,
  },
  slide: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftInfo: {
    position: 'absolute',
    left: '80px',
    top: '56%',
    transform: 'translateY(-50%)',
    width: '600px',
    textAlign: 'center',
  },
  itemName: {
    fontFamily: fontTitles,
    fontSize: '80px',
    fontWeight: 400,
    lineHeight: 1.1,
    marginBottom: '140px',
    textShadow: textStrokeWhite3D,
    color: '#111',
    transform: 'translateY(-60px)',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    maxWidth: '100%',
  },
  rangeWrap: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transform: 'translateX(15px)',
  },
  rangeBox: {
    backgroundColor: '#FFEB00',
    border: '5px solid #111',
    borderRadius: '20px',
    padding: '15px 40px',
    display: 'inline-block',
    boxShadow: '10px 10px 0px rgba(0,0,0,0.6)',
    minWidth: '280px',
  },
  rangeText: {
    display: 'inline-block',
    fontFamily: fontRange,
    fontSize: '70px',
    color: '#D60000',
    textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
  },
  productCard: {
    position: 'absolute',
    left: '50%',
    top: '56%',
    transform: 'translate(-50%, -50%)',
    width: '550px',
    height: '750px',
    backgroundColor: 'white',
    border: '5px solid black',
    borderRadius: '35px',
    boxShadow: '10px 10px 0px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    boxSizing: 'border-box',
  },
  productImageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '3px solid #111',
    borderRadius: '20px',
    backgroundColor: '#fff',
    flexShrink: 0,
    boxSizing: 'border-box',
    overflow: 'hidden',
    cursor: 'zoom-in',
  },
  productImageSkeleton: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    background: 'linear-gradient(100deg, #E2E8F0 0%, #F8FAFC 38%, #CBD5E1 76%)',
    backgroundSize: '220% 100%',
    animation: 'gtpImageShimmer 1.35s ease-in-out infinite',
  },
  productImage: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.22s ease',
  },
  productBody: {
    flex: 1,
    paddingTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    textAlign: 'left',
    paddingLeft: '5px',
    paddingRight: '5px',
  },
  description: {
    fontSize: '20px',
    color: '#333',
    fontWeight: 'bold',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'sans-serif',
    lineHeight: 1.4,
  },
  exactPrice: {
    color: '#D60000',
    fontSize: '26px',
    fontWeight: 900,
    fontFamily: 'sans-serif',
    marginTop: '10px',
  },
  itemMetaRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    paddingBottom: '5px',
  },
  metaPill: {
    border: '2px solid #111',
    borderRadius: '999px',
    backgroundColor: '#F5F7FB',
    color: '#111',
    fontFamily: fontScoreboard,
    fontSize: '16px',
    letterSpacing: '1px',
    lineHeight: 1,
    padding: '8px 12px',
    boxShadow: '2px 2px 0 rgba(0,0,0,0.18)',
  },
  rightPrice: {
    position: 'absolute',
    right: '125px',
    top: '56%',
    transform: 'translateY(-50%)',
    width: '500px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  howMuch: {
    fontFamily: fontTitles,
    fontSize: '85px',
    fontWeight: 400,
    color: '#D60000',
    marginBottom: '10px',
    textShadow: textStrokeYellow3D,
    textAlign: 'center',
    transform: 'translateY(-60px) translateX(-35px)',
  },
  priceSignWrap: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    transform: 'translateY(0px)',
  },
  priceSign: {
    position: 'relative',
    backgroundColor: '#D60000',
    width: '480px',
    height: '180px',
    marginTop: '80px',
    borderRadius: '25px',
    border: '5px solid #111',
    borderBottom: '30px solid #1a1a1a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '10px 10px 0px rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  revealButton: {
    position: 'absolute',
    top: '292px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 30,
    border: '5px solid #111',
    borderRadius: '18px',
    backgroundColor: '#FFEB00',
    color: '#111',
    fontFamily: fontScoreboard,
    fontSize: '34px',
    lineHeight: 1,
    padding: '14px 38px',
    cursor: 'pointer',
    boxShadow: '6px 6px 0 rgba(0,0,0,0.36)',
  },
  signRopes: {
    position: 'absolute',
    top: '-90px',
    left: 0,
    zIndex: 11,
  },
  signHoleLeft: {
    position: 'absolute',
    top: '15px',
    left: '35px',
    width: '25px',
    height: '25px',
    backgroundColor: '#87CEEB',
    borderRadius: '50%',
    border: '5px solid #e0e0e0',
    boxShadow: 'inset 0 4px 4px rgba(0,0,0,0.5)',
    zIndex: 12,
  },
  signHoleRight: {
    position: 'absolute',
    top: '15px',
    right: '35px',
    width: '25px',
    height: '25px',
    backgroundColor: '#87CEEB',
    borderRadius: '50%',
    border: '5px solid #e0e0e0',
    boxShadow: 'inset 0 4px 4px rgba(0,0,0,0.5)',
    zIndex: 12,
  },
  priceTextWrap: {
    position: 'absolute',
    top: '48px',
    left: 0,
    right: 0,
    bottom: '20px',
    zIndex: 12,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 34px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  priceText: {
    fontFamily: fontPrices,
    color: '#FFEB00',
    fontWeight: 900,
    lineHeight: 1,
    display: 'block',
    maxWidth: '100%',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    textShadow: '6px 6px 0px rgba(0,0,0,0.5)',
  },
  footer: {
    position: 'absolute',
    bottom: '30px',
    width: '100%',
    textAlign: 'center',
    color: 'white',
    fontFamily: fontScoreboard,
    fontSize: '30px',
    textShadow: '2px 2px 0px #111',
    letterSpacing: '2px',
    zIndex: 20,
  },
  modalRoot: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(5px)',
  },
  teamModal: {
    backgroundColor: 'white',
    border: '5px solid #111',
    borderRadius: '30px',
    width: '450px',
    padding: '35px',
    position: 'relative',
    zIndex: 2001,
    boxShadow: '12px 12px 0px rgba(0,0,0,0.5)',
  },
  modalTitle: {
    fontFamily: fontScoreboard,
    fontSize: '35px',
    color: '#111',
    margin: '0 0 25px 0',
    textAlign: 'center',
    letterSpacing: '1px',
  },
  teamEditList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px',
  },
  teamEditRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  teamDot: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid #111',
    flexShrink: 0,
  },
  teamEditInput: {
    flex: 1,
    height: '50px',
    padding: '0 15px',
    fontSize: '20px',
    fontFamily: fontScoreboard,
    border: '3px solid #111',
    borderRadius: '15px',
    outline: 'none',
    textTransform: 'uppercase',
  },
  modalButtons: {
    display: 'flex',
    gap: '15px',
  },
  cancelButton: {
    flex: 1,
    padding: '15px',
    borderRadius: '15px',
    border: '3px solid #111',
    backgroundColor: '#eee',
    color: '#555',
    fontFamily: fontScoreboard,
    fontSize: '20px',
    cursor: 'pointer',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.2)',
  },
  saveButton: {
    flex: 1,
    padding: '15px',
    borderRadius: '15px',
    border: '3px solid #111',
    backgroundColor: '#00a651',
    color: 'white',
    fontFamily: fontScoreboard,
    fontSize: '20px',
    cursor: 'pointer',
    boxShadow: '4px 4px 0px rgba(0,0,0,0.3)',
  },
  zoomBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 2999,
  },
  zoomImage: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    height: '80vh',
    width: '80vh',
    objectFit: 'cover',
    zIndex: 3000,
    borderRadius: '30px',
    boxShadow: '0 20px 80px rgba(0,0,0,0.8)',
    border: '10px solid white',
    cursor: 'zoom-out',
  },
  gameOverRoot: {
    position: 'fixed',
    inset: 0,
    zIndex: 3000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balloons: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 1500,
  },
  balloon: {
    position: 'absolute',
    bottom: '-150px',
    width: '60px',
    height: '80px',
    borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
    boxShadow: 'inset -5px -5px 0 rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.3)',
  },
  balloonKnot: {
    position: 'absolute',
    bottom: '-8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderBottom: '10px solid',
  },
  balloonString: {
    position: 'absolute',
    bottom: '-40px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '2px',
    height: '40px',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  gameOverBackdrop: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at center, rgba(16,24,39,0.78), rgba(0,0,0,0.94) 68%)',
    backdropFilter: 'blur(9px)',
  },
  finaleSpotlight: {
    position: 'absolute',
    width: '900px',
    height: '900px',
    borderRadius: '50%',
    background: 'conic-gradient(from 0deg, rgba(255,235,0,0.75), rgba(255,145,77,0.2), rgba(0,166,81,0.55), rgba(0,74,172,0.35), rgba(255,235,0,0.75))',
    filter: 'blur(14px)',
    animation: 'finaleSpin 5s linear infinite',
    zIndex: 3000,
  },
  gameOverPanel: {
    position: 'relative',
    zIndex: 3001,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '1180px',
    minHeight: '610px',
    border: '7px solid #fff',
    borderRadius: '44px',
    background: 'linear-gradient(180deg, rgba(17,24,39,0.94), rgba(7,10,18,0.94))',
    boxShadow: '0 24px 0 rgba(0,0,0,0.45), 0 0 70px rgba(255,235,0,0.42)',
    padding: '52px 60px 44px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  gameOverSmall: {
    fontFamily: fontScoreboard,
    fontSize: '52px',
    color: 'white',
    margin: '0 0 30px 0',
    letterSpacing: '3px',
    textShadow: '4px 4px 0px #000',
    textAlign: 'center',
  },
  finalScoresGrid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '18px',
    marginBottom: '34px',
  },
  finalScoreCard: {
    minHeight: '152px',
    border: '5px solid',
    borderRadius: '24px',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    padding: '18px 14px',
    boxSizing: 'border-box',
  },
  finalScoreName: {
    fontFamily: fontScoreboard,
    fontSize: '25px',
    lineHeight: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    overflowWrap: 'anywhere',
  },
  finalScoreNumber: {
    fontFamily: fontScoreboard,
    fontSize: '76px',
    lineHeight: 0.86,
    color: '#111',
    textShadow: '4px 4px 0 rgba(0,0,0,0.18)',
  },
  gameOverTitle: {
    fontFamily: fontScoreboard,
    fontSize: '108px',
    color: '#FFEB00',
    textShadow: '6px 6px 0 #D60000, -3px -3px 0 #D60000, 3px -3px 0 #D60000, -3px 3px 0 #D60000, 12px 12px 0px rgba(0,0,0,0.5)',
    margin: '8px 0 42px 0',
    textAlign: 'center',
    lineHeight: 0.95,
    letterSpacing: '2px',
  },
  winnerNames: {
    display: 'inline-block',
    fontSize: '118px',
    color: '#fff',
    textShadow: '6px 6px 0 #004AAC, -3px -3px 0 #004AAC, 3px -3px 0 #004AAC, -3px 3px 0 #004AAC, 12px 12px 0 rgba(0,0,0,0.5)',
    marginTop: '16px',
    maxWidth: '1050px',
    overflowWrap: 'anywhere',
  },
  gameOverButtons: {
    display: 'flex',
    gap: '20px',
  },
  playAgainButton: {
    padding: '20px 40px',
    borderRadius: '20px',
    border: '4px solid #111',
    backgroundColor: '#00a651',
    color: 'white',
    fontFamily: fontScoreboard,
    fontSize: '28px',
    cursor: 'pointer',
    boxShadow: '6px 6px 0px rgba(0,0,0,0.4)',
    textTransform: 'uppercase',
  },
  arcadeButton: {
    padding: '20px 40px',
    borderRadius: '20px',
    border: '4px solid #111',
    backgroundColor: '#FF914D',
    color: 'white',
    fontFamily: fontScoreboard,
    fontSize: '28px',
    cursor: 'pointer',
    boxShadow: '6px 6px 0px rgba(0,0,0,0.4)',
    textTransform: 'uppercase',
  },
  emptyScreen: {
    position: 'fixed',
    inset: 0,
    backgroundColor: '#222',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'sans-serif',
    zIndex: 5000,
  },
  emptyTitle: {
    fontFamily: fontScoreboard,
    fontSize: '54px',
  },
  emptyButton: {
    marginTop: '20px',
    padding: '10px 20px',
    fontSize: '20px',
    cursor: 'pointer',
  },
};
