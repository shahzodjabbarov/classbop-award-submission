import './ClassBopLoader.css';

const cards = Array.from({ length: 6 }, (_, index) => index);
const scoreboardTeams = ['#004AAC', '#D60000', '#00A651'];

export default function ClassBopLoader({
  variant = 'page',
  label = 'Loading...',
  sublabel = 'Getting things ready',
  columns = 3,
}) {
  if (variant === 'decks') {
    return (
      <div className="cb-loader cb-loader--decks" role="status" aria-live="polite" aria-label={label}>
        <div
          className="cb-loader__deck-grid"
          style={{ gridTemplateColumns: columns === 1 ? '1fr' : 'repeat(3, minmax(0, 1fr))' }}
        >
          <div className="cb-loader__create-card">
            <span className="cb-loader__plus-dot">+</span>
            <span className="cb-loader__create-line cb-shimmer" />
          </div>

          {cards.slice(0, 5).map((card) => (
            <div className="cb-loader__real-deck-card" key={card}>
              <div className="cb-loader__deck-thumb cb-shimmer">
                <span className="cb-loader__share-dot" />
                <span className="cb-loader__currency-chip" />
              </div>
              <div className="cb-loader__real-deck-copy">
                <span className="cb-loader__real-deck-title cb-shimmer" />
                <span className="cb-loader__real-deck-meta cb-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'game') {
    return (
      <div className="cb-loader cb-loader--game" role="status" aria-live="polite">
        <div className="cb-loader__sky" />
        <div className="cb-loader__cloud cb-loader__cloud--one" />
        <div className="cb-loader__cloud cb-loader__cloud--two" />

        <div className="cb-loader__game-stage">
          <div className="cb-loader__game-controls">
            <div className="cb-loader__pill cb-shimmer" />
            <div className="cb-loader__circle cb-shimmer" />
          </div>
          <div className="cb-loader__score-row">
            {scoreboardTeams.map((color) => (
              <div key={color} className="cb-loader__score" style={{ '--team-color': color }}>
                <span className="cb-loader__score-button" />
                <span className="cb-loader__score-text cb-shimmer" />
                <span className="cb-loader__score-button" />
              </div>
            ))}
          </div>

          <div className="cb-loader__game-grid">
            <div className="cb-loader__copy-stack">
              <div className="cb-loader__title-line cb-shimmer" />
              <div className="cb-loader__range-box cb-shimmer" />
            </div>
            <div className="cb-loader__feature-card">
              <div className="cb-loader__image-frame cb-shimmer" />
              <div className="cb-loader__body-lines">
                <span className="cb-loader__body-line cb-shimmer" />
                <span className="cb-loader__body-line cb-loader__body-line--short cb-shimmer" />
              </div>
            </div>
            <div className="cb-loader__price-stack">
              <div className="cb-loader__question-line cb-shimmer" />
              <div className="cb-loader__price-sign cb-shimmer">???</div>
            </div>
          </div>

          <div className="cb-loader__caption">
            <span>{label}</span>
            <small>{sublabel}</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cb-loader cb-loader--${variant}`} role="status" aria-live="polite">
      <div className="cb-loader__panel">
        <div className="cb-loader__header">
          <div className="cb-loader__avatar cb-shimmer" />
          <div className="cb-loader__heading">
            <span className="cb-loader__heading-line cb-shimmer" />
            <span className="cb-loader__heading-line cb-loader__heading-line--short cb-shimmer" />
          </div>
          <div className="cb-loader__button cb-shimmer" />
        </div>

        <div className="cb-loader__grid">
          {cards.map((card) => (
            <div className="cb-loader__deck-card" key={card}>
              <div className="cb-loader__deck-image cb-shimmer" />
              <div className="cb-loader__deck-copy">
                <span className="cb-loader__deck-title cb-shimmer" />
                <span className="cb-loader__deck-meta cb-shimmer" />
              </div>
            </div>
          ))}
        </div>

        <div className="cb-loader__caption">
          <span>{label}</span>
          <small>{sublabel}</small>
        </div>
      </div>
    </div>
  );
}
