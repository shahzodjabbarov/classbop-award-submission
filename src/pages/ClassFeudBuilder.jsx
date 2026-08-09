import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import MediaSearchPicker, { SearchIcon } from '../components/MediaSearchPicker';
import {
  DEFAULT_ANSWER_POINTS,
  FEUD_DESCRIPTION_MAX_LENGTH,
  MAX_FEUD_ANSWERS,
  MAX_FEUD_ROUNDS,
  MIN_FEUD_ROUNDS,
  createFeudBoard,
  fetchFeudBoard,
  fetchPopularFeudHashtags,
  normalizeAnswerPoints,
  updateFeudBoard,
} from '../games/classFeud/classFeudSets';
import './ClassFeud.css';
import './CreatorTheme.css';

const MAX_IMAGE_DIMENSION = 900;
const MAX_GIF_BYTES = 2.5 * 1024 * 1024;
const MAX_HASHTAGS = 6;
const STARTER_ANSWER_ROWS = 5;

const STARTER_HASHTAGS = [
  'school', 'food', 'animals', 'family', 'travel', 'sports', 'movies', 'music',
  'holidays', 'jobs', 'technology', 'korea', 'vocabulary', 'warm-up',
];

function normalizeTag(value) {
  return value
    .replace(/^#+/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .slice(0, 20);
}

function makeKey(prefix) {
  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeAnswerRow(points = DEFAULT_ANSWER_POINTS) {
  return { key: makeKey('answer'), text: '', points, aliases: '' };
}

function makeRoundCard() {
  return {
    key: makeKey('round'),
    prompt: '',
    image: '',
    // A typical survey board has five answers; teachers add or drop from there.
    answers: Array.from({ length: STARTER_ANSWER_ROWS }, () => makeAnswerRow()),
  };
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

  return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.5-3.5a1.4 1.4 0 0 0-2 0L6 21" />
    </svg>
  );
}

function filledAnswers(round) {
  return round.answers.filter((answer) => answer.text.trim());
}

function isRoundEmpty(round) {
  return !round.prompt.trim() && !round.image && filledAnswers(round).length === 0;
}

/** Empty string means the round is complete and playable. */
function roundProblem(round) {
  if (!round.prompt.trim() && !round.image) return 'Add a question or a picture';
  if (filledAnswers(round).length === 0) return 'Add at least one answer';
  return '';
}

export default function ClassFeudBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { boardId } = useParams();
  const isEditing = Boolean(boardId);

  const [isLoadingBoard, setIsLoadingBoard] = useState(isEditing);
  const [ownerId, setOwnerId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rounds, setRounds] = useState(() => [makeRoundCard(), makeRoundCard()]);
  const [thumbnail, setThumbnail] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [popularTags, setPopularTags] = useState(STARTER_HASHTAGS);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragOverKey, setDragOverKey] = useState(null);
  const [mediaSearchTarget, setMediaSearchTarget] = useState(null);

  const thumbnailInputRef = useRef(null);
  const fileInputRefs = useRef({});

  const updateRound = (key, patch) => {
    setRounds((previous) => previous.map((round) => (round.key === key ? { ...round, ...patch } : round)));
  };

  const updateAnswer = (roundKey, answerKey, patch) => {
    setRounds((previous) => previous.map((round) => (round.key === roundKey
      ? {
        ...round,
        answers: round.answers.map((answer) => (answer.key === answerKey ? { ...answer, ...patch } : answer)),
      }
      : round)));
  };

  const addAnswer = (roundKey) => {
    setRounds((previous) => previous.map((round) => (round.key === roundKey && round.answers.length < MAX_FEUD_ANSWERS
      ? { ...round, answers: [...round.answers, makeAnswerRow()] }
      : round)));
  };

  const removeAnswer = (roundKey, answerKey) => {
    setRounds((previous) => previous.map((round) => (round.key === roundKey && round.answers.length > 1
      ? { ...round, answers: round.answers.filter((answer) => answer.key !== answerKey) }
      : round)));
  };

  const addRound = () => {
    setRounds((previous) => (previous.length >= MAX_FEUD_ROUNDS ? previous : [...previous, makeRoundCard()]));
  };

  const removeRound = (key) => {
    setRounds((previous) => (previous.length <= 1 ? previous : previous.filter((round) => round.key !== key)));
  };

  const imageErrorMessage = (imageError) => (imageError?.code === 'gif-too-large'
    ? 'That GIF is too big (max 2.5MB). Try a smaller one.'
    : 'That image could not be read. Try a different file.');

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

  const assignImageFile = async (key, file) => {
    if (!file || !file.type?.startsWith('image/')) return;

    try {
      const image = await fileToResizedDataUrl(file);
      updateRound(key, { image });
      setError('');
    } catch (imageError) {
      setError(imageErrorMessage(imageError));
    }
  };

  const handleMediaSelect = (item) => {
    if (mediaSearchTarget?.type === 'thumbnail') {
      setThumbnail(item.url);
    } else if (mediaSearchTarget?.key) {
      setRounds((previous) => previous.map((round) => (round.key === mediaSearchTarget.key
        ? { ...round, image: item.url }
        : round)));
    }
    setMediaSearchTarget(null);
    setError('');
  };

  // Stops the browser from opening a dropped file when the drop misses a card.
  useEffect(() => {
    const preventWindowDrop = (event) => event.preventDefault();
    window.addEventListener('dragover', preventWindowDrop);
    window.addEventListener('drop', preventWindowDrop);
    return () => {
      window.removeEventListener('dragover', preventWindowDrop);
      window.removeEventListener('drop', preventWindowDrop);
    };
  }, []);

  // Loads the existing board when editing.
  useEffect(() => {
    if (!isEditing) return undefined;

    let isActive = true;
    fetchFeudBoard(boardId)
      .then((board) => {
        if (!isActive) return;
        setTitle(board.title || '');
        setDescription(String(board.subtitle || '').slice(0, FEUD_DESCRIPTION_MAX_LENGTH));
        setIsPublic(board.isPublic !== false);
        setTags(board.hashtags || []);
        setThumbnail(board.thumbnail || '');
        setOwnerId(board.authorId || null);
        setRounds(board.rounds.length
          ? board.rounds.map((round) => ({
            key: makeKey('round'),
            prompt: round.prompt || '',
            image: round.image || '',
            answers: round.answers.map((answer) => ({
              key: makeKey('answer'),
              text: answer.text,
              points: answer.points,
              aliases: (answer.aliases || []).join(', '),
            })),
          }))
          : [makeRoundCard()]);
        setIsLoadingBoard(false);
      })
      .catch(() => {
        if (!isActive) return;
        setError('Could not load that board. It may have been deleted.');
        setIsLoadingBoard(false);
      });

    return () => { isActive = false; };
  }, [boardId, isEditing]);

  useEffect(() => {
    let isActive = true;
    fetchPopularFeudHashtags()
      .then((fetched) => {
        if (!isActive) return;
        setPopularTags([...fetched, ...STARTER_HASHTAGS.filter((tag) => !fetched.includes(tag))]);
      })
      .catch(() => { /* the starter list is fine */ });
    return () => { isActive = false; };
  }, []);

  const addTag = (value) => {
    const tag = normalizeTag(value);
    if (!tag) return;
    setTags((current) => (current.includes(tag) || current.length >= MAX_HASHTAGS ? current : [...current, tag]));
    setTagInput('');
  };

  const removeTag = (tag) => setTags((current) => current.filter((row) => row !== tag));

  const tagQuery = normalizeTag(tagInput);
  const tagSuggestions = tagQuery
    ? popularTags.filter((tag) => tag.startsWith(tagQuery) && !tags.includes(tag)).slice(0, 6)
    : [];

  const readyCount = rounds.filter((round) => !isRoundEmpty(round) && !roundProblem(round)).length;

  const handleSave = async () => {
    if (!user) {
      navigate('/auth?mode=login&next=/class-feud/create');
      return;
    }

    if (isEditing && ownerId && ownerId !== user.id) {
      setError('Only the board owner can edit this board.');
      return;
    }

    if (!title.trim()) {
      setError('Give your board a title first.');
      return;
    }

    const brokenIndex = rounds.findIndex((round) => !isRoundEmpty(round) && roundProblem(round));
    if (brokenIndex !== -1) {
      setError(`Round ${brokenIndex + 1}: ${roundProblem(rounds[brokenIndex])}.`);
      return;
    }

    const cleanRounds = rounds
      .filter((round) => !isRoundEmpty(round))
      .map((round) => ({
        prompt: round.prompt.trim(),
        image: round.image,
        answers: filledAnswers(round).map((answer) => ({
          text: answer.text.trim(),
          points: normalizeAnswerPoints(answer.points),
          aliases: answer.aliases
            .split(',')
            .map((alias) => alias.trim())
            .filter(Boolean),
        })),
      }));

    if (cleanRounds.length < MIN_FEUD_ROUNDS) {
      setError(`Add at least ${MIN_FEUD_ROUNDS} finished round.`);
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const payload = {
        userId: user.id,
        title: title.trim().slice(0, 60),
        subtitle: description.trim().slice(0, FEUD_DESCRIPTION_MAX_LENGTH),
        rounds: cleanRounds,
        isPublic,
        hashtags: tags,
        thumbnail,
      };
      const savedId = isEditing
        ? await updateFeudBoard({ ...payload, boardId })
        : await createFeudBoard(payload);
      navigate(`/class-feud/${savedId}`);
    } catch (saveError) {
      const missingTable = saveError.message?.includes("Could not find the table 'public.feud_items'")
        || saveError.code === 'PGRST205';
      setError(missingTable
        ? 'Could not save the board. The feud_items table has not been created in Supabase yet. Run supabase/feud_items.sql in the Supabase SQL Editor, then try again.'
        : `Could not save the board. ${saveError.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingBoard) {
    return (
      <div className="feud-page feud-builder-page creator-page">
        <p className="feud-menu-empty">Loading your board…</p>
      </div>
    );
  }

  return (
    <div className="feud-page feud-builder-page creator-page">
      <header className="feud-builder-header">
        <Link className="feud-back" to="/class-feud" style={{ marginBottom: 0 }}>← All boards</Link>
        <div>
          <p className="feud-builder-kicker">Class Feud Studio</p>
          <h1>{isEditing ? 'Edit your board' : 'Build your own board'}</h1>
        </div>
        <button type="button" className="feud-primary-button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : '✓ Save board'}
        </button>
      </header>

      <section className="feud-panel">
        <div className="feud-thumb-wrap">
          <input ref={thumbnailInputRef} type="file" accept="image/*" hidden onChange={handleThumbnailPick} />
          {thumbnail ? (
            <button type="button" className="feud-thumb-preview" onClick={() => setThumbnail('')} title="Remove cover">
              <img src={thumbnail} alt="" />
              <i>×</i>
            </button>
          ) : (
            <button type="button" className="feud-thumb-empty" onClick={() => thumbnailInputRef.current?.click()}>
              <span><ImageIcon /></span>
              <strong>Add a cover</strong>
              <em>Picture or GIF — optional</em>
            </button>
          )}
          <button
            type="button"
            className="feud-media-search"
            onClick={() => setMediaSearchTarget({ type: 'thumbnail', query: title })}
            title="Search images and GIFs"
            aria-label="Search images and GIFs"
          >
            <SearchIcon />
          </button>
        </div>

        <div className="feud-builder-fields">
          <label className="feud-field">
            <span>Board title</span>
            <input
              value={title}
              maxLength={60}
              placeholder="e.g. Our Class Survey"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="feud-field">
            <span>Description <i className="feud-badge">Optional</i></span>
            <input
              value={description}
              maxLength={FEUD_DESCRIPTION_MAX_LENGTH}
              placeholder="One line about what this board covers"
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="feud-field">
            <span>Who can play it?</span>
            <div className="feud-visibility-toggle">
              <button type="button" className={isPublic ? 'selected' : ''} onClick={() => setIsPublic(true)}>Public</button>
              <button type="button" className={!isPublic ? 'selected' : ''} onClick={() => setIsPublic(false)}>Private</button>
            </div>
            <p className="feud-note">
              {isPublic
                ? 'Every teacher on ClassBop can find and play this board.'
                : 'Only you can see and play this board.'}
            </p>
          </div>

          <div className="feud-field">
            <span>Hashtags <i className="feud-badge">Optional</i></span>
            <div className="feud-tag-box">
              {tags.map((tag) => (
                <span key={tag} className="feud-tag-chip">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove #${tag}`}>×</button>
                </span>
              ))}
              {tags.length < MAX_HASHTAGS && (
                <input
                  value={tagInput}
                  placeholder={tags.length ? 'Add another…' : 'e.g. school, food…'}
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
              <div className="feud-tag-suggestions">
                {tagSuggestions.map((tag) => (
                  <button key={tag} type="button" onClick={() => addTag(tag)}>#{tag}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="feud-rounds-head">
        <h2>Survey rounds</h2>
        <p>
          Each round needs a <strong>question, a picture, or both</strong>, plus 1 to {MAX_FEUD_ANSWERS} answers.
          Put the most popular answer first and give it the most points — that is the order the board reveals.
        </p>
      </div>

      {rounds.map((round, roundIndex) => {
        const problem = roundProblem(round);
        const empty = isRoundEmpty(round);

        return (
          <article
            key={round.key}
            className={`feud-round-card${dragOverKey === round.key ? ' is-dragover' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverKey(round.key);
            }}
            onDragLeave={() => setDragOverKey((current) => (current === round.key ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              setDragOverKey(null);
              assignImageFile(round.key, event.dataTransfer.files?.[0]);
            }}
          >
            <header className="feud-round-top">
              <span className="feud-round-num">{roundIndex + 1}</span>
              <span className={`feud-round-status${problem ? '' : ' ok'}`}>
                {empty ? 'Empty round — it will be skipped' : (problem ? `⚠ ${problem}` : '✓ Ready to play')}
              </span>
              <button
                type="button"
                className="feud-round-remove"
                onClick={() => removeRound(round.key)}
                disabled={rounds.length <= 1}
                aria-label={`Remove round ${roundIndex + 1}`}
              >
                ×
              </button>
            </header>

            <div className="feud-round-body">
              <div className="feud-builder-media-wrap">
                <input
                  ref={(element) => { fileInputRefs.current[round.key] = element; }}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    assignImageFile(round.key, file);
                  }}
                />
                {round.image ? (
                  <button
                    type="button"
                    className="feud-builder-media has-image"
                    onClick={() => updateRound(round.key, { image: '' })}
                    title="Remove picture"
                  >
                    <img src={round.image} alt="" />
                    <i>×</i>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="feud-builder-media"
                    onClick={() => fileInputRefs.current[round.key]?.click()}
                  >
                    <span>＋</span>
                    Picture or GIF
                    <em>click or drop</em>
                  </button>
                )}
                <button
                  type="button"
                  className="feud-media-search"
                  onClick={() => setMediaSearchTarget({ type: 'round', key: round.key, query: round.prompt })}
                  title="Search images and GIFs"
                  aria-label="Search images and GIFs"
                >
                  <SearchIcon />
                </button>
              </div>

              <div>
                <textarea
                  className="feud-prompt-input"
                  value={round.prompt}
                  maxLength={160}
                  rows={2}
                  placeholder="Name something you find in a kitchen…"
                  onChange={(event) => updateRound(round.key, { prompt: event.target.value })}
                />

                <div className="feud-answers-head">
                  <span>Answers (best first)</span>
                  <span>{filledAnswers(round).length}/{MAX_FEUD_ANSWERS}</span>
                </div>

                <div className="feud-answer-rows">
                  {round.answers.map((answer, answerIndex) => (
                    <div className="feud-answer-row" key={answer.key}>
                      <span className="feud-answer-rank">{answerIndex + 1}</span>
                      <input
                        value={answer.text}
                        maxLength={60}
                        placeholder={`Answer ${answerIndex + 1}`}
                        onChange={(event) => updateAnswer(round.key, answer.key, { text: event.target.value })}
                      />
                      <input
                        className="feud-answer-points"
                        type="number"
                        min={1}
                        max={99}
                        value={answer.points}
                        aria-label={`Points for answer ${answerIndex + 1}`}
                        onChange={(event) => updateAnswer(round.key, answer.key, { points: event.target.value })}
                        onBlur={(event) => updateAnswer(round.key, answer.key, {
                          points: normalizeAnswerPoints(event.target.value),
                        })}
                      />
                      <button
                        type="button"
                        className="feud-answer-drop"
                        onClick={() => removeAnswer(round.key, answer.key)}
                        disabled={round.answers.length <= 1}
                        aria-label={`Remove answer ${answerIndex + 1}`}
                      >
                        ×
                      </button>
                      {answer.text.trim() && (
                        <input
                          className="feud-answer-alias"
                          value={answer.aliases}
                          maxLength={120}
                          placeholder="Also accept (comma separated): fridge, refrigerator…"
                          onChange={(event) => updateAnswer(round.key, answer.key, { aliases: event.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="feud-add-answer"
                  onClick={() => addAnswer(round.key)}
                  disabled={round.answers.length >= MAX_FEUD_ANSWERS}
                >
                  + Add answer
                </button>
              </div>
            </div>
          </article>
        );
      })}

      <button type="button" className="feud-add-round" onClick={addRound} disabled={rounds.length >= MAX_FEUD_ROUNDS}>
        + Add round
      </button>

      {error && <p className="feud-builder-error">{error}</p>}

      <footer className="feud-builder-footer">
        <p>{readyCount} of {rounds.length} rounds ready · need at least {MIN_FEUD_ROUNDS}</p>
        <button type="button" className="feud-primary-button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : '✓ Save board'}
        </button>
      </footer>

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
