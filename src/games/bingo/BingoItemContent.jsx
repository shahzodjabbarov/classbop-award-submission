import { useMemo } from 'react';
import { createEmojiImage } from './bingoEmojiImage';
import { getBingoItemEmoji, getBingoItemImage, getBingoItemLabel } from './bingoGames';

export default function BingoItemContent({
  item,
  showLabel = true,
  compact = false,
  prominent = false,
}) {
  const emoji = getBingoItemEmoji(item);
  const image = getBingoItemImage(item);
  const label = getBingoItemLabel(item);
  const flagSrc = useMemo(() => (emoji ? createEmojiImage(emoji) : null), [emoji]);

  if (!emoji && !image) return label;

  return (
    <span
      className={[
        'bingo-item-content',
        compact ? 'is-compact' : '',
        prominent ? 'is-prominent' : '',
        image ? 'has-image' : '',
        !label ? 'image-only' : '',
      ].filter(Boolean).join(' ')}
    >
      {image ? (
        <img className="bingo-item-image" src={image} alt="" aria-hidden="true" />
      ) : flagSrc ? (
        <img className="bingo-item-flag" src={flagSrc} alt="" aria-hidden="true" />
      ) : (
        <span className="bingo-item-emoji" aria-hidden="true">{emoji}</span>
      )}
      {showLabel && label && <span className="bingo-item-label">{label}</span>}
    </span>
  );
}
