import { Shuffle } from 'lucide-react';
import BingoItemContent from './BingoItemContent';
import { createEmojiImage } from './bingoEmojiImage';
import { PICKER_MACHINES } from './pickerMachines';
import { useI18n } from '../../i18n/useI18n';
import {
  getBingoItemEmoji,
  getBingoItemImage,
  getBingoItemKey,
  getBingoItemLabel,
} from './bingoGames';

const MACHINE_COLORS = ['#FF5C7A', '#FFB800', '#51B7FF', '#845EF7', '#2DDBA4', '#FF8A4C', '#3EAF55'];

function MachineBadge({ machineId }) {
  if (machineId === 'wheel') {
    return <span className="bingo-machine-badge badge-wheel"><i /><i /><i /><i /></span>;
  }

  if (machineId === 'gumball') {
    return <span className="bingo-machine-badge badge-gumball"><i /><i /><i /></span>;
  }

  return (
    <span className="bingo-machine-badge badge-gallery">
      <Shuffle aria-hidden="true" />
    </span>
  );
}

export function MachineSelector({ machineId, onChange, disabled = false, compact = false }) {
  const { t } = useI18n();

  return (
    <div className={`bingo-machine-selector ${compact ? 'is-compact' : ''}`}>
      {PICKER_MACHINES.map((machine) => (
        <button
          type="button"
          key={machine.id}
          className={machineId === machine.id ? 'selected' : ''}
          aria-pressed={machineId === machine.id}
          disabled={disabled}
          onClick={() => onChange(machine.id)}
        >
          <MachineBadge machineId={machine.id} />
          <span className="bingo-machine-option-copy">
            <strong>{t(`bingo.machines.${machine.id}.name`)}</strong>
            {!compact && <small>{t(`bingo.machines.${machine.id}.description`)}</small>}
          </span>
        </button>
      ))}
    </div>
  );
}

