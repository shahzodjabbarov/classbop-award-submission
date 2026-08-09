const emojiImageCache = new Map();

export function createEmojiImage(emoji) {
  if (typeof document === 'undefined') return null;
  if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji);

  const canvas = document.createElement('canvas');
  const size = 160;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) return null;

  context.clearRect(0, 0, size, size);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '118px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  context.fillText(emoji, size / 2, size / 2 + 2);

  const image = canvas.toDataURL('image/png');
  emojiImageCache.set(emoji, image);
  return image;
}
