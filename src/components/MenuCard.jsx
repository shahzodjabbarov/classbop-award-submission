import './MenuCard.css';

export default function MenuCard({
  title,
  description,
  meta,
  image,
  accent = '#8b5cf6',
  disabled = false,
  badge,
  onClick,
  onMouseEnter,
  onMouseLeave,
  ariaLabel,
  style,
}) {
  const metaText = String(meta || '');
  const metaLengthClass = metaText.length > 34 ? ' is-extra-long' : metaText.length > 24 ? ' is-long' : '';

  return (
    <button
      type="button"
      className="menu-card"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ ...style, '--menu-card-accent': accent }}
    >
      {badge && <span className="menu-card-badge">{badge}</span>}
      <span className="menu-card-media">
        <img className="menu-card-image" src={image} alt={title} draggable="false" />
      </span>
      <span className="menu-card-copy">
        <span className="menu-card-title">{title}</span>
        <span className="menu-card-description">{description}</span>
        <span className="menu-card-footer">
          <span className={`menu-card-meta${metaLengthClass}`}>
            <span aria-hidden="true" className="menu-card-star">★</span>
            <span>{meta}</span>
          </span>
          <span className="menu-card-arrow" aria-hidden="true">→</span>
        </span>
      </span>
    </button>
  );
}
