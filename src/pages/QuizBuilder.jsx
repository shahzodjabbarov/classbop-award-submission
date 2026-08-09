import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import MediaSearchPicker, { SearchIcon } from '../components/MediaSearchPicker';
import {
  DEFAULT_QUIZ_QUESTION_POINTS,
  QUIZ_CHOICE_STYLES,
  QUIZ_DESCRIPTION_MAX_LENGTH,
  QUIZ_POINT_OPTIONS,
  createQuizSet,
  fetchPopularQuizHashtags,
  fetchQuizSet,
  normalizeQuizQuestionPoints,
  updateQuizSet,
} from '../games/quiz/quizSets';
import './Quiz.css';
import './CreatorTheme.css';

const MAX_IMAGE_DIMENSION = 900;
const MAX_GIF_BYTES = 2.5 * 1024 * 1024;
const MIN_QUESTIONS = 2;
const MAX_QUESTIONS = 36;
const MAX_HASHTAGS = 6;
const CHOICE_SLOTS = 4;

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

function makeQuestionCard() {
  const key = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `question-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    key,
    question: '',
    hint: '',
    answer: '',
    image: '',
    mode: 'answer',
    points: DEFAULT_QUIZ_QUESTION_POINTS,
    choices: Array.from({ length: CHOICE_SLOTS }, () => ''),
    // -1 = not chosen yet; the teacher must tap a shape to mark the answer.
    correct: -1,
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

  const usePng = file.type === 'image/png';
  return canvas.toDataURL(usePng ? 'image/png' : 'image/jpeg', 0.85);
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function ChoicesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="7" height="7" rx="1.5" />
      <rect x="14" y="4" width="7" height="7" rx="1.5" />
      <rect x="3" y="15" width="7" height="7" rx="1.5" />
      <rect x="14" y="15" width="7" height="7" rx="1.5" />
    </svg>
  );
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

// Maps an AI-generated question (from /quiz/generate) onto a builder card.
function generatedQuestionToCard(question) {
  return {
    ...makeQuestionCard(),
    question: question.question || '',
    hint: question.hint || '',
    answer: question.answer || '',
    image: question.image || '',
    points: normalizeQuizQuestionPoints(question.points),
    mode: question.choices?.length ? 'choices' : 'answer',
    choices: Array.from({ length: CHOICE_SLOTS }, (_, index) => question.choices?.[index] || ''),
    correct: question.choices?.length ? question.correctChoice : -1,
  };
}

function isCardEmpty(card) {
  return !card.question.trim()
    && !card.hint.trim()
    && !card.answer.trim()
    && !card.image
    && card.choices.every((choice) => !choice.trim());
}

// Empty string means the card is complete and playable.
function cardProblem(card) {
  if (!card.question.trim() && !card.image) return 'Add a question or a picture';
  if (!QUIZ_POINT_OPTIONS.includes(card.points)) return 'Choose a point value';
  if (card.mode === 'choices') {
    const filled = card.choices.filter((choice) => choice.trim());
    if (filled.length < 2) return 'Add at least 2 choices';
    if (card.correct < 0 || !card.choices[card.correct]?.trim()) return 'Tap a shape to mark the correct choice';
    return '';
  }
  return card.answer.trim() ? '' : 'Add the answer';
}

export default function QuizBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { matchId } = useParams();
  const isEditing = Boolean(matchId);
  // AI-generated draft handed over from /quiz/generate, applied once on mount.
  const generatedDraft = !isEditing && location.state?.generated ? location.state.generated : null;
  const [isLoadingSet, setIsLoadingSet] = useState(isEditing);
  const [ownerId, setOwnerId] = useState(null);
  const [title, setTitle] = useState(generatedDraft?.title || '');
  const [description, setDescription] = useState(
    () => String(generatedDraft?.description || '').slice(0, QUIZ_DESCRIPTION_MAX_LENGTH)
  );
  const [cards, setCards] = useState(() => (
    generatedDraft?.questions?.length
      ? generatedDraft.questions.map(generatedQuestionToCard)
      : [makeQuestionCard(), makeQuestionCard(), makeQuestionCard()]
  ));
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
  const activeCardKeyRef = useRef(null);
  const assignImageRef = useRef(null);

  const updateCard = (key, patch) => {
    setCards((rows) => rows.map((row) => row.key === key ? { ...row, ...patch } : row));
  };

  const openMediaSearch = (target) => {
    setMediaSearchTarget(target);
  };

  const handleMediaSelect = (item) => {
    if (mediaSearchTarget?.type === 'thumbnail') {
      setThumbnail(item.url);
    } else if (mediaSearchTarget?.key) {
      setCards((rows) => rows.map((row) => {
        if (row.key !== mediaSearchTarget.key) return row;
        return {
          ...row,
          image: item.url,
          question: row.question.trim() ? row.question : item.title.slice(0, 160),
        };
      }));
    }
    setMediaSearchTarget(null);
    setError('');
  };

  const updateChoice = (key, choiceIndex, value) => {
    setCards((rows) => rows.map((row) => row.key === key
      ? { ...row, choices: row.choices.map((choice, index) => index === choiceIndex ? value : choice) }
      : row));
  };

  const addCard = () => {
    setCards((rows) => rows.length >= MAX_QUESTIONS ? rows : [...rows, makeQuestionCard()]);
  };

  const removeCard = (key) => {
    setCards((rows) => rows.length <= 1 ? rows : rows.filter((row) => row.key !== key));
    if (activeCardKeyRef.current === key) activeCardKeyRef.current = null;
  };

  const imageErrorMessage = (imageError) =>
    imageError?.code === 'gif-too-large'
      ? 'That GIF is too big (max 2.5MB). Try a smaller one.'
      : 'That image could not be read. Try a different file.';

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

  // Assigns an image file to a specific card, or (when no card is targeted)
  // to the first card without a picture.
  const assignImageFile = async (key, file) => {
    if (!file || !file.type?.startsWith('image/')) return;

    try {
      const image = await fileToResizedDataUrl(file);
      setCards((rows) => {
        if (key && rows.some((row) => row.key === key)) {
          return rows.map((row) => row.key === key ? { ...row, image } : row);
        }
        const emptyRow = rows.find((row) => !row.image);
        if (emptyRow) {
          return rows.map((row) => row.key === emptyRow.key ? { ...row, image } : row);
        }
        return rows;
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
            assignImageRef.current?.(activeCardKeyRef.current, file);
          }
          return;
        }
      }
    };

    // Stops the browser from opening the file when a drop misses a card.
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

  // Clears the navigation state so a refresh doesn't re-apply the AI draft
  // over the teacher's edits.
  useEffect(() => {
    if (generatedDraft) window.history.replaceState({}, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loads the existing quiz when editing.
  useEffect(() => {
    if (!isEditing) return undefined;

    let isActive = true;
    fetchQuizSet(matchId)
      .then((match) => {
        if (!isActive) return;
        const existingCards = match.questions.map((question) => ({
          ...makeQuestionCard(),
          question: question.question || '',
          hint: question.hint || '',
          answer: question.answer || '',
          image: question.image || '',
          points: normalizeQuizQuestionPoints(question.points),
          mode: question.choices?.length ? 'choices' : 'answer',
          choices: Array.from({ length: CHOICE_SLOTS }, (_, index) => question.choices?.[index] || ''),
          correct: question.choices?.length ? question.correctChoice : -1,
        }));
        setTitle(match.title || '');
        setDescription(String(match.subtitle || '').slice(0, QUIZ_DESCRIPTION_MAX_LENGTH));
        setIsPublic(match.isPublic !== false);
        setTags(match.hashtags || []);
        setThumbnail(match.thumbnail || '');
        setOwnerId(match.authorId || null);
        setCards(existingCards.length ? existingCards : [makeQuestionCard()]);
        setIsLoadingSet(false);
      })
      .catch(() => {
        if (!isActive) return;
        setError('Could not load that quiz. It may have been deleted.');
        setIsLoadingSet(false);
      });

    return () => { isActive = false; };
  }, [matchId, isEditing]);

  useEffect(() => {
    let isActive = true;
    fetchPopularQuizHashtags()
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

  const readyCount = cards.filter((card) => !isCardEmpty(card) && !cardProblem(card)).length;

  const handleSave = async () => {
    if (!user) {
      navigate('/auth?mode=login&next=/quiz/create');
      return;
    }

    if (isEditing && ownerId && ownerId !== user.id) {
      setError('Only the quiz owner can edit this quiz.');
      return;
    }

    if (!title.trim()) {
      setError('Give your quiz a title first.');
      return;
    }

    const brokenIndex = cards.findIndex((card) => !isCardEmpty(card) && cardProblem(card));
    if (brokenIndex !== -1) {
      setError(`Question ${brokenIndex + 1}: ${cardProblem(cards[brokenIndex])}.`);
      return;
    }

    const cleanQuestions = cards
      .filter((card) => !isCardEmpty(card))
      .map((card) => {
        if (card.mode === 'choices') {
          const filled = card.choices.map((choice) => choice.trim()).filter(Boolean);
          const correctText = card.choices[card.correct].trim();
          return {
            question: card.question.trim(),
            hint: card.hint.trim(),
            image: card.image,
            points: normalizeQuizQuestionPoints(card.points),
            choices: filled,
            correctChoice: filled.indexOf(correctText),
            answer: correctText,
          };
        }
        return {
          question: card.question.trim(),
          hint: card.hint.trim(),
          image: card.image,
          points: normalizeQuizQuestionPoints(card.points),
          choices: null,
          correctChoice: null,
          answer: card.answer.trim(),
        };
      });

    if (cleanQuestions.length < MIN_QUESTIONS) {
      setError(`Add at least ${MIN_QUESTIONS} finished questions.`);
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const payload = {
        userId: user.id,
        title: title.trim().slice(0, 60),
        subtitle: description.trim().slice(0, QUIZ_DESCRIPTION_MAX_LENGTH),
        questions: cleanQuestions,
        isPublic,
        hashtags: tags,
        thumbnail,
      };
      const savedMatchId = isEditing
        ? await updateQuizSet({ ...payload, matchId })
        : await createQuizSet(payload);
      navigate(`/quiz/${savedMatchId}`);
    } catch (saveError) {
      const missingQuizTable = saveError.message?.includes("Could not find the table 'public.quiz_items'")
        || saveError.code === 'PGRST205';
      setError(
        missingQuizTable
          ? 'Could not save the quiz. The quiz_items table has not been created in Supabase yet. Run supabase/quiz_items.sql in the Supabase SQL Editor, then try again.'
          : `Could not save the quiz. ${saveError.message}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSet) {
    return (
      <div className="quiz-page quiz-builder-page creator-page">
        <div className="quiz-builder-shell">
          <p className="quiz-builder-loading">LOADING YOUR QUIZ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page quiz-builder-page creator-page">
      <div className="quiz-builder-shell">
        <header className="quiz-builder-header">
          <Link className="quiz-builder-back" to="/quiz">← All quizzes</Link>
          <div>
            <p className="quiz-builder-kicker">Quiz-Bop Studio</p>
            <h1>{isEditing ? 'Edit Your Quiz' : 'Create Your Own Quiz'}</h1>
          </div>
          <button
            type="button"
            className="quiz-builder-save small"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : '✓ Save Quiz'}
          </button>
        </header>

        <section className="quiz-builder-panel">
          <div className="quiz-builder-thumb-zone">
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleThumbnailPick}
            />
            {thumbnail ? (
              <div className="quiz-builder-thumb-wrap">
                <button
                  type="button"
                  className="quiz-builder-thumb-preview"
                  onClick={() => setThumbnail('')}
                  title="Remove thumbnail"
                >
                  <img src={thumbnail} alt="" />
                  <i>×</i>
                </button>
                <button
                  type="button"
                  className="quiz-builder-media-search"
                  onClick={() => openMediaSearch({ type: 'thumbnail', query: title })}
                  title="Search images and GIFs"
                  aria-label="Search images and GIFs"
                >
                  <SearchIcon />
                </button>
              </div>
            ) : (
              <div className="quiz-builder-thumb-wrap">
                <button
                  type="button"
                  className="quiz-builder-thumb-empty"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <span><ImageIcon /></span>
                  <strong>Add a thumbnail</strong>
                  <em>Picture or GIF — this is your quiz's cover</em>
                </button>
                <button
                  type="button"
                  className="quiz-builder-media-search"
                  onClick={() => openMediaSearch({ type: 'thumbnail', query: title })}
                  title="Search images and GIFs"
                  aria-label="Search images and GIFs"
                >
                  <SearchIcon />
                </button>
              </div>
            )}
          </div>

          <div className="quiz-builder-fields">
            <label className="quiz-builder-field">
              <span>Quiz title</span>
              <input
                value={title}
                maxLength={60}
                placeholder="e.g. Space Animals Review"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="quiz-builder-field">
              <span>Description <i className="quiz-builder-badge">Optional</i></span>
              <input
                value={description}
                maxLength={QUIZ_DESCRIPTION_MAX_LENGTH}
                placeholder="One line about what this quiz covers"
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <div className="quiz-builder-field">
              <span>Who can play it?</span>
              <div className="quiz-visibility-toggle">
                <button
                  type="button"
                  className={isPublic ? 'selected' : ''}
                  onClick={() => setIsPublic(true)}
                >
                  Public
                </button>
                <button
                  type="button"
                  className={!isPublic ? 'selected' : ''}
                  onClick={() => setIsPublic(false)}
                >
                  Private
                </button>
              </div>
              <p className="quiz-builder-note">
                {isPublic
                  ? 'Every teacher on Classbop can find and play this quiz.'
                  : 'Only you can see and play this quiz.'}
              </p>
            </div>

            <div className="quiz-builder-field">
              <span>
                Hashtags <i className="quiz-builder-badge">Optional</i>
                {tags.length > 0 && <b className="quiz-builder-count">{tags.length}/{MAX_HASHTAGS}</b>}
              </span>
              <div className="quiz-tag-box">
                {tags.map((tag) => (
                  <span key={tag} className="quiz-tag-chip">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove #${tag}`}>×</button>
                  </span>
                ))}
                {tags.length < MAX_HASHTAGS && (
                  <input
                    value={tagInput}
                    placeholder={tags.length ? 'Add another…' : 'e.g. animals, grammar…'}
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
                <div className="quiz-tag-suggestions">
                  {tagSuggestions.map((tag) => (
                    <button key={tag} type="button" onClick={() => addTag(tag)}>#{tag}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="quiz-builder-questions-head">
          <h2>Questions</h2>
          <p>
            Every question needs a <strong>picture/GIF or question text</strong> (or both) plus an answer.
            Tip: click a card, then paste (Ctrl+V) or drop a picture straight onto it.
          </p>
        </div>

        <div className="quiz-builder-grid">
          {cards.map((card, index) => {
            const problem = cardProblem(card);
            const empty = isCardEmpty(card);

            return (
              <article
                key={card.key}
                className={`quiz-builder-card ${dragOverKey === card.key ? 'is-dragover' : ''}`}
                onClick={() => { activeCardKeyRef.current = card.key; }}
                onFocusCapture={() => { activeCardKeyRef.current = card.key; }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverKey(card.key);
                }}
                onDragLeave={() => {
                  setDragOverKey((currentKey) => currentKey === card.key ? null : currentKey);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOverKey(null);
                  assignImageFile(card.key, event.dataTransfer.files?.[0]);
                }}
              >
                <header className="quiz-builder-card-top">
                  <span className="quiz-builder-num">{index + 1}</span>
                  <div className="quiz-builder-type-toggle">
                    <button
                      type="button"
                      className={card.mode === 'answer' ? 'selected' : ''}
                      onClick={() => updateCard(card.key, { mode: 'answer' })}
                    >
                      <PencilIcon /> Answer
                    </button>
                    <button
                      type="button"
                      className={card.mode === 'choices' ? 'selected' : ''}
                      onClick={() => updateCard(card.key, { mode: 'choices' })}
                    >
                      <ChoicesIcon /> Choices
                    </button>
                  </div>
                  <button
                    type="button"
                    className="quiz-builder-remove"
                    onClick={() => removeCard(card.key)}
                    disabled={cards.length <= 1}
                    aria-label="Remove question"
                  >
                    ×
                  </button>
                </header>

                <div className="quiz-builder-points">
                  <span>Points</span>
                  <div role="group" aria-label={`Question ${index + 1} points`}>
                    {QUIZ_POINT_OPTIONS.map((points) => (
                      <button
                        type="button"
                        className={card.points === points ? 'selected' : ''}
                        key={points}
                        onClick={() => updateCard(card.key, { points })}
                        aria-pressed={card.points === points}
                      >
                        {points}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  ref={(element) => { fileInputRefs.current[card.key] = element; }}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => handleImagePick(card.key, event)}
                />
                <div className="quiz-builder-media-wrap">
                  {card.image ? (
                    <button
                      type="button"
                      className="quiz-builder-media has-image"
                      onClick={() => updateCard(card.key, { image: '' })}
                      title="Remove picture"
                    >
                      <img src={card.image} alt="" />
                      <i>×</i>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="quiz-builder-media"
                      onClick={() => fileInputRefs.current[card.key]?.click()}
                    >
                      <span>＋</span>
                      Picture or GIF
                      <em>click, paste, or drop</em>
                    </button>
                  )}
                  <button
                    type="button"
                    className="quiz-builder-media-search"
                    onClick={() => openMediaSearch({ type: 'card', key: card.key, query: card.question || card.answer })}
                    title="Search images and GIFs"
                    aria-label="Search images and GIFs"
                  >
                    <SearchIcon />
                  </button>
                </div>

                <textarea
                  className="quiz-builder-question"
                  value={card.question}
                  maxLength={160}
                  rows={2}
                  placeholder="Type your question…"
                  onChange={(event) => updateCard(card.key, { question: event.target.value })}
                />

                <input
                  className="quiz-builder-hint"
                  value={card.hint}
                  maxLength={120}
                  placeholder="Add a hint or extra info…"
                  onChange={(event) => updateCard(card.key, { hint: event.target.value })}
                />

                {card.mode === 'answer' ? (
                  <input
                    className="quiz-builder-answer"
                    value={card.answer}
                    maxLength={120}
                    placeholder="✓ The answer"
                    onChange={(event) => updateCard(card.key, { answer: event.target.value })}
                  />
                ) : (
                  <div className="quiz-builder-choices">
                    {card.choices.map((choice, choiceIndex) => (
                      <div
                        key={choiceIndex}
                        className={`quiz-builder-choice-row${card.correct === choiceIndex ? ' correct' : ''}`}
                        style={{ '--quiz-choice-color': QUIZ_CHOICE_STYLES[choiceIndex].color }}
                      >
                        <button
                          type="button"
                          className="quiz-builder-choice-pick"
                          onClick={() => updateCard(card.key, { correct: choiceIndex })}
                          title="Mark as the correct choice"
                          aria-label={`Mark choice ${choiceIndex + 1} as correct`}
                        >
                          {card.correct === choiceIndex ? '✓' : QUIZ_CHOICE_STYLES[choiceIndex].symbol}
                        </button>
                        <input
                          value={choice}
                          maxLength={80}
                          placeholder={`Choice ${choiceIndex + 1}`}
                          onChange={(event) => updateChoice(card.key, choiceIndex, event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {!empty && (
                  <p className={`quiz-builder-status${problem ? '' : ' ok'}`}>
                    {problem ? `⚠ ${problem}` : '✓ Ready to play'}
                  </p>
                )}
              </article>
            );
          })}

          <button
            type="button"
            className="quiz-builder-add-card"
            onClick={addCard}
            disabled={cards.length >= MAX_QUESTIONS}
          >
            <span>+</span>
            <strong>Add Question</strong>
          </button>
        </div>

        {error && <p className="quiz-builder-error">{error}</p>}

        <footer className="quiz-builder-footer">
          <p>{readyCount} of {cards.length} questions ready · need at least {MIN_QUESTIONS}</p>
          <button
            type="button"
            className="quiz-builder-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : '✓ Save Quiz'}
          </button>
        </footer>
      </div>
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
