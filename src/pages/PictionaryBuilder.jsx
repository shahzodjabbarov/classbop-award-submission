import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useI18n } from '../i18n/useI18n';
import MediaSearchPicker, { SearchIcon } from '../components/MediaSearchPicker';
import { getPromptsByCategory } from '../games/pictionary/pictionaryData';
import {
  createPictionarySet,
  fetchPictionarySet,
  fetchPopularHashtags,
  updatePictionarySet,
} from '../games/pictionary/pictionarySets';
import './Pictionary.css';
import './CreatorTheme.css';

const MAX_IMAGE_DIMENSION = 900;
const MAX_GIF_BYTES = 2.5 * 1024 * 1024;
const MIN_PROMPTS = 2;
const MAX_PROMPTS = 40;
const MAX_HASHTAGS = 6;

const STARTER_HASHTAGS = [
  'movies', 'school', 'animals', 'food', 'sports', 'music', 'travel', 'jobs',
  'science', 'history', 'vocabulary', 'grammar', 'holidays', 'cartoon', 'kpop',
];

function normalizeTag(value) {
  return value
    .replace(/^#+/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .slice(0, 20);
}

function makePromptRow() {
  const key = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return { key, word: '', image: '' };
}

async function fileToResizedDataUrl(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Canvas resizing would freeze a GIF to its first frame, so GIFs are kept
  // as-is (within a size limit) to preserve the animation.
  if (file.type === 'image/gif') {
    if (file.size > MAX_GIF_BYTES) {
      const error = new Error('gif-too-large');
      error.code = 'gif-too-large';
      throw error;
    }
    return dataUrl;
  }

  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = dataUrl;
  });

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
  if (scale >= 1 && file.size < 200 * 1024) return dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

  const usePng = file.type === 'image/png';
  return canvas.toDataURL(usePng ? 'image/png' : 'image/jpeg', 0.85);
}

