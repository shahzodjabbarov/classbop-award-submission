export const AVATAR_EMOJIS = [
  '🍉',
  '⭐',
  '🚀',
  '🎮',
  '🧩',
  '🎲',
  '🏆',
  '🎯',
  '💡',
  '📚',
  '🪄',
  '🎨',
  '🎧',
  '⚡',
  '🌈',
  '🍀',
  '🔥',
  '💎',
  '🌟',
  '🛠️',
];

export const EMOJI_AVATAR_PREFIX = 'emoji:';

export function makeEmojiAvatar(emoji) {
  return `${EMOJI_AVATAR_PREFIX}${emoji}`;
}

export function isEmojiAvatar(value) {
  return typeof value === 'string' && value.startsWith(EMOJI_AVATAR_PREFIX);
}

export function getEmojiFromAvatar(value) {
  return isEmojiAvatar(value) ? value.slice(EMOJI_AVATAR_PREFIX.length) : '';
}

export function getAvatarForSeed(seed = '') {
  const source = String(seed || 'classbop');
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % AVATAR_EMOJIS.length;
  }

  return makeEmojiAvatar(AVATAR_EMOJIS[Math.abs(hash) % AVATAR_EMOJIS.length]);
}
