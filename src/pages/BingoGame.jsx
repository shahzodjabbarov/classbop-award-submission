import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MenuBackdrop from '../components/MenuBackdrop';
import BingoItemContent from '../games/bingo/BingoItemContent';
import {
  CUSTOM_BINGO_GAME_ID,
  GRID_SIZES,
  MAX_CARD_COUNT,
  generateBingoCards,
  getBingoGame,
  getBingoItemImage,
  getBingoItemKey,
  pickRandomItem,
} from '../games/bingo/bingoGames';
import { downloadBingoPdf } from '../games/bingo/bingoPdf';
import {
  MachineSelector,
  PickerMachineStage,
} from '../games/bingo/BingoPickerMachines';
import { PICKER_MACHINES } from '../games/bingo/pickerMachines';
import { playMachineRevealSound, playMachineSpinSound } from '../games/bingo/pickerSounds';
import { useI18n } from '../i18n/useI18n';
import './Bingo.css';

const PRINT_LAYOUTS = [
  { value: 1, key: 'one' },
  { value: 2, key: 'two' },
  { value: 3, key: 'three' },
  { value: 4, key: 'four' },
];

function CardPreview({ cells, gridSize }) {
  const { t } = useI18n();

  return (
    <div className="bingo-card-preview">
      <div className="bingo-preview-topline">
        <span>BINGO</span>
        <small>{gridSize} × {gridSize}</small>
      </div>
      <div className="bingo-preview-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {cells.map((cell, index) => (
          <span key={`${getBingoItemKey(cell)}-${index}`}>
            <BingoItemContent item={cell} />
          </span>
        ))}
      </div>
      <div className="bingo-preview-name">{t('bingo.preview.name')}</div>
    </div>
  );
}

