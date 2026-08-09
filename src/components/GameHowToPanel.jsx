import { useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import './GameHowToPanel.css';

/**
 * Game "How to play" helper.
 *
 * By default it renders a right-aligned toggle button plus the drop-down panel
 * together (uncontrolled). For tighter headers you can split the two pieces:
 *   - render="toggle": just the button (place it inline in a header row)
 *   - render="panel": just the drop-down panel (place it full-width below)
 * and drive them with the shared `isOpen` / `onToggle` props.
 */
export default function GameHowToPanel({
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  paragraphs = [],
  tags = [],
  render = 'default',
  isOpen: controlledOpen,
  onToggle,
}) {
  const { t } = useI18n();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const toggle = () => {
    if (isControlled) onToggle?.();
    else setUncontrolledOpen((open) => !open);
  };

  const panelEyebrow = eyebrow || t('gameHowTo.eyebrow');
  const panelTitle = title || t('gameHowTo.title');

  const toggleButton = (
    <button
      type="button"
      className={`game-how-to-toggle${isOpen ? ' is-open' : ''}`}
      onClick={toggle}
      aria-expanded={isOpen}
    >
      <span className="game-how-to-toggle-icon" aria-hidden="true">?</span>
      <span>{t('gameHowTo.open')}</span>
      <span className={`game-how-to-toggle-chevron${isOpen ? ' is-open' : ''}`} aria-hidden="true">▾</span>
    </button>
  );

  if (render === 'toggle') {
    return toggleButton;
  }

  const panel = isOpen && (
    <div className="game-how-to-panel">
      <div className="game-how-to-poster">
        <img src={imageSrc} alt={imageAlt} />
      </div>

      <div className="game-how-to-body">
        <p className="game-how-to-eyebrow">{panelEyebrow}</p>
        <h2>{panelTitle}</h2>
        {paragraphs.map((paragraph) => (
          <p className="game-how-to-text" key={paragraph}>{paragraph}</p>
        ))}
        <div className="game-how-to-tags">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );

  if (render === 'panel') {
    return panel ? <section className="game-how-to game-how-to--panel-only">{panel}</section> : null;
  }

  return (
    <section className="game-how-to">
      <div className="game-how-to-toggle-row">{toggleButton}</div>
      {panel}
    </section>
  );
}
