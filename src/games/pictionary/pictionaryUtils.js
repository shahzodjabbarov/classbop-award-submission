import { getPromptsByCategory } from './pictionaryData';

export const TIMER_OPTIONS = [30, 45, 60, 90];
export const TEAM_COLORS = ['#FF5C7A', '#51B7FF', '#2DDBA4', '#FFB84D'];
export const DEFAULT_TEAM_NAMES = ['Red Team', 'Blue Team', 'Green Team', 'Yellow Team'];

export function createSessionCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = new Uint32Array(6);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => letters[value % letters.length]).join('');
}

function hashString(value) {
  return String(value).split('').reduce((hash, character) => {
    const nextHash = (hash << 5) - hash + character.charCodeAt(0);
    return nextHash >>> 0;
  }, 2166136261);
}

function seededRandom(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function shuffleWithSeed(items, seed = Date.now()) {
  const random = seededRandom(seed);
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
  }

  return nextItems;
}

export function createPictionarySession({
  categoryId,
  sessionId = createSessionCode(),
  timerDuration = 60,
  teamCount = 2,
  teamNames = DEFAULT_TEAM_NAMES,
} = {}) {
  const prompts = getPromptsByCategory(categoryId);
  const promptOrder = shuffleWithSeed(prompts.map((prompt) => prompt.id), `${sessionId}-${categoryId}`);
  const normalizedTeamCount = Math.min(4, Math.max(1, Number(teamCount) || 2));

  return {
    id: sessionId,
    categoryId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    roundIndex: 0,
    promptOrder,
    revealed: false,
    timerDuration: Number(timerDuration) || 60,
    timeLeft: Number(timerDuration) || 60,
    timerStatus: 'idle',
    timerEndAt: null,
    teamCount: normalizedTeamCount,
    teamNames: Array.from({ length: 4 }, (_, index) => teamNames[index] || DEFAULT_TEAM_NAMES[index]),
    scores: [0, 0, 0, 0],
    soundEnabled: true,
    version: 1,
  };
}

export function getSessionStorageKey(sessionId) {
  return `pictionary-session-${sessionId}`;
}

export function savePictionarySession(session) {
  if (!session?.id) return;
  window.localStorage.setItem(getSessionStorageKey(session.id), JSON.stringify(session));
}

export function loadPictionarySession(sessionId) {
  try {
    const saved = window.localStorage.getItem(getSessionStorageKey(sessionId));
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function getEffectiveTimeLeft(session) {
  if (!session) return 0;
  if (session.timerStatus !== 'running' || !session.timerEndAt) {
    return Math.max(0, Math.ceil(session.timeLeft || 0));
  }

  return Math.max(0, Math.ceil((session.timerEndAt - Date.now()) / 1000));
}

export function getCurrentPrompt(session) {
  const promptId = session?.promptOrder?.[session.roundIndex] || null;
  const prompts = getPromptsByCategory(session?.categoryId);
  return prompts.find((prompt) => prompt.id === promptId) || prompts[0] || null;
}

export function getSessionStats(session) {
  const total = session?.promptOrder?.length || 0;
  const completed = Math.min(session?.roundIndex || 0, total);
  return {
    total,
    completed,
    remaining: Math.max(0, total - completed - 1),
    roundNumber: total === 0 ? 0 : Math.min((session?.roundIndex || 0) + 1, total),
  };
}

export function updateSession(session, updater) {
  const nextSession = typeof updater === 'function' ? updater(session) : { ...session, ...updater };
  return {
    ...nextSession,
    updatedAt: Date.now(),
    version: (session?.version || 0) + 1,
  };
}

export function startTimer(session) {
  const timeLeft = getEffectiveTimeLeft(session) || session.timerDuration;
  return updateSession(session, {
    timeLeft,
    timerStatus: 'running',
    timerEndAt: Date.now() + timeLeft * 1000,
  });
}

export function pauseTimer(session) {
  return updateSession(session, {
    timeLeft: getEffectiveTimeLeft(session),
    timerStatus: 'paused',
    timerEndAt: null,
  });
}

export function resetTimer(session) {
  return updateSession(session, {
    timeLeft: session.timerDuration,
    timerStatus: 'idle',
    timerEndAt: null,
  });
}

export function nextRound(session) {
  const nextIndex = Math.min((session.roundIndex || 0) + 1, Math.max(0, session.promptOrder.length - 1));
  return updateSession(session, {
    roundIndex: nextIndex,
    revealed: false,
    timeLeft: session.timerDuration,
    timerStatus: 'idle',
    timerEndAt: null,
  });
}

export function previousRound(session) {
  const nextIndex = Math.max(0, (session.roundIndex || 0) - 1);
  return updateSession(session, {
    roundIndex: nextIndex,
    revealed: false,
    timeLeft: session.timerDuration,
    timerStatus: 'idle',
    timerEndAt: null,
  });
}

export function shuffleDeck(session) {
  const prompts = getPromptsByCategory(session.categoryId);
  return updateSession(session, {
    promptOrder: shuffleWithSeed(prompts.map((prompt) => prompt.id), `${session.id}-${Date.now()}`),
    roundIndex: 0,
    revealed: false,
    timeLeft: session.timerDuration,
    timerStatus: 'idle',
    timerEndAt: null,
  });
}

export function setTimerDuration(session, timerDuration) {
  const duration = Math.max(5, Math.min(600, Number(timerDuration) || 60));
  return updateSession(session, {
    timerDuration: duration,
    timeLeft: duration,
    timerStatus: 'idle',
    timerEndAt: null,
  });
}

export function setTeamCount(session, teamCount) {
  return updateSession(session, {
    teamCount: Math.min(4, Math.max(1, Number(teamCount) || 2)),
  });
}

export function setTeamName(session, teamIndex, name) {
  const teamNames = [...session.teamNames];
  teamNames[teamIndex] = String(name || '').slice(0, 18) || DEFAULT_TEAM_NAMES[teamIndex];
  return updateSession(session, { teamNames });
}

export function addPoint(session, teamIndex, amount = 1) {
  const scores = [...session.scores];
  scores[teamIndex] = Math.max(0, (scores[teamIndex] || 0) + amount);
  return updateSession(session, { scores });
}

export function revealAnswer(session) {
  return updateSession(session, { revealed: true });
}

export function hideAnswer(session) {
  return updateSession(session, { revealed: false });
}

export function buildControlUrl(session, categoryId = session?.categoryId) {
  const url = new URL(`/pictionary/control/${session.id}`, window.location.origin);
  url.searchParams.set('category', categoryId);
  return url.toString();
}