export default function PictionaryBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const isEditing = Boolean(categoryId);
  const { t } = useI18n();
  const [isLoadingSet, setIsLoadingSet] = useState(isEditing);
  const [ownerId, setOwnerId] = useState(null);
  const [title, setTitle] = useState('');
  const [prompts, setPrompts] = useState(() => [makePromptRow(), makePromptRow(), makePromptRow()]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragOverKey, setDragOverKey] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [popularTags, setPopularTags] = useState(STARTER_HASHTAGS);
  const [thumbnail, setThumbnail] = useState('');
  const [mediaSearchTarget, setMediaSearchTarget] = useState(null);
  const thumbnailInputRef = useRef(null);
  const fileInputRefs = useRef({});
  const activeRowKeyRef = useRef(null);
  const assignImageRef = useRef(null);

  const updatePrompt = (key, field, value) => {
    setPrompts((rows) => rows.map((row) => row.key === key ? { ...row, [field]: value } : row));
  };

  const openMediaSearch = (target) => {
    setMediaSearchTarget(target);
  };

  const handleMediaSelect = (item) => {
    if (mediaSearchTarget?.type === 'thumbnail') {
      setThumbnail(item.url);
    } else if (mediaSearchTarget?.key) {
      setPrompts((rows) => rows.map((row) => {
        if (row.key !== mediaSearchTarget.key) return row;
        return {
          ...row,
          image: item.url,
          word: row.word.trim() ? row.word : item.title.slice(0, 40),
        };
      }));
    }
    setMediaSearchTarget(null);
    setError('');
  };

  const addPrompt = () => {
    setPrompts((rows) => rows.length >= MAX_PROMPTS ? rows : [...rows, makePromptRow()]);
  };

  const removePrompt = (key) => {
    setPrompts((rows) => rows.length <= 1 ? rows : rows.filter((row) => row.key !== key));
    if (activeRowKeyRef.current === key) activeRowKeyRef.current = null;
  };

  const imageErrorMessage = (imageError) =>
    imageError?.code === 'gif-too-large'
      ? t('pictionary.builder.gifTooLarge')
      : t('pictionary.builder.imageFailed');

  const handleThumbnailPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type?.startsWith('image/')) return;

    try {
      setThumbnail(await fileToResizedDataUrl(file));
      setError('');
    } catch (imageError) {
      setError(imageErrorMessage(imageError));
    }
  };

  // Assigns an image file to a specific row, or (when no row is targeted)
  // to the first row without an image, or a brand-new row.
  const assignImageFile = async (key, file) => {
    if (!file || !file.type?.startsWith('image/')) return;

    try {
      const image = await fileToResizedDataUrl(file);
      setPrompts((rows) => {
        if (key && rows.some((row) => row.key === key)) {
          return rows.map((row) => row.key === key ? { ...row, image } : row);
        }
        const emptyRow = rows.find((row) => !row.image);
        if (emptyRow) {
          return rows.map((row) => row.key === emptyRow.key ? { ...row, image } : row);
        }
        if (rows.length >= MAX_PROMPTS) return rows;
        return [...rows, { ...makePromptRow(), image }];
      });
    } catch (imageError) {
      setError(imageErrorMessage(imageError));
    }
  };
  useEffect(() => {
    assignImageRef.current = assignImageFile;
  });

  useEffect(() => {
    const handlePaste = (event) => {
      const items = event.clipboardData?.items || [];
      for (const item of items) {
        if (item.type?.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            assignImageRef.current?.(activeRowKeyRef.current, file);
          }
          return;
        }
      }
    };

    // Stops the browser from opening the file when a drop misses a row.
    const preventWindowDrop = (event) => event.preventDefault();

    window.addEventListener('paste', handlePaste);
    window.addEventListener('dragover', preventWindowDrop);
    window.addEventListener('drop', preventWindowDrop);
    return () => {
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('dragover', preventWindowDrop);
      window.removeEventListener('drop', preventWindowDrop);
    };
  }, []);

  const handleImagePick = async (key, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    assignImageFile(key, file);
  };

  // Loads the existing game when editing.
  useEffect(() => {
    if (!isEditing) return undefined;

    let isActive = true;
    fetchPictionarySet(categoryId)
      .then((category) => {
        if (!isActive) return;
        const existingRows = getPromptsByCategory(categoryId).map((prompt) => ({
          ...makePromptRow(),
          word: prompt.word,
          image: prompt.image || '',
        }));
        setTitle(category.name || '');
        setIsPublic(category.isPublic !== false);
        setTags(category.hashtags || []);
        setThumbnail(category.thumbnail || '');
        setOwnerId(category.authorId || null);
        setPrompts(existingRows.length ? existingRows : [makePromptRow()]);
        setIsLoadingSet(false);
      })
      .catch(() => {
        if (!isActive) return;
        setError(t('pictionary.builder.loadFailed'));
        setIsLoadingSet(false);
      });

    return () => { isActive = false; };
  }, [categoryId, isEditing, t]);

  useEffect(() => {
    let isActive = true;
    fetchPopularHashtags()
      .then((fetched) => {
        if (!isActive) return;
        const merged = [...fetched, ...STARTER_HASHTAGS.filter((tag) => !fetched.includes(tag))];
        setPopularTags(merged);
      })
      .catch(() => { /* starter list is fine */ });
    return () => { isActive = false; };
  }, []);

  const addTag = (value) => {
    const tag = normalizeTag(value);
    if (!tag) return;
    setTags((currentTags) => currentTags.includes(tag) || currentTags.length >= MAX_HASHTAGS
      ? currentTags
      : [...currentTags, tag]);
    setTagInput('');
  };

  const removeTag = (tag) => {
    setTags((currentTags) => currentTags.filter((currentTag) => currentTag !== tag));
  };

  const tagQuery = normalizeTag(tagInput);
  const tagSuggestions = tagQuery
    ? popularTags
        .filter((tag) => tag.startsWith(tagQuery) && !tags.includes(tag))
        .slice(0, 6)
    : [];

  const handleSave = async () => {
    if (!user) {
      navigate('/auth?mode=login&next=/pictionary/create');
      return;
    }

    if (isEditing && ownerId && ownerId !== user.id) {
      setError(t('pictionary.builder.notOwner'));
      return;
    }

    const cleanPrompts = prompts
      .map((row) => ({ word: row.word.trim(), image: row.image }))
      .filter((row) => row.word);

    if (!title.trim() || cleanPrompts.length < MIN_PROMPTS) {
      setError(t('pictionary.builder.validation', { min: MIN_PROMPTS }));
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const payload = {
        userId: user.id,
        title: title.trim().slice(0, 60),
        prompts: cleanPrompts,
        isPublic,
        hashtags: tags,
        thumbnail,
      };
      const savedCategoryId = isEditing
        ? await updatePictionarySet({ ...payload, categoryId })
        : await createPictionarySet(payload);
      navigate(`/pictionary/${savedCategoryId}`);
    } catch (saveError) {
      setError(t('pictionary.builder.saveFailed', { message: saveError.message }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pictionary-page pictionary-creator-page creator-page">
      <header className="pictionary-compact-header">
        <Link className="pictionary-back-link" to="/pictionary">{t('pictionary.mode.back')}</Link>
        <div>
          <p className="pictionary-kicker">{t('pictionary.builder.kicker')}</p>
          <h1>{isEditing ? t('pictionary.builder.editTitle') : t('pictionary.builder.title')}</h1>
        </div>
      </header>

      {isLoadingSet ? (
        <main className="pictionary-builder">
          <p className="pictionary-muted" style={{ textAlign: 'center' }}>{t('common.loading')}</p>
        </main>
      ) : (
      <main className="pictionary-builder">
        <section className="pictionary-builder-panel">
          <label className="pictionary-builder-field">
            <span>{t('pictionary.builder.gameTitleLabel')}</span>
            <input
              value={title}
              maxLength={60}
              placeholder={t('pictionary.builder.gameTitlePlaceholder')}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <div className="pictionary-builder-field">
            <span>{t('pictionary.builder.thumbnailLabel')}</span>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleThumbnailPick}
            />
            {thumbnail ? (
              <div className="pictionary-builder-banner-actions">
                <button
                  type="button"
                  className="pictionary-builder-thumb banner"
                  onClick={() => setThumbnail('')}
                  title={t('pictionary.builder.removeImage')}
                >
                  <img src={thumbnail} alt="" />
                  <i>×</i>
                </button>
                <button
                  type="button"
                  className="pictionary-builder-search-button"
                  onClick={() => openMediaSearch({ type: 'thumbnail', query: title })}
                  title="Search images and GIFs"
                  aria-label="Search images and GIFs"
                >
                  <SearchIcon />
                </button>
              </div>
            ) : (
              <div className="pictionary-builder-banner-actions">
                <button
                  type="button"
                  className="pictionary-builder-upload banner"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  {t('pictionary.builder.addThumbnail')}
                </button>
                <button
                  type="button"
                  className="pictionary-builder-search-button"
                  onClick={() => openMediaSearch({ type: 'thumbnail', query: title })}
                  title="Search images and GIFs"
                  aria-label="Search images and GIFs"
                >
                  <SearchIcon />
                </button>
              </div>
            )}
          </div>

          <p className="pictionary-builder-label">{t('pictionary.builder.promptsLabel')}</p>
          <p className="pictionary-builder-hint">{t('pictionary.builder.pasteHint')}</p>

          <div className="pictionary-builder-rows">
            {prompts.map((row, index) => (
              <div
                key={row.key}
                className={`pictionary-builder-row ${dragOverKey === row.key ? 'is-dragover' : ''}`}
                onClick={() => { activeRowKeyRef.current = row.key; }}
                onFocusCapture={() => { activeRowKeyRef.current = row.key; }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverKey(row.key);
                }}
                onDragLeave={() => {
                  setDragOverKey((currentKey) => currentKey === row.key ? null : currentKey);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOverKey(null);
                  assignImageFile(row.key, event.dataTransfer.files?.[0]);
                }}
              >
                <span className="pictionary-builder-index">{index + 1}</span>
                <input
                  value={row.word}
                  maxLength={40}
                  placeholder={t('pictionary.builder.wordPlaceholder')}
                  onChange={(event) => updatePrompt(row.key, 'word', event.target.value)}
                />
                <input
                  ref={(element) => { fileInputRefs.current[row.key] = element; }}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => handleImagePick(row.key, event)}
                />
                <div className="pictionary-builder-media-actions">
                  {row.image ? (
                    <button
                      type="button"
                      className="pictionary-builder-thumb"
                      onClick={() => updatePrompt(row.key, 'image', '')}
                      title={t('pictionary.builder.removeImage')}
                    >
                      <img src={row.image} alt="" />
                      <i>×</i>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="pictionary-builder-upload"
                      onClick={() => fileInputRefs.current[row.key]?.click()}
                    >
                      {t('pictionary.builder.addImage')}
                    </button>
                  )}
                  <button
                    type="button"
                    className="pictionary-builder-search-button"
                    onClick={() => openMediaSearch({ type: 'prompt', key: row.key, query: row.word })}
                    title="Search images and GIFs"
                    aria-label="Search images and GIFs"
                  >
                    <SearchIcon />
                  </button>
                </div>
                <button
                  type="button"
                  className="pictionary-builder-remove"
                  onClick={() => removePrompt(row.key)}
                  disabled={prompts.length <= 1}
                  aria-label={t('pictionary.builder.removePrompt')}
                >
                  −
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="pictionary-builder-add"
            onClick={addPrompt}
            disabled={prompts.length >= MAX_PROMPTS}
          >
            + {t('pictionary.builder.addPrompt')}
          </button>

          <div className="pictionary-builder-options">
            <div>
              <p className="pictionary-builder-label">{t('pictionary.builder.visibilityLabel')}</p>
              <div className="pictionary-visibility-toggle">
                <button
                  type="button"
                  className={isPublic ? 'selected' : ''}
                  onClick={() => setIsPublic(true)}
                >
                  🌍 {t('pictionary.builder.public')}
                </button>
                <button
                  type="button"
                  className={!isPublic ? 'selected' : ''}
                  onClick={() => setIsPublic(false)}
                >
                  🔒 {t('pictionary.builder.private')}
                </button>
              </div>
              <p className="pictionary-builder-hint">
                {isPublic ? t('pictionary.builder.publicHint') : t('pictionary.builder.privateHint')}
              </p>
            </div>

            <div>
              <p className="pictionary-builder-label">{t('pictionary.builder.hashtagsLabel')}</p>
              <div className="pictionary-tag-box">
                {tags.map((tag) => (
                  <span key={tag} className="pictionary-tag-chip">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label={t('pictionary.builder.removeTag')}>×</button>
                  </span>
                ))}
                {tags.length < MAX_HASHTAGS && (
                  <input
                    value={tagInput}
                    placeholder={t('pictionary.builder.hashtagPlaceholder')}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        addTag(tagInput);
                      } else if (event.key === 'Backspace' && !tagInput && tags.length) {
                        removeTag(tags[tags.length - 1]);
                      }
                    }}
                  />
                )}
              </div>
              {tagSuggestions.length > 0 && (
                <div className="pictionary-tag-suggestions">
                  {tagSuggestions.map((tag) => (
                    <button key={tag} type="button" onClick={() => addTag(tag)}>#{tag}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="pictionary-builder-error">{error}</p>}

          <button
            type="button"
            className="pictionary-button pictionary-builder-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t('common.saving') : t('pictionary.builder.save')}
          </button>
        </section>
      </main>
      )}
      {mediaSearchTarget && (
        <MediaSearchPicker
          title="Search Images & GIFs"
          initialQuery={mediaSearchTarget.query || title}
          onClose={() => setMediaSearchTarget(null)}
          onSelect={handleMediaSelect}
        />
      )}
    </div>
  );
}
