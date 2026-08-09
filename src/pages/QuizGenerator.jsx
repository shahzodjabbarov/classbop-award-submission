import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MediaSearchPicker, { SearchIcon } from '../components/MediaSearchPicker';
import { searchMediaImages } from '../components/mediaSearch';
import { extractKeywords, generateQuizQuestions } from '../games/quiz/quizAi';
import './Quiz.css';
import './CreatorTheme.css';

const QUESTION_COUNTS = [6, 10, 16, 20];
const LEVELS = ['Elementary', 'Middle school', 'High school', 'Adult'];
const MAX_FILES = 5;
const MAX_CARDS = 20;

const EXTRACTING_LINES = [
  'Reading your material…',
  'Picking out the key words…',
  'Matching a picture to each word…',
  'Laying out your cards…',
];

const GENERATING_LINES = [
  'Reading your key words…',
  'Writing the questions…',
  'Checking the answers…',
  'Adding the finishing touches…',
];

function makeCardKey() {
  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `kw-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5c.3 0 .57.19.66.48l1.4 4.24c.29.88.98 1.57 1.86 1.86l4.24 1.4a.7.7 0 0 1 0 1.33l-4.24 1.4a2.9 2.9 0 0 0-1.86 1.86l-1.4 4.24a.7.7 0 0 1-1.33 0l-1.4-4.24a2.9 2.9 0 0 0-1.86-1.86l-4.24-1.4a.7.7 0 0 1 0-1.33l4.24-1.4a2.9 2.9 0 0 0 1.86-1.86l1.4-4.24a.7.7 0 0 1 .67-.48Z" />
      <path d="M19.5 2.1c.15 0 .28.09.33.24l.5 1.53c.1.31.35.55.66.65l1.53.5a.35.35 0 0 1 0 .67l-1.53.5c-.31.1-.55.34-.66.65l-.5 1.53a.35.35 0 0 1-.66 0l-.5-1.53a1.05 1.05 0 0 0-.66-.65l-1.53-.5a.35.35 0 0 1 0-.67l1.53-.5c.31-.1.55-.34.66-.65l.5-1.53a.35.35 0 0 1 .33-.24Z" />
    </svg>
  );
}

function FileTypeIcon({ type }) {
  if (type === 'application/pdf') return <span className="quiz-ai-file-icon pdf">PDF</span>;
  return <span className="quiz-ai-file-icon img">IMG</span>;
}

// Fetches the best-matching image for a word. Returns null when nothing fits.
async function findImageForWord(word) {
  try {
    const results = await searchMediaImages(word, { limit: 4 });
    return results[0] || null;
  } catch {
    return null;
  }
}

export default function QuizGenerator() {
  const navigate = useNavigate();

  // step: 'material' → 'keywords' → 'preview' (with a working overlay between)
  const [step, setStep] = useState('material');
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [count, setCount] = useState(10);
  const [mode, setMode] = useState('mix');
  const [level, setLevel] = useState('Middle school');

  // Key-word cards: { key, word, image, imageTitle, isMatching }
  const [cards, setCards] = useState([]);
  const [mediaTargetKey, setMediaTargetKey] = useState(null);

  const [isWorking, setIsWorking] = useState(false);
  const [workingLine, setWorkingLine] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const hasMaterial = text.trim().length > 0 || files.length > 0;
  const workingLines = step === 'material' ? EXTRACTING_LINES : GENERATING_LINES;
  const readyCards = cards.filter((card) => card.word.trim());

  useEffect(() => {
    if (!isWorking) return undefined;
    const timer = setInterval(() => {
      setWorkingLine((line) => (line + 1) % workingLines.length);
    }, 1400);
    return () => clearInterval(timer);
  }, [isWorking, workingLines.length]);

  const startWorking = () => {
    setError('');
    setWorkingLine(0);
    setIsWorking(true);
  };

  const addFiles = (incoming) => {
    const accepted = [...incoming].filter(
      (file) => file.type === 'application/pdf' || file.type.startsWith('image/'),
    );
    if (!accepted.length) return;
    setFiles((current) => [...current, ...accepted].slice(0, MAX_FILES));
    setError('');
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleExtract = async () => {
    if (!hasMaterial) {
      setError('Paste some text or add a file first.');
      return;
    }
    startWorking();
    try {
      const { keywords } = await extractKeywords({ text, files });

      // Match a picture to every word in parallel while the overlay plays.
      const matches = await Promise.allSettled(keywords.map(findImageForWord));
      const matchedCards = keywords.map((word, index) => {
        const match = matches[index].status === 'fulfilled' ? matches[index].value : null;
        return {
          key: makeCardKey(),
          word,
          image: match?.previewUrl || match?.url || '',
          imageTitle: match?.title || '',
          isMatching: false,
        };
      });

      setCards(matchedCards);
      setStep('keywords');
    } catch {
      setError('Something went wrong reading your material. Please try again.');
    } finally {
      setIsWorking(false);
    }
  };

  const updateCard = (key, patch) => {
    setCards((current) => current.map((card) => (card.key === key ? { ...card, ...patch } : card)));
  };

  const removeCard = (key) => {
    setCards((current) => current.filter((card) => card.key !== key));
    if (mediaTargetKey === key) setMediaTargetKey(null);
  };

  const addCard = () => {
    if (cards.length >= MAX_CARDS) return;
    setCards((current) => [
      ...current,
      { key: makeCardKey(), word: '', image: '', imageTitle: '', isMatching: false },
    ]);
  };

  // Quietly finds a picture for a card once the teacher commits a word.
  const autoMatchCard = async (key) => {
    const card = cards.find((c) => c.key === key);
    const word = card?.word.trim();
    if (!card || !word || card.image || card.isMatching) return;

    updateCard(key, { isMatching: true });
    const match = await findImageForWord(word);
    setCards((current) => current.map((c) => {
      if (c.key !== key) return c;
      if (c.image) return { ...c, isMatching: false };
      return {
        ...c,
        image: match?.previewUrl || match?.url || '',
        imageTitle: match?.title || '',
        isMatching: false,
      };
    }));
  };

  const handleMediaSelect = (item) => {
    if (mediaTargetKey) {
      updateCard(mediaTargetKey, { image: item.url, imageTitle: item.title, isMatching: false });
    }
    setMediaTargetKey(null);
  };

  const handleGenerate = async () => {
    if (readyCards.length < 2) {
      setError('Keep at least 2 key word cards.');
      return;
    }
    startWorking();
    try {
      const generated = await generateQuizQuestions({
        items: readyCards.map((card) => ({ word: card.word.trim(), image: card.image })),
        count,
        mode,
        level,
      });
      setResult(generated);
      setStep('preview');
    } catch {
      setError('Something went wrong generating the quiz. Please try again.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleOpenInBuilder = () => {
    navigate('/quiz/create', {
      state: {
        generated: {
          title: result.title,
          description: `AI-generated review quiz · ${level}`,
          questions: result.questions,
        },
      },
    });
  };

  const mediaTargetCard = mediaTargetKey ? cards.find((card) => card.key === mediaTargetKey) : null;
  const stepNumber = step === 'material' ? 1 : step === 'keywords' ? 2 : 3;

  return (
    <div className="quiz-page quiz-builder-page creator-page">
      <div className="quiz-builder-shell quiz-ai-shell">
        <header className="quiz-builder-header">
          <Link className="quiz-builder-back" to="/quiz">← All quizzes</Link>
          <div>
            <p className="quiz-builder-kicker">Quiz-Bop Studio</p>
            <h1><SparkleIcon /> Generate a Quiz</h1>
          </div>
          <div className="quiz-ai-steps" aria-label={`Step ${stepNumber} of 3`}>
            {['Material', 'Key words', 'Preview'].map((label, index) => (
              <span
                key={label}
                className={`quiz-ai-step${index + 1 === stepNumber ? ' active' : ''}${index + 1 < stepNumber ? ' done' : ''}`}
              >
                <i>{index + 1 < stepNumber ? '✓' : index + 1}</i>
                {label}
              </span>
            ))}
          </div>
        </header>

        {isWorking && (
          <section className="quiz-ai-working">
            <div className="quiz-ai-working-orb"><SparkleIcon /></div>
            <h2>{step === 'material' ? 'Finding your key words' : 'Building your quiz'}</h2>
            <p key={workingLine} className="quiz-ai-working-line">{workingLines[workingLine]}</p>
            <div className="quiz-ai-working-bar"><span /></div>
          </section>
        )}

        {!isWorking && step === 'material' && (
          <>
            <section className="quiz-ai-panel">
              <div className="quiz-ai-panel-head">
                <h2>What did your class learn today?</h2>
                <p>Paste your lesson text, or drop in a worksheet, PDF, or a photo of the textbook page.</p>
              </div>

              <textarea
                className="quiz-ai-textarea"
                value={text}
                rows={7}
                placeholder={'Paste anything — lesson notes, a vocabulary list, a reading passage…\n\ne.g. "Today we learned about weather. Rain falls from clouds. A thermometer measures temperature…"'}
                onChange={(event) => setText(event.target.value)}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                multiple
                hidden
                onChange={(event) => {
                  addFiles(event.target.files || []);
                  event.target.value = '';
                }}
              />

              <div
                className={`quiz-ai-dropzone${isDragOver ? ' is-dragover' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOver(false);
                  addFiles(event.dataTransfer.files || []);
                }}
              >
                <button type="button" onClick={() => fileInputRef.current?.click()}>
                  <span>＋</span>
                  <strong>Add PDF or photos</strong>
                  <em>click or drop files here · up to {MAX_FILES}</em>
                </button>

                {files.length > 0 && (
                  <ul className="quiz-ai-file-list">
                    {files.map((file, index) => (
                      <li key={`${file.name}-${index}`}>
                        <FileTypeIcon type={file.type} />
                        <span className="quiz-ai-file-name">{file.name}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="quiz-ai-panel">
              <div className="quiz-ai-panel-head">
                <h2>Quiz settings</h2>
              </div>
              <div className="quiz-ai-options">
                <div className="quiz-ai-option">
                  <span>Questions</span>
                  <div className="quiz-ai-segments">
                    {QUESTION_COUNTS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={count === value ? 'selected' : ''}
                        onClick={() => setCount(value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-ai-option">
                  <span>Question type</span>
                  <div className="quiz-ai-segments">
                    <button type="button" className={mode === 'answer' ? 'selected' : ''} onClick={() => setMode('answer')}>Open answer</button>
                    <button type="button" className={mode === 'choices' ? 'selected' : ''} onClick={() => setMode('choices')}>Multiple choice</button>
                    <button type="button" className={mode === 'mix' ? 'selected' : ''} onClick={() => setMode('mix')}>Mix</button>
                  </div>
                </div>

                <div className="quiz-ai-option">
                  <span>Student level</span>
                  <div className="quiz-ai-segments">
                    {LEVELS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={level === value ? 'selected' : ''}
                        onClick={() => setLevel(value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {error && <p className="quiz-builder-error">{error}</p>}

            <footer className="quiz-ai-footer">
              <p>{hasMaterial ? 'Ready when you are.' : 'Add some material to get started.'}</p>
              <button
                type="button"
                className="quiz-builder-save quiz-ai-cta"
                disabled={!hasMaterial}
                onClick={handleExtract}
              >
                Find Key Words →
              </button>
            </footer>
          </>
        )}

        {!isWorking && step === 'keywords' && (
          <>
            <section className="quiz-ai-panel">
              <div className="quiz-ai-panel-head">
                <h2>Here's what your lesson is about</h2>
                <p>
                  Each key word comes with a matched picture. Fix the words, swap any picture with
                  the <strong>⌕ search</strong>, remove cards that don't fit, or add your own.
                </p>
              </div>

              <div className="quiz-ai-kwgrid">
                {cards.map((card) => (
                  <article key={card.key} className="quiz-ai-kwcard">
                    <div className={`quiz-ai-kwcard-media${card.isMatching ? ' is-matching' : ''}`}>
                      {card.image ? (
                        <img src={card.image} alt={card.imageTitle || card.word} loading="lazy" />
                      ) : (
                        <span className="quiz-ai-kwcard-media-empty" aria-hidden="true">
                          {card.isMatching ? '…' : '🖼'}
                        </span>
                      )}
                      <div className="quiz-ai-kwcard-tools">
                        <button
                          type="button"
                          title="Search for a different picture or GIF"
                          aria-label={`Change picture for ${card.word || 'this card'}`}
                          onClick={() => setMediaTargetKey(card.key)}
                        >
                          <SearchIcon />
                        </button>
                        <button
                          type="button"
                          className="danger"
                          title="Remove this card"
                          aria-label={`Remove ${card.word || 'this card'}`}
                          onClick={() => removeCard(card.key)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <input
                      value={card.word}
                      maxLength={40}
                      placeholder="Key word…"
                      autoFocus={!card.word && !card.image}
                      onChange={(event) => updateCard(card.key, { word: event.target.value })}
                      onBlur={() => autoMatchCard(card.key)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          autoMatchCard(card.key);
                        }
                      }}
                    />
                  </article>
                ))}

                {cards.length < MAX_CARDS && (
                  <button type="button" className="quiz-ai-kwcard-add" onClick={addCard}>
                    <span>+</span>
                    <strong>Add a card</strong>
                  </button>
                )}
              </div>

              <p className="quiz-builder-note">
                {readyCards.length} key words · {count} questions · {level}
              </p>
            </section>

            {error && <p className="quiz-builder-error">{error}</p>}

            <footer className="quiz-ai-footer">
              <button type="button" className="quiz-ai-back-btn" onClick={() => setStep('material')}>
                ← Back
              </button>
              <button
                type="button"
                className="quiz-builder-save quiz-ai-cta"
                disabled={readyCards.length < 2}
                onClick={handleGenerate}
              >
                <SparkleIcon /> Generate {count} Questions
              </button>
            </footer>
          </>
        )}

        {!isWorking && step === 'preview' && result && (
          <>
            <section className="quiz-ai-panel">
              <div className="quiz-ai-panel-head quiz-ai-preview-head">
                <div>
                  <h2>{result.title}</h2>
                  <p>{result.questions.length} questions ready. Open them in the builder to tweak anything, add pictures, and save.</p>
                </div>
                <span className="quiz-ai-preview-badge"><SparkleIcon /> AI draft</span>
              </div>

              <div className="quiz-ai-preview-grid">
                {result.questions.map((question, index) => (
                  <article key={index} className="quiz-ai-preview-card">
                    <header>
                      <span className="quiz-builder-num">{index + 1}</span>
                      <em>{question.choices ? 'Multiple choice' : 'Open answer'}</em>
                    </header>
                    {question.image && (
                      <img className="quiz-ai-preview-image" src={question.image} alt="" loading="lazy" />
                    )}
                    <p className="quiz-ai-preview-question">{question.question}</p>
                    {question.choices ? (
                      <ul className="quiz-ai-preview-choices">
                        {question.choices.map((choice, choiceIndex) => (
                          <li key={choiceIndex} className={choiceIndex === question.correctChoice ? 'correct' : ''}>
                            {choiceIndex === question.correctChoice ? '✓ ' : ''}{choice}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="quiz-ai-preview-answer">✓ {question.answer}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <footer className="quiz-ai-footer">
              <button type="button" className="quiz-ai-back-btn" onClick={() => setStep('keywords')}>
                ← Change key words
              </button>
              <div className="quiz-ai-footer-actions">
                <button type="button" className="quiz-ai-secondary-btn" onClick={handleGenerate}>
                  ↻ Regenerate
                </button>
                <button type="button" className="quiz-builder-save quiz-ai-cta" onClick={handleOpenInBuilder}>
                  Open in Builder →
                </button>
              </div>
            </footer>
          </>
        )}
      </div>

      {mediaTargetCard && (
        <MediaSearchPicker
          title="Pick a picture or GIF"
          initialQuery={mediaTargetCard.word}
          onClose={() => setMediaTargetKey(null)}
          onSelect={handleMediaSelect}
        />
      )}
    </div>
  );
}
