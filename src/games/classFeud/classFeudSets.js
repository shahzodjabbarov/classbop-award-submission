import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getFeudBoard } from './classFeudData';

export const CUSTOM_FEUD_PREFIX = 'custom-';
export const CUSTOM_FEUD_COLOR = '#FFCB2E';
export const CUSTOM_FEUD_ACCENT = '#111827';
export const FEUD_DESCRIPTION_MAX_LENGTH = 100;
export const MIN_FEUD_ANSWERS = 1;
export const MAX_FEUD_ANSWERS = 10;
export const MIN_FEUD_ROUNDS = 1;
export const MAX_FEUD_ROUNDS = 20;
export const DEFAULT_ANSWER_POINTS = 10;

const FEUD_EMOJIS = ['🎪', '🎯', '🎲', '🎊', '🔥', '⭐', '🎈', '🍀'];

/** Custom boards fetched from Supabase, cached for the session. */
const customBoardCache = new Map();

export function isCustomFeudId(boardId) {
  return typeof boardId === 'string' && boardId.startsWith(CUSTOM_FEUD_PREFIX);
}

function boardNumberFromFeudId(boardId) {
  return Number(boardId.slice(CUSTOM_FEUD_PREFIX.length));
}

/** Gives every custom board a stable cover emoji without storing one. */
export function feudEmojiForId(boardId) {
  const seed = String(boardId || '')
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0);
  return FEUD_EMOJIS[seed % FEUD_EMOJIS.length];
}

export function normalizeAnswerPoints(value) {
  const points = Math.round(Number(value));
  if (!Number.isFinite(points)) return DEFAULT_ANSWER_POINTS;
  return Math.min(99, Math.max(1, points));
}

/**
 * Answers are stored as jsonb. Anything malformed is dropped rather than
 * crashing the board — a round with no usable answers is filtered out later.
 */
function normalizeAnswers(value) {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map((row) => ({
      text: String(row?.text || '').trim(),
      points: normalizeAnswerPoints(row?.points),
      aliases: Array.isArray(row?.aliases)
        ? row.aliases.map((alias) => String(alias).trim()).filter(Boolean)
        : [],
    }))
    .filter((row) => row.text)
    .slice(0, MAX_FEUD_ANSWERS);
}

function buildCustomBoard(boardNumber, rows) {
  const first = rows[0];
  const id = `${CUSTOM_FEUD_PREFIX}${boardNumber}`;

  return {
    id,
    title: first.title,
    subtitle: first.subtitle || '',
    level: 'Custom',
    emoji: feudEmojiForId(id),
    color: CUSTOM_FEUD_COLOR,
    accent: CUSTOM_FEUD_ACCENT,
    thumbnail: rows.find((row) => row.thumbnail)?.thumbnail || '',
    isCustom: true,
    isPublic: first.is_public !== false,
    hashtags: first.hashtags || [],
    authorId: first.author_id,
    rounds: rows
      .map((row) => ({
        prompt: row.prompt || '',
        image: row.image || '',
        answers: normalizeAnswers(row.answers),
      }))
      .filter((round) => round.answers.length > 0),
  };
}

export async function fetchFeudBoard(boardId) {
  const boardNumber = boardNumberFromFeudId(boardId);

  const { data: rows, error } = await supabase
    .from('feud_items')
    .select('id,title,subtitle,prompt,image,answers,is_public,hashtags,thumbnail,author_id')
    .eq('board_number', boardNumber)
    .order('id', { ascending: true });

  if (error) throw error;
  if (!rows?.length) throw new Error('Class Feud board not found');

  const board = buildCustomBoard(boardNumber, rows);
  customBoardCache.set(boardId, board);
  return board;
}

