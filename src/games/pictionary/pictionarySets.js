import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  getCachedCustomCategory,
  getPictionaryCategory,
  registerCustomPictionarySet,
  unregisterCustomPictionarySet,
} from './pictionaryData';

export const CUSTOM_CATEGORY_PREFIX = 'custom-';
export const CUSTOM_SET_COLOR = '#B78BFF';
export const CUSTOM_SET_ACCENT = '#F1E8FF';
export const CUSTOM_SET_ICON = '🎨';

export function isCustomCategoryId(categoryId) {
  return typeof categoryId === 'string' && categoryId.startsWith(CUSTOM_CATEGORY_PREFIX);
}

function matchNumberFromCategoryId(categoryId) {
  return Number(categoryId.slice(CUSTOM_CATEGORY_PREFIX.length));
}

function pad(value, length = 3) {
  return String(value).padStart(length, '0');
}

function buildCategory(matchNumber, title, promptCount, extra = {}) {
  return {
    id: `${CUSTOM_CATEGORY_PREFIX}${matchNumber}`,
    name: title,
    icon: CUSTOM_SET_ICON,
    color: CUSTOM_SET_COLOR,
    accent: CUSTOM_SET_ACCENT,
    description: '',
    promptCount,
    isCustom: true,
    isPublic: extra.isPublic !== false,
    hashtags: extra.hashtags || [],
    thumbnail: extra.thumbnail || '',
  };
}

export async function fetchPictionarySet(categoryId) {
  const matchNumber = matchNumberFromCategoryId(categoryId);

  const { data: items, error } = await supabase
    .from('pictionary_items')
    .select('id,title,word,image,is_public,hashtags,thumbnail,author_id')
    .eq('match_number', matchNumber)
    .order('id', { ascending: true });

  if (error) throw error;
  if (!items?.length) throw new Error('Pictionary set not found');

  const title = items[0].title;
  const prompts = items.map((item, index) => ({
    id: `${categoryId}-${pad(index + 1)}`,
    cardId: `C${pad(index + 1, 2)}`,
    category: title,
    categoryId,
    word: item.word || '',
    image: item.image || '',
    difficulty: 'custom',
  }));

  const category = {
    ...buildCategory(matchNumber, title, prompts.length, {
      isPublic: items[0].is_public,
      hashtags: items[0].hashtags || [],
      thumbnail: items.find((item) => item.thumbnail)?.thumbnail || '',
    }),
    authorId: items[0].author_id,
  };
  registerCustomPictionarySet(category, prompts);
  return category;
}

export async function fetchPictionarySetList() {
  const { data, error } = await supabase
    .from('pictionary_items')
    .select('match_number,title,author_id,created_at,is_public,hashtags,thumbnail')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const groups = new Map();
  for (const row of data || []) {
    const group = groups.get(row.match_number) || {
      matchNumber: row.match_number,
      title: row.title,
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
    ...buildCategory(group.matchNumber, group.title, group.count, {
      isPublic: group.isPublic,
      hashtags: group.hashtags,
      thumbnail: group.thumbnail,
    }),
    authorId: group.authorId,
  }));
}

export async function fetchPopularHashtags() {
  const { data, error } = await supabase
    .from('pictionary_items')
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

export async function createPictionarySet({ userId, title, prompts, isPublic = true, hashtags = [], thumbnail = '' }) {
  const matchNumber = Date.now();

  const rows = prompts.map((prompt, index) => ({
    match_number: matchNumber,
    title,
    word: prompt.word,
    image: prompt.image || '',
    author_id: userId,
    is_public: isPublic,
    hashtags,
    // Stored once (first row) so a large GIF isn't duplicated on every item.
    thumbnail: index === 0 ? thumbnail : '',
  }));

  const { error } = await supabase.from('pictionary_items').insert(rows);
  if (error) throw error;

  return `${CUSTOM_CATEGORY_PREFIX}${matchNumber}`;
}

export async function updatePictionarySet({ categoryId, userId, title, prompts, isPublic = true, hashtags = [], thumbnail = '' }) {
  const matchNumber = matchNumberFromCategoryId(categoryId);

  // RLS only lets the author delete their own rows, so a non-author update
  // fails harmlessly (nothing deleted, insert rejected below is their own rows
  // under a fresh author) — the UI also guards against this.
  const { error: deleteError } = await supabase
    .from('pictionary_items')
    .delete()
    .eq('match_number', matchNumber);

  if (deleteError) throw deleteError;

  const rows = prompts.map((prompt, index) => ({
    match_number: matchNumber,
    title,
    word: prompt.word,
    image: prompt.image || '',
    author_id: userId,
    is_public: isPublic,
    hashtags,
    thumbnail: index === 0 ? thumbnail : '',
  }));

  const { error } = await supabase.from('pictionary_items').insert(rows);
  if (error) throw error;

  unregisterCustomPictionarySet(categoryId);
  return categoryId;
}

export async function deletePictionarySet(categoryId) {
  const matchNumber = matchNumberFromCategoryId(categoryId);

  const { error } = await supabase
    .from('pictionary_items')
    .delete()
    .eq('match_number', matchNumber);

  if (error) throw error;
  unregisterCustomPictionarySet(categoryId);
}

/**
 * Resolves a category (built-in or custom). Custom sets are fetched from
 * Supabase once and cached for the rest of the session.
 */
export function usePictionaryCategory(categoryId) {
  const [status, setStatus] = useState(() => {
    if (!isCustomCategoryId(categoryId)) return 'ready';
    return getCachedCustomCategory(categoryId) ? 'ready' : 'loading';
  });

  useEffect(() => {
    let statusTimer = null;
    const updateStatusSoon = (nextStatus) => {
      statusTimer = window.setTimeout(() => setStatus(nextStatus), 0);
    };

    if (!isCustomCategoryId(categoryId)) {
      updateStatusSoon('ready');
      return () => window.clearTimeout(statusTimer);
    }

    if (getCachedCustomCategory(categoryId)) {
      updateStatusSoon('ready');
      return () => window.clearTimeout(statusTimer);
    }

    let isActive = true;
    updateStatusSoon('loading');
    fetchPictionarySet(categoryId)
      .then(() => { if (isActive) setStatus('ready'); })
      .catch(() => { if (isActive) setStatus('missing'); });

    return () => {
      isActive = false;
      window.clearTimeout(statusTimer);
    };
  }, [categoryId]);

  const category = getPictionaryCategory(categoryId) || null;
  return { category, isLoading: status === 'loading' && !category };
}