function polarPoint(center, radius, angle) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function wheelSlicePath(index, itemCount) {
  if (itemCount === 1) {
    return 'M 200 12 A 188 188 0 1 1 199.9 12 Z';
  }
  const sliceAngle = 360 / itemCount;
  const startAngle = -90 + index * sliceAngle;
  const endAngle = startAngle + sliceAngle;
  const start = polarPoint(200, 188, startAngle);
  const end = polarPoint(200, 188, endAngle);
  const largeArc = sliceAngle > 180 ? 1 : 0;
  return `M 200 200 L ${start.x} ${start.y} A 188 188 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function LiveWheel({ items, rotation, isSpinning, currentItem }) {
  const { t } = useI18n();
  const sliceAngle = items.length > 0 ? 360 / items.length : 360;
  const labelRadius = items.length > 45 ? 169 : items.length > 28 ? 160 : 144;
  const fontSize = items.length > 45 ? 8.5 : items.length > 30 ? 12 : 21;

  return (
    <div className="live-wheel-stage">
      <div className="live-wheel-pointer" aria-hidden="true"><span /></div>
      <div
        className={`live-wheel-disc ${isSpinning ? 'is-running' : ''}`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <svg viewBox="0 0 400 400" role="img" aria-label="Bingo item wheel">
          {items.map((item, index) => {
            const angle = -90 + index * sliceAngle + sliceAngle / 2;
            const label = polarPoint(200, labelRadius, angle);
            const emoji = getBingoItemEmoji(item);
            const image = getBingoItemImage(item);
            const wheelImage = image || (emoji ? createEmojiImage(emoji) : null);
            const wheelLabel = emoji || getBingoItemLabel(item);
            const imageSize = fontSize * 1.75;
            return (
              <g key={getBingoItemKey(item)}>
                <path d={wheelSlicePath(index, items.length)} fill={MACHINE_COLORS[index % MACHINE_COLORS.length]} />
                {wheelImage ? (
                  <image
                    href={wheelImage}
                    x={label.x - imageSize / 2}
                    y={label.y - imageSize / 2}
                    width={imageSize}
                    height={imageSize}
                    transform={`rotate(${angle + 90} ${label.x} ${label.y})`}
                  />
                ) : (
                  <text
                    x={label.x}
                    y={label.y}
                    fontSize={fontSize}
                    transform={`rotate(${angle + 90} ${label.x} ${label.y})`}
                  >
                    {wheelLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className={`live-wheel-hub-overlay ${!isSpinning && currentItem ? 'has-result' : ''}`}>
        <small>{isSpinning ? t('bingo.machineUi.roundAndRound') : currentItem ? t('bingo.machineUi.winner') : items.length === 0 ? t('bingo.machineUi.allDone') : t('bingo.machineUi.ready')}</small>
        <strong>{isSpinning ? t('bingo.machineUi.go') : currentItem ? <BingoItemContent item={currentItem} compact /> : (items.length === 0 ? '✓' : t('bingo.machineUi.spin'))}</strong>
      </div>
      <div className="live-wheel-shadow" aria-hidden="true" />
    </div>
  );
}

function getDisplayItems(items, pendingItem, limit) {
  if (items.length <= limit) return items;
  const step = Math.max(1, Math.floor(items.length / limit));
  const displayItems = items.filter((_, index) => index % step === 0).slice(0, limit);

  if (pendingItem && !displayItems.includes(pendingItem)) {
    displayItems[displayItems.length - 1] = pendingItem;
  }

  return displayItems;
}

function Ball({ item, index, className = '', style = {} }) {
  const fallbackIndex = getBingoItemKey(item).split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const colorIndex = index >= 0 ? index : fallbackIndex;
  return (
    <span
      className={`machine-item-ball color-${colorIndex % MACHINE_COLORS.length} ${className}`}
      style={{
        '--ball-color': MACHINE_COLORS[colorIndex % MACHINE_COLORS.length],
        '--ball-delay': `${(colorIndex % 8) * -0.09}s`,
        '--ball-x': `${8 + ((colorIndex * 37) % 78)}%`,
        '--ball-y': `${12 + ((colorIndex * 53) % 66)}%`,
        '--ball-drift': `${-24 + ((colorIndex * 17) % 48)}px`,
        '--ball-drift-small': `${(-24 + ((colorIndex * 17) % 48)) * 0.25}px`,
        '--ball-jump': `${25 + ((colorIndex * 11) % 38)}px`,
        ...style,
      }}
    >
      <BingoItemContent item={item} showLabel={false} compact />
    </span>
  );
}

const GUMBALL_ROWS = [5, 6, 6, 5, 2];
const GUMBALL_ROW_Y = [82, 68, 54, 40, 27];

function getGumballPosition(index) {
  let itemIndex = index;

  for (let rowIndex = 0; rowIndex < GUMBALL_ROWS.length; rowIndex += 1) {
    const rowSize = GUMBALL_ROWS[rowIndex];
    if (itemIndex < rowSize) {
      const spacing = rowSize === 2 ? 17 : 14;
      const startX = 50 - ((rowSize - 1) * spacing) / 2;
      return {
        '--ball-x': `${startX + itemIndex * spacing}%`,
        '--ball-y': `${GUMBALL_ROW_Y[rowIndex]}%`,
      };
    }
    itemIndex -= rowSize;
  }

  return { '--ball-x': '50%', '--ball-y': '50%' };
}

function GumballMachine({ items, pendingItem, currentItem, isSpinning, spinNonce }) {
  const { t } = useI18n();
  const displayItems = getDisplayItems(items, pendingItem, 24);
  const settledItems = isSpinning && pendingItem ? displayItems.filter((item) => item !== pendingItem) : displayItems;
  const pendingIndex = Math.max(0, items.indexOf(pendingItem));

  return (
    <div className={`gumball-machine ${isSpinning ? 'is-running' : ''}`}>
      <div className="gumball-sign">{t('bingo.machineUi.gumballSign')}</div>
      <div className="gumball-globe">
        <div className="gumball-glass-shine" />
          {settledItems.map((item, index) => (
          <Ball key={`${getBingoItemKey(item)}-${spinNonce}`} item={item} index={index} style={getGumballPosition(index)} />
        ))}
      </div>
      <div className="gumball-neck" />
      <div className="gumball-base">
        <div className="gumball-dial"><span>★</span></div>
        <div className="gumball-chute" />
        <div className="gumball-tray">
          {!isSpinning && currentItem && <Ball item={currentItem} index={items.indexOf(currentItem)} className="gumball-result" />}
        </div>
      </div>
      {isSpinning && pendingItem && (
        <Ball key={`winner-${spinNonce}`} item={pendingItem} index={pendingIndex} className="gumball-dropping-ball" />
      )}
    </div>
  );
}

function LuckyClaw({ items, pendingItem, currentItem, isSpinning, spinNonce }) {
  const { t } = useI18n();
  const displayItems = getDisplayItems(items, pendingItem, 16);
  const pitItems = isSpinning && pendingItem ? displayItems.filter((item) => item !== pendingItem) : displayItems;
  const pendingIndex = Math.max(0, items.indexOf(pendingItem));

  return (
    <div className={`claw-machine ${isSpinning ? 'is-running' : ''}`}>
      <div className="claw-marquee"><span>★</span> {t('bingo.machineUi.claw')} <span>★</span></div>
      <div className="claw-cabinet">
        <div className="claw-rail" />
        <div className="claw-head">
          <i className="claw-cable" />
          <i className="claw-grabber"><b /><b /></i>
        </div>
        <div className="claw-glass-shine" />
        <div className="claw-ball-pit">
          {pitItems.map((item, index) => <Ball key={`${getBingoItemKey(item)}-${spinNonce}`} item={item} index={index} className="claw-pit-ball" />)}
        </div>
        {isSpinning && pendingItem && (
          <Ball key={`claw-winner-${spinNonce}`} item={pendingItem} index={pendingIndex} className="claw-winner-ball" />
        )}
      </div>
      <div className="claw-controls">
        <span className="claw-stick"><i /></span>
        <span className="claw-button" />
        <div className="claw-prize-door">
          {!isSpinning && currentItem && <Ball item={currentItem} index={items.indexOf(currentItem)} className="claw-result" />}
        </div>
      </div>
    </div>
  );
}

function GalleryMachine({ currentItem, isSpinning, spinNonce }) {
  const { t } = useI18n();

  return (
    <div className={`picture-reveal-machine ${isSpinning ? 'is-running' : ''} ${currentItem ? 'has-feature' : ''}`}>
      <div className="picture-reveal-top">
        <span>{t('bingo.machineUi.gallery')}</span>
      </div>
      <div
        className="picture-reveal-stage"
        role="status"
        aria-busy={isSpinning}
        aria-label={isSpinning ? t('bingo.machines.gallery.busy') : undefined}
      >
        {!isSpinning && currentItem ? (
          <div className="picture-reveal-result" key={getBingoItemKey(currentItem)}>
            <BingoItemContent item={currentItem} />
          </div>
        ) : (
          <div className="picture-reveal-shuffle" key={`shuffle-${spinNonce}`} aria-hidden="true">
            <Shuffle />
          </div>
        )}
      </div>
    </div>
  );
}

export function PickerMachineStage({
  machineId,
  items,
  calledSet,
  pendingItem,
  currentItem,
  isSpinning,
  rotation,
  spinNonce,
}) {
  if (machineId === 'gumball') {
    return (
      <GumballMachine
        items={items.filter((item) => !calledSet.has(item))}
        pendingItem={pendingItem}
        currentItem={currentItem}
        isSpinning={isSpinning}
        spinNonce={spinNonce}
      />
    );
  }

  if (machineId === 'gallery') {
    return (
      <GalleryMachine
        currentItem={currentItem}
        isSpinning={isSpinning}
        spinNonce={spinNonce}
      />
    );
  }

  if (machineId === 'claw') {
    return (
      <LuckyClaw
        items={items.filter((item) => !calledSet.has(item))}
        pendingItem={pendingItem}
        currentItem={currentItem}
        isSpinning={isSpinning}
        spinNonce={spinNonce}
      />
    );
  }

  return (
    <LiveWheel
      items={items.filter((item) => !calledSet.has(item) || item === currentItem)}
      rotation={rotation}
      isSpinning={isSpinning}
      currentItem={currentItem}
    />
  );
}