export async function fetchFeudBoardList() {
  const { data, error } = await supabase
    .from('feud_items')
    .select('board_number,title,subtitle,author_id,created_at,is_public,hashtags,thumbnail')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const groups = new Map();
  for (const row of data || []) {
    const group = groups.get(row.board_number) || {
      boardNumber: row.board_number,
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
    groups.set(row.board_number, group);
  }

  return [...groups.values()].map((group) => {
    const id = `${CUSTOM_FEUD_PREFIX}${group.boardNumber}`;
    return {
      id,
      title: group.title,
      subtitle: group.subtitle,
      level: 'Custom',
      emoji: feudEmojiForId(id),
      color: CUSTOM_FEUD_COLOR,
      accent: CUSTOM_FEUD_ACCENT,
      thumbnail: group.thumbnail,
      isCustom: true,
      isPublic: group.isPublic !== false,
      hashtags: group.hashtags,
      authorId: group.authorId,
      roundCount: group.count,
    };
  });
}

export async function fetchPopularFeudHashtags() {
  const { data, error } = await supabase
    .from('feud_items')
    .select('board_number,hashtags')
    .eq('is_public', true);

  if (error) throw error;

  const counts = new Map();
  const seenBoards = new Set();
  for (const row of data || []) {
    if (seenBoards.has(row.board_number)) continue;
    seenBoards.add(row.board_number);
    for (const tag of row.hashtags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

function toFeudRows({ boardNumber, userId, title, subtitle, rounds, isPublic, hashtags, thumbnail }) {
  const limitedSubtitle = String(subtitle || '').trim().slice(0, FEUD_DESCRIPTION_MAX_LENGTH);

  return rounds.map((round, index) => ({
    board_number: boardNumber,
    title,
    subtitle: limitedSubtitle,
    prompt: round.prompt || '',
    image: round.image || '',
    answers: normalizeAnswers(round.answers),
    author_id: userId,
    is_public: isPublic,
    hashtags,
    // Stored once (first row) so a large GIF isn't duplicated on every round.
    thumbnail: index === 0 ? thumbnail : '',
  }));
}

export async function createFeudBoard({ userId, title, subtitle = '', rounds, isPublic = true, hashtags = [], thumbnail = '' }) {
  const boardNumber = Date.now();
  const rows = toFeudRows({ boardNumber, userId, title, subtitle, rounds, isPublic, hashtags, thumbnail });

  const { error } = await supabase.from('feud_items').insert(rows);
  if (error) throw error;

  return `${CUSTOM_FEUD_PREFIX}${boardNumber}`;
}

export async function updateFeudBoard({ boardId, userId, title, subtitle = '', rounds, isPublic = true, hashtags = [], thumbnail = '' }) {
  const boardNumber = boardNumberFromFeudId(boardId);

  // RLS only lets the author delete their own rows, so a non-author update
  // fails harmlessly — the UI also guards against this.
  const { error: deleteError } = await supabase
    .from('feud_items')
    .delete()
    .eq('board_number', boardNumber);

  if (deleteError) throw deleteError;

  const rows = toFeudRows({ boardNumber, userId, title, subtitle, rounds, isPublic, hashtags, thumbnail });
  const { error } = await supabase.from('feud_items').insert(rows);
  if (error) throw error;

  customBoardCache.delete(boardId);
  return boardId;
}

export async function deleteFeudBoard(boardId) {
  const boardNumber = boardNumberFromFeudId(boardId);

  const { error } = await supabase
    .from('feud_items')
    .delete()
    .eq('board_number', boardNumber);

  if (error) throw error;
  customBoardCache.delete(boardId);
}

/**
 * Resolves a board (built-in or custom). Custom boards are fetched from
 * Supabase once and cached for the rest of the session.
 */
export function useFeudBoard(boardId) {
  const [, bumpVersion] = useState(0);
  const [missingIds, setMissingIds] = useState(() => new Set());

  useEffect(() => {
    if (!boardId || !isCustomFeudId(boardId) || customBoardCache.has(boardId)) return undefined;

    let isActive = true;
    fetchFeudBoard(boardId)
      .then(() => { if (isActive) bumpVersion((version) => version + 1); })
      .catch(() => {
        if (isActive) setMissingIds((previous) => new Set(previous).add(boardId));
      });

    return () => { isActive = false; };
  }, [boardId]);

  const board = !boardId
    ? null
    : (isCustomFeudId(boardId) ? customBoardCache.get(boardId) || null : getFeudBoard(boardId) || null);

  const isLoading = Boolean(boardId && isCustomFeudId(boardId) && !board && !missingIds.has(boardId));
  return { board, isLoading };
}