function Picker({ game, machineId, onMachineChange, onBack }) {
  const { t } = useI18n();
  const [calledItems, setCalledItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [pendingItem, setPendingItem] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinNonce, setSpinNonce] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const timerRef = useRef(null);
  const calledSet = useMemo(() => new Set(calledItems), [calledItems]);
  const remainingItems = game.items.filter((item) => !calledSet.has(item));
  const activeMachine = PICKER_MACHINES.find((machine) => machine.id === machineId) || PICKER_MACHINES[0];
  const machineName = t(`bingo.machines.${activeMachine.id}.name`);
  const machineBusy = t(`bingo.machines.${activeMachine.id}.busy`);
  const machineAction = t(`bingo.machines.${activeMachine.id}.action`);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!isMaximized) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsMaximized(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMaximized]);

  const spin = () => {
    if (isSpinning || remainingItems.length === 0) return;

    const selected = pickRandomItem(remainingItems);
    setCurrentItem(null);
    setPendingItem(selected);
    setIsSpinning(true);
    setSpinNonce((value) => value + 1);
    if (soundEnabled) playMachineSpinSound(machineId, activeMachine.duration);

    if (machineId === 'wheel') {
      const selectedIndex = remainingItems.indexOf(selected);
      const sliceAngle = 360 / remainingItems.length;
      const targetRotation = (360 - (selectedIndex + 0.5) * sliceAngle) % 360;
      setRotation((value) => {
        const normalizedRotation = ((value % 360) + 360) % 360;
        const landingDistance = (targetRotation - normalizedRotation + 360) % 360;
        return value + 1440 + landingDistance;
      });
    }

    timerRef.current = window.setTimeout(() => {
      setCurrentItem(selected);
      setCalledItems((items) => [selected, ...items]);
      setPendingItem(null);
      setIsSpinning(false);
      if (soundEnabled) playMachineRevealSound();
    }, activeMachine.duration);
  };

  const reset = () => {
    window.clearTimeout(timerRef.current);
    setCalledItems([]);
    setCurrentItem(null);
    setPendingItem(null);
    setIsSpinning(false);
    setRotation(0);
    setSpinNonce(0);
  };

  return (
    <div className="bingo-page bingo-picker-page bingo-background-page">
      <header className="bingo-picker-header">
        <button type="button" className="bingo-brutal-button bingo-white-button" onClick={onBack}>{t('bingo.picker.back')}</button>
        <div>
          <p className="bingo-kicker">{t('bingo.picker.kicker')}</p>
          <h1>{game.title}</h1>
        </div>
        <button type="button" className="bingo-brutal-button bingo-reset-button" onClick={reset}>{t('bingo.picker.reset')}</button>
      </header>

      <MachineSelector
        machineId={machineId}
        onChange={onMachineChange}
        disabled={isSpinning}
        compact
      />

      <main className="bingo-picker-layout">
        <section className={`bingo-machine-panel machine-${machineId} ${isMaximized ? 'is-maximized' : ''}`}>
          <div className="bingo-machine-panel-tools">
            <button
              type="button"
              onClick={() => setSoundEnabled((enabled) => !enabled)}
              disabled={isSpinning}
              aria-label={soundEnabled ? t('bingo.picker.muteSounds') : t('bingo.picker.turnOnSounds')}
            >
              <span aria-hidden="true">{soundEnabled ? '♪' : '×'}</span> {soundEnabled ? t('bingo.picker.soundOn') : t('bingo.picker.soundOff')}
            </button>
            <button type="button" onClick={() => setIsMaximized((maximized) => !maximized)}>
              <span aria-hidden="true">{isMaximized ? '×' : '↗'}</span> {isMaximized ? t('bingo.picker.exit') : t('bingo.picker.fullScreen')}
            </button>
          </div>
          <PickerMachineStage
            machineId={machineId}
            items={game.items}
            calledSet={calledSet}
            pendingItem={pendingItem}
            currentItem={currentItem}
            isSpinning={isSpinning}
            rotation={rotation}
            spinNonce={spinNonce}
          />

          <div className={`bingo-picker-action-panel ${isSpinning ? 'is-picking' : ''}`}>
            <div className="bingo-current-call" aria-live="polite">
              <span>{isSpinning ? t('bingo.picker.picking') : currentItem ? t('bingo.picker.callThis') : t('bingo.picker.ready')}</span>
              <strong
                key={isSpinning ? `busy-${spinNonce}` : currentItem ? getBingoItemKey(currentItem) : 'idle'}
                className={[
                  isSpinning ? 'is-busy' : '',
                  !isSpinning && currentItem ? 'is-revealed' : '',
                ].filter(Boolean).join(' ')}
              >
                {isSpinning ? machineBusy : currentItem ? (
                  <BingoItemContent item={currentItem} prominent />
                ) : t('bingo.picker.choose', { machine: machineName })}
              </strong>
            </div>

            <button
              type="button"
              className="bingo-spin-button"
              onClick={spin}
              disabled={isSpinning || remainingItems.length === 0}
            >
              {remainingItems.length === 0 ? t('bingo.picker.allCalled') : isSpinning ? machineBusy : machineAction}
            </button>
            <p className="bingo-picker-hint">{t('bingo.picker.noRepeats', { hint: game.pickerHint })}</p>
          </div>
        </section>

        <aside className="bingo-called-panel">
          <div className="bingo-called-heading">
            <div>
              <p>{t('bingo.picker.calledItems')}</p>
              <h2>{calledItems.length} / {game.items.length}</h2>
            </div>
            <span>{t('common.left', { count: remainingItems.length })}</span>
          </div>

          <div className="bingo-progress-track">
            <span style={{ width: `${(calledItems.length / game.items.length) * 100}%` }} />
          </div>

          {calledItems.length === 0 ? (
            <div className="bingo-empty-called">
              <span>☝️</span>
              <p>{t('bingo.picker.calledEmpty')}</p>
            </div>
          ) : (
            <div className="bingo-called-list">
              {calledItems.map((item, index) => (
                <span className={index === 0 ? 'latest' : ''} key={getBingoItemKey(item)}>
                  <BingoItemContent item={item} compact />
                </span>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default function BingoGame() {
  const { gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const customGame = location.state?.customGame;
  const baseGame = gameId === CUSTOM_BINGO_GAME_ID ? customGame : getBingoGame(gameId);
  const game = useMemo(() => (
    baseGame
      ? baseGame.isCustom ? baseGame : {
        ...baseGame,
        title: t(`bingo.games.${baseGame.id}.title`),
        description: t(`bingo.games.${baseGame.id}.description`),
        pickerHint: t(`bingo.games.${baseGame.id}.pickerHint`),
      }
      : null
  ), [baseGame, t]);
  const [gridSize, setGridSize] = useState(3);
  const [generatedGridSize, setGeneratedGridSize] = useState(3);
  const [cardCount, setCardCount] = useState(6);
  const [cardsPerPage, setCardsPerPage] = useState(1);
  const [cards, setCards] = useState([]);
  const [pickerMachine, setPickerMachine] = useState(() => (
    baseGame?.items?.some((item) => getBingoItemImage(item)) ? 'gallery' : 'wheel'
  ));
  const [phase, setPhase] = useState('setup');
  const [error, setError] = useState('');
  const availableGridSizes = useMemo(() => (
    game ? GRID_SIZES.filter((size) => size * size <= game.items.length) : []
  ), [game]);
  const activeGridSize = availableGridSizes.includes(gridSize)
    ? gridSize
    : availableGridSizes[availableGridSizes.length - 1] || gridSize;
  const canGenerate = Boolean(game && game.items.length >= activeGridSize * activeGridSize);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  if (!game) {
    return (
      <div className="bingo-page bingo-missing-page">
        <h1>{t('bingo.setup.missing')}</h1>
        <button type="button" className="bingo-brutal-button" onClick={() => navigate('/bingo')}>{t('bingo.setup.backToBingo')}</button>
      </div>
    );
  }

  const downloadCards = async (nextCards = cards) => {
    try {
      await downloadBingoPdf({ game: baseGame, gridSize: generatedGridSize, cards: nextCards, cardsPerPage });
      setError('');
    } catch (downloadError) {
      console.error('Could not generate Bingo PDF:', downloadError);
      setError(t('bingo.setup.pdfError'));
    }
  };

  const generateCards = () => {
    if (!canGenerate) {
      setError(t('bingo.setup.notEnoughItems', { count: activeGridSize * activeGridSize, grid: activeGridSize }));
      return;
    }

    const nextCards = generateBingoCards(game, activeGridSize, cardCount);
    setCards(nextCards);
    setGeneratedGridSize(activeGridSize);
    setError('');
    setPhase('ready');
  };

  if (phase === 'picker') {
    return (
      <>
        <MenuBackdrop />
        <Picker
          game={game}
          machineId={pickerMachine}
          onMachineChange={setPickerMachine}
          onBack={() => setPhase('ready')}
        />
      </>
    );
  }

  return (
    <>
      <MenuBackdrop />
      <div className="bingo-page bingo-setup-page bingo-background-page">
      <header className="bingo-setup-header">
        <button
          type="button"
          className="bingo-brutal-button bingo-white-button"
          onClick={() => phase === 'ready' ? setPhase('setup') : navigate('/bingo')}
        >
          {phase === 'ready' ? t('bingo.setup.backReady') : t('bingo.setup.backSetup')}
        </button>
        <div>
          <p className="bingo-kicker">{phase === 'ready' ? t('bingo.setup.readyKicker') : t('bingo.setup.setupKicker')}</p>
          <h1>{game.title}</h1>
        </div>
        <div className="bingo-header-spacer" aria-hidden="true" />
      </header>

      {phase === 'setup' ? (
        <main className="bingo-builder-layout">
          <section className="bingo-builder-card">
            <div className="bingo-step-heading">
              <span>1</span>
              <div><h2>{t('bingo.setup.chooseGrid')}</h2><p>{t('bingo.setup.gridHelp')}</p></div>
            </div>
            <div className="bingo-grid-options">
              {GRID_SIZES.map((size) => (
                <button
                  type="button"
                  key={size}
                  className={activeGridSize === size ? 'selected' : ''}
                  aria-pressed={activeGridSize === size}
                  disabled={!availableGridSizes.includes(size)}
                  onClick={() => setGridSize(size)}
                >
                  <span className="bingo-option-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
                    {Array.from({ length: size * size }, (_, index) => <i key={index} />)}
                  </span>
                  <strong>{size} × {size}</strong>
                </button>
              ))}
            </div>

            <div className="bingo-builder-divider" />

            <div className="bingo-step-heading">
              <span>2</span>
              <div><h2>{t('bingo.setup.howManyCards')}</h2><p>{t('bingo.setup.cardsHelp')}</p></div>
            </div>
            <div className="bingo-count-control">
              <button type="button" aria-label={t('bingo.setup.removeCard')} onClick={() => setCardCount((count) => Math.max(1, count - 1))}>−</button>
              <label>
                <input
                  type="number"
                  min="1"
                  max={MAX_CARD_COUNT}
                  value={cardCount}
                  onChange={(event) => setCardCount(Math.min(MAX_CARD_COUNT, Math.max(1, Number(event.target.value) || 1)))}
                />
                <span>{t('bingo.setup.bingoCards')}</span>
              </label>
              <button type="button" aria-label={t('bingo.setup.addCard')} onClick={() => setCardCount((count) => Math.min(MAX_CARD_COUNT, count + 1))}>+</button>
            </div>
            <input
              className="bingo-count-range"
              type="range"
              min="1"
              max={MAX_CARD_COUNT}
              value={cardCount}
              onChange={(event) => setCardCount(Number(event.target.value))}
              aria-label={t('bingo.setup.numberOfCards')}
            />
            <div className="bingo-limit-note"><span>✓</span> {t('bingo.setup.upToCards', { count: MAX_CARD_COUNT })}</div>

            <div className="bingo-builder-divider" />

            <div className="bingo-step-heading">
              <span>3</span>
              <div><h2>{t('bingo.setup.cardsPerPaper')}</h2><p>{t('bingo.setup.paperHelp')}</p></div>
            </div>
            <div className="bingo-print-options">
              {PRINT_LAYOUTS.map((layout) => (
                <button
                  type="button"
                  key={layout.value}
                  className={cardsPerPage === layout.value ? 'selected' : ''}
                  aria-pressed={cardsPerPage === layout.value}
                  onClick={() => setCardsPerPage(layout.value)}
                >
                  <span className={`bingo-paper-icon layout-${layout.value}`} aria-hidden="true">
                    {Array.from({ length: layout.value }, (_, index) => <i key={index} />)}
                  </span>
                  <strong>{t(`bingo.printLayouts.${layout.key}.label`)}</strong>
                  <small>{t(`bingo.printLayouts.${layout.key}.hint`)}</small>
                </button>
              ))}
            </div>
            <p className="bingo-sheet-count">
              {t('bingo.setup.sheetCount', {
                cards: cardCount,
                sheets: Math.ceil(cardCount / cardsPerPage),
                sheetWord: Math.ceil(cardCount / cardsPerPage) === 1 ? t('bingo.setup.sheet') : t('bingo.setup.sheets'),
              })}
            </p>

            <button type="button" className="bingo-generate-button" onClick={generateCards} disabled={!canGenerate}>
              {t('bingo.setup.generate', { count: cardCount, cardWord: cardCount === 1 ? t('bingo.setup.card') : t('bingo.setup.cards') })} <span>→</span>
            </button>
            {error && <p className="bingo-error" role="alert">{error}</p>}
          </section>

          <aside className="bingo-live-preview">
            <p>{t('bingo.setup.livePreview')}</p>
            <CardPreview
              cells={game.items.slice(0, activeGridSize * activeGridSize)}
              gridSize={activeGridSize}
            />
            <div className="bingo-preview-summary">
              <span>{activeGridSize * activeGridSize}<small>{t('bingo.setup.itemsPerCard')}</small></span>
              <span>{cardCount}<small>{t('bingo.setup.uniqueCards')}</small></span>
              <span>{Math.ceil(cardCount / cardsPerPage)}<small>{t('bingo.setup.printedSheets')}</small></span>
            </div>
          </aside>
        </main>
      ) : (
        <main className="bingo-ready-layout">
          <section className="bingo-ready-preview-wrap">
            <div className="bingo-ready-confetti confetti-one" />
            <div className="bingo-ready-confetti confetti-two" />
            <CardPreview cells={cards[0]} gridSize={generatedGridSize} />
            <span className="bingo-stack-page page-two" />
            <span className="bingo-stack-page page-three" />
          </section>

          <section className="bingo-ready-actions">
            <span className="bingo-success-check">✓</span>
            <h2>{t('bingo.setup.generatedTitle', { count: cards.length })}</h2>
            <p>{t('bingo.setup.readyBody', { cardsPerPage, cardWord: cardsPerPage === 1 ? t('bingo.setup.card') : t('bingo.setup.cards') })}</p>

            <div className="bingo-ready-stats">
              <span><strong>{generatedGridSize} × {generatedGridSize}</strong> {t('bingo.setup.gridSize')}</span>
              <span><strong>{Math.ceil(cards.length / cardsPerPage)}</strong> {t('bingo.setup.pdfSheets')}</span>
              <span><strong>{game.items.length}</strong> {t('bingo.setup.pickerItems')}</span>
            </div>

            <button type="button" className="bingo-download-button" onClick={() => downloadCards()}>
              {t('bingo.setup.downloadPdf')}
            </button>
            <div className="bingo-ready-machine-choice">
              <p>{t('bingo.setup.choosePicker')}</p>
              <MachineSelector machineId={pickerMachine} onChange={setPickerMachine} />
            </div>
            <button type="button" className="bingo-start-button" onClick={() => setPhase('picker')}>
              {t('bingo.setup.startPicker')} <span>→</span>
            </button>
            <p className="bingo-print-tip">{t('bingo.setup.printTip')}</p>
            {error && <p className="bingo-error" role="alert">{error}</p>}
          </section>
        </main>
      )}
      </div>
    </>
  );
}
