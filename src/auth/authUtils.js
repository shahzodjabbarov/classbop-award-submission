export const sanitizeNextPath = (value, fallback = '/games') => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
};

const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'api',
  'auth',
  'class',
  'classes',
  'dashboard',
  'game',
  'games',
  'google',
  'login',
  'logout',
  'moderator',
  'profile',
  'classbop',
  'root',
  'signup',
  'support',
  'teacher',
  'test',
  'tool',
  'tools',
  'user',
]);

export const normalizeUsername = (value) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
};

export const validateUsername = (value) => {
  const username = normalizeUsername(value);

  if (!/^[a-z0-9_]{4,20}$/.test(username)) {
    return 'Username must be 4-20 characters: lowercase letters, numbers, or underscores.';
  }

  if (!/[a-z]/.test(username)) {
    return 'Username needs at least one letter.';
  }

  if (/^_+$/.test(username) || /^\d+$/.test(username)) {
    return 'Username cannot be only numbers or underscores.';
  }

  if (/(.)\1{4,}/.test(username)) {
    return 'Username has too many repeated characters.';
  }

  if (RESERVED_USERNAMES.has(username)) {
    return 'That username is reserved. Please choose something more personal.';
  }

  return '';
};

export const isUsernameValid = (value) => validateUsername(value) === '';

export const validatePassword = (password, { email = '', username = '', displayName = '' } = {}) => {
  if (password.length < 8) {
    return 'Password needs at least 8 characters.';
  }

  if (/\s/.test(password)) {
    return 'Password cannot contain spaces.';
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password needs at least one letter and one number.';
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    return 'Password needs both uppercase and lowercase letters.';
  }

  const lowerPassword = password.toLowerCase();
  const emailName = email.split('@')[0]?.toLowerCase();
  const normalizedDisplayName = displayName.toLowerCase().replace(/\s+/g, '');

  if (username && lowerPassword.includes(username.toLowerCase())) {
    return 'Password should not include your username.';
  }

  if (emailName && emailName.length >= 4 && lowerPassword.includes(emailName)) {
    return 'Password should not include your email name.';
  }

  if (normalizedDisplayName.length >= 4 && lowerPassword.includes(normalizedDisplayName)) {
    return 'Password should not include your display name.';
  }

  return '';
};

export const getProfileName = (profile, fallback = 'Teacher') => {
  return profile?.display_name || profile?.username || fallback;
};

const CUTE_ADJECTIVES = [
  'sunny',
  'melon',
  'bouncy',
  'zesty',
  'cozy',
  'sparkly',
  'tiny',
  'happy',
  'golden',
  'clever',
  'peachy',
  'jolly',
];

const CUTE_NOUNS = [
  'classbop',
  'sprout',
  'cloud',
  'mango',
  'otter',
  'bean',
  'panda',
  'turtle',
  'waffle',
  'noodle',
  'pickle',
  'moon',
];

const makeSeedBase = (seed) => {
  const normalizedSeed = normalizeUsername(seed || '').replace(/_/g, '');
  if (normalizedSeed.length >= 4 && !RESERVED_USERNAMES.has(normalizedSeed)) {
    return normalizedSeed.slice(0, 12);
  }

  const adjective = CUTE_ADJECTIVES[Math.floor(Math.random() * CUTE_ADJECTIVES.length)];
  const noun = CUTE_NOUNS[Math.floor(Math.random() * CUTE_NOUNS.length)];
  return `${adjective}_${noun}`;
};

export const generateCuteUsernameCandidates = (seed = '') => {
  const base = makeSeedBase(seed);
  const candidates = new Set();

  for (let i = 0; i < 12; i += 1) {
    const number = Math.floor(100 + Math.random() * 9000);
    const adjective = CUTE_ADJECTIVES[Math.floor(Math.random() * CUTE_ADJECTIVES.length)];
    const noun = CUTE_NOUNS[Math.floor(Math.random() * CUTE_NOUNS.length)];

    candidates.add(`${base}${number}`.slice(0, 20));
    candidates.add(`${adjective}_${noun}${number}`.slice(0, 20));
  }

  return [...candidates].filter((candidate) => validateUsername(candidate) === '');
};
