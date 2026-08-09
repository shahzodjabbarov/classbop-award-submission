import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getQuizMatch } from './quizData';

export const CUSTOM_QUIZ_PREFIX = 'custom-';
export const CUSTOM_QUIZ_COLOR = '#FFCB2E';
export const CUSTOM_QUIZ_ACCENT = '#111827';
export const QUIZ_DESCRIPTION_MAX_LENGTH = 100;
export const QUIZ_POINT_OPTIONS = [5, 10, 15];
export const DEFAULT_QUIZ_QUESTION_POINTS = 10;

export function normalizeQuizQuestionPoints(value) {
  const points = Number(value);
  return QUIZ_POINT_OPTIONS.includes(points) ? points : DEFAULT_QUIZ_QUESTION_POINTS;
}

// Shared look for multiple-choice options (builder markers + play screen).
export const QUIZ_CHOICE_STYLES = [
  { symbol: '▲', color: '#EF4444' },
  { symbol: '◆', color: '#3B82F6' },
  { symbol: '●', color: '#F59E0B' },
  { symbol: '■', color: '#22C55E' },
];

// Custom matches fetched from Supabase, cached for the session.
const customMatchCache = new Map();

export function isCustomQuizId(matchId) {
  return typeof matchId === 'string' && matchId.startsWith(CUSTOM_QUIZ_PREFIX);
}

function matchNumberFromQuizId(matchId) {
  return Number(matchId.slice(CUSTOM_QUIZ_PREFIX.length));
}

function normalizeChoices(row) {
  const choices = Array.isArray(row.choices) ? row.choices.filter((choice) => typeof choice === 'string' && choice.trim()) : [];
  const correctChoice = Number.isInteger(row.correct_choice) ? row.correct_choice : -1;
  if (choices.length < 2 || correctChoice < 0 || correctChoice >= choices.length) {
    return { choices: null, correctChoice: null };
  }
  return { choices, correctChoice };
}

function buildCustomMatch(matchNumber, rows) {
  const first = rows[0];

  return {
    id: `${CUSTOM_QUIZ_PREFIX}${matchNumber}`,
    title: first.title,
    subtitle: first.subtitle || '',
    level: 'Custom',
    color: CUSTOM_QUIZ_COLOR,
    accent: CUSTOM_QUIZ_ACCENT,
    thumbnail: rows.find((row) => row.thumbnail)?.thumbnail || '',
    isCustom: true,
    isPublic: first.is_public !== false,
    hashtags: first.hashtags || [],
    authorId: first.author_id,
    questions: rows.map((row) => ({
      question: row.question || '',
      hint: row.hint || '',
      answer: row.answer || '',
      image: row.image || '',
      points: normalizeQuizQuestionPoints(row.points),
      ...normalizeChoices(row),
    })),
  };
}

export async function fetchQuizSet(matchId) {
  const matchNumber = matchNumberFromQuizId(matchId);

  const { data: rows, error } = await supabase
    .from('quiz_items')
    .select('id,title,subtitle,question,hint,answer,image,choices,correct_choice,points,is_public,hashtags,thumbnail,author_id')
    .eq('match_number', matchNumber)
    .order('id', { ascending: true });

  if (error) throw error;
  if (!rows?.length) throw new Error('Quiz not found');

  const match = buildCustomMatch(matchNumber, rows);
  customMatchCache.set(matchId, match);
  return match;
}

export async function fetchQuizSetList() {
  const { data, error } = await supabase
    .from('quiz_items')
    .select('match_number,title,subtitle,author_id,created_at,is_public,hashtags,thumbnail')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const groups = new Map();
  for (const row of data || []) {
    const group = groups.get(row.match_number) || {
      matchNumber: row.match_number,
      title: row.title,
      subtitle: row.subtitle || '',
      authorId: row.author_id,
      isPublic: row.is_public,
      hashtags: row.hashtags || [],
      thumbnail: '',
      count: 0,
    };
    group.count += 1;
    group.thumbnail = group.thumbnail || row.thumbnail || '';
    groups.set(row.match_number, group);
  }

  return [...groups.values()].map((group) => ({
    id: `${CUSTOM_QUIZ_PREFIX}${group.matchNumber}`,
    title: group.title,
    subtitle: group.subtitle,
    level: 'Custom',
    color: CUSTOM_QUIZ_COLOR,
    accent: CUSTOM_QUIZ_ACCENT,
    thumbnail: group.thumbnail,
    isCustom: true,
    isPublic: group.isPublic !== false,
    hashtags: group.hashtags,
    authorId: group.authorId,
    questionCount: group.count,
  }));
}

