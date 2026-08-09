import { useState } from 'react';
import { Link } from 'react-router-dom';
import './DeckCard.css';

const DECK_THUMBNAIL_RATIO_CACHE_KEY = 'classbop:deck-thumbnail-ratios:v1';
const DEFAULT_DECK_THUMBNAIL_RATIO = 1.6;

function readThumbnailRatios() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(DECK_THUMBNAIL_RATIO_CACHE_KEY) || '{}');
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    return {};
  }
}

const thumbnailRatios = typeof window === 'undefined' ? {} : readThumbnailRatios();

function cacheThumbnailRatio(src, ratio) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
  if (Math.abs((thumbnailRatios[src] || 0) - ratio) < 0.001) return;
  thumbnailRatios[src] = ratio;
  try {
    window.localStorage.setItem(DECK_THUMBNAIL_RATIO_CACHE_KEY, JSON.stringify(thumbnailRatios));
  } catch {
    // The measured ratio still applies for this visit if storage is unavailable.
  }
}

export function DeckBookmarkIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path fill={filled ? 'currentColor' : 'none'} d="M6 4.8A2.8 2.8 0 0 1 8.8 2h6.4A2.8 2.8 0 0 1 18 4.8V21l-6-3.7L6 21Z" />
    </svg>
  );
}

/**
 * The Quiz Bop menu card, shared by every game menu.
 *
 * Media is either an `image`, a plain `emoji` tile, or a fully custom `media`
 * node (Bingo renders its mini board there). Pass `hoverImage` to play an
 * animated version (a GIF/WebP loop) while the card is hovered or focused —
 * the still stays underneath so nothing shifts while the loop downloads.
 * `meta` chips take a `tone` of author / count / plays / level to pick the
 * icon colour.
 */
export default function DeckCard({
  to,
  onClick,
  title,
  description,
  image,
  hoverImage,
  emoji,
  media,
  mediaBackground,
  mediaRatio,
  meta = [],
  isFavorite = false,
  onToggleFavorite,
  favoriteLabel,
  actions,
  ariaLabel,
  className = '',
  children,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const resolvedMediaRatio = mediaRatio
    || thumbnailRatios[image]
    || DEFAULT_DECK_THUMBNAIL_RATIO;

  const handleImageLoad = (event) => {
    if (mediaRatio) return;
    const loadedImage = event.currentTarget;
    if (!loadedImage.naturalWidth || !loadedImage.naturalHeight) return;

    const ratio = Math.min(2, Math.max(1, loadedImage.naturalWidth / loadedImage.naturalHeight));
    loadedImage.parentElement?.style.setProperty('--deck-media-ratio', String(ratio));
    cacheThumbnailRatio(image, ratio);
  };

  const mediaNode = media || (image
    ? (
      <>
        <img className="deck-card-image" src={image} alt="" draggable="false" loading="lazy" decoding="async" onLoad={handleImageLoad} />
        {hoverImage && isPlaying && (
          <img className="deck-card-image deck-card-image-loop" src={hoverImage} alt="" draggable="false" />
        )}
      </>
    )
    : <div className="deck-card-emoji" aria-hidden="true">{emoji || '🎲'}</div>);

  const playProps = hoverImage && image
    ? {
      onMouseEnter: () => setIsPlaying(true),
      onMouseLeave: () => setIsPlaying(false),
      onFocus: () => setIsPlaying(true),
      onBlur: () => setIsPlaying(false),
    }
    : null;

  const body = (
    <>
      {onToggleFavorite && (
        <button
          type="button"
          className={`deck-card-fav${isFavorite ? ' is-favorite' : ''}`}
          title={favoriteLabel || (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
          aria-label={favoriteLabel || (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(event);
          }}
        >
          <DeckBookmarkIcon filled={isFavorite} />
        </button>
      )}

      {actions && <div className="deck-card-actions">{actions}</div>}

      <div
        className="deck-card-media"
        style={{
          '--deck-media-ratio': resolvedMediaRatio,
          ...(mediaBackground ? { '--deck-media-bg': mediaBackground } : null),
        }}
      >
        {mediaNode}
      </div>

      <div className="deck-card-copy">
        <h2 className="deck-card-title">{title}</h2>
        {description && <p className="deck-card-text" title={description}>{description}</p>}
        {meta.length > 0 && (
          <div className="deck-card-meta">
            {meta.map((chip) => (
              <span
                key={chip.id || chip.label}
                className={`deck-card-chip is-${chip.tone || 'count'}`}
                title={chip.title || String(chip.label)}
                aria-label={chip.title || undefined}
              >
                {chip.icon && <i aria-hidden="true">{chip.icon}</i>}
                <b>{chip.label}</b>
              </span>
            ))}
          </div>
        )}
      </div>

      {children}
    </>
  );

  if (to) {
    return (
      <Link className={`deck-card ${className}`.trim()} to={to} aria-label={ariaLabel} {...playProps}>
        {body}
      </Link>
    );
  }

  return (
    <div
      className={`deck-card ${className}`.trim()}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      {...playProps}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.(event);
        }
      }}
    >
      {body}
    </div>
  );
}