export async function fetchPopularQuizHashtags() {
  const { data, error } = await supabase
    .from('quiz_items')
    .select('match_number,hashtags')
    .eq('is_public', true);

  if (error) throw error;

  const counts = new Map();
  const seenMatches = new Set();
  for (const row of data || []) {
    if (seenMatches.has(row.match_number)) continue;
    seenMatches.add(row.match_number);
    for (const tag of row.hashtags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

function toQuizRows({ matchNumber, userId, title, subtitle, questions, isPublic, hashtags, thumbnail }) {
  const limitedSubtitle = String(subtitle || '').trim().slice(0, QUIZ_DESCRIPTION_MAX_LENGTH);

  return questions.map((question, index) => ({
    match_number: matchNumber,
    title,
    subtitle: limitedSubtitle,
    question: question.question || '',
    hint: question.hint || '',
    answer: question.answer || '',
    image: question.image || '',
    choices: question.choices?.length ? question.choices : null,
    correct_choice: question.choices?.length ? question.correctChoice : null,
    points: normalizeQuizQuestionPoints(question.points),
    author_id: userId,
    is_public: isPublic,
    hashtags,
    // Stored once (first row) so a large GIF isn't duplicated on every item.
    thumbnail: index === 0 ? thumbnail : '',
  }));
}

export async function createQuizSet({ userId, title, subtitle = '', questions, isPublic = true, hashtags = [], thumbnail = '' }) {
  const matchNumber = Date.now();
  const rows = toQuizRows({ matchNumber, userId, title, subtitle, questions, isPublic, hashtags, thumbnail });

  const { error } = await supabase.from('quiz_items').insert(rows);
  if (error) throw error;

  return `${CUSTOM_QUIZ_PREFIX}${matchNumber}`;
}

export async function updateQuizSet({ matchId, userId, title, subtitle = '', questions, isPublic = true, hashtags = [], thumbnail = '' }) {
  const matchNumber = matchNumberFromQuizId(matchId);

  // RLS only lets the author delete their own rows, so a non-author update
  // fails harmlessly — the UI also guards against this.
  const { error: deleteError } = await supabase
    .from('quiz_items')
    .delete()
    .eq('match_number', matchNumber);

  if (deleteError) throw deleteError;

  const rows = toQuizRows({ matchNumber, userId, title, subtitle, questions, isPublic, hashtags, thumbnail });
  const { error } = await supabase.from('quiz_items').insert(rows);
  if (error) throw error;

  customMatchCache.delete(matchId);
  return matchId;
}

export async function deleteQuizSet(matchId) {
  const matchNumber = matchNumberFromQuizId(matchId);

  const { error } = await supabase
    .from('quiz_items')
    .delete()
    .eq('match_number', matchNumber);

  if (error) throw error;
  customMatchCache.delete(matchId);
}

/**
 * Resolves a match (built-in or custom). Custom quizzes are fetched from
 * Supabase once and cached for the rest of the session.
 */
export function useQuizMatch(matchId) {
  const [, bumpVersion] = useState(0);
  const [missingIds, setMissingIds] = useState(() => new Set());

  useEffect(() => {
    if (!matchId || !isCustomQuizId(matchId) || customMatchCache.has(matchId)) return undefined;

    let isActive = true;
    fetchQuizSet(matchId)
      .then(() => { if (isActive) bumpVersion((version) => version + 1); })
      .catch(() => {
        if (isActive) setMissingIds((previous) => new Set(previous).add(matchId));
      });

    return () => { isActive = false; };
  }, [matchId]);

  const match = !matchId
    ? null
    : (isCustomQuizId(matchId) ? customMatchCache.get(matchId) || null : getQuizMatch(matchId) || null);

  const isLoading = Boolean(matchId && isCustomQuizId(matchId) && !match && !missingIds.has(matchId));
  return { match, isLoading };
}
