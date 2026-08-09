import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './WordSearchMaker.css';

const DEFAULT_GRID_SIZE = 15;
const GRID_SIZE_OPTIONS = [10, 12, 15, 18];
const MAX_WORDS = 18;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIRECTION_OPTIONS = [
  { id: 'east', label: 'Right', symbol: '→', row: 0, column: 1 },
  { id: 'south', label: 'Down', symbol: '↓', row: 1, column: 0 },
  { id: 'southEast', label: 'Down right', symbol: '↘', row: 1, column: 1 },
  { id: 'northEast', label: 'Up right', symbol: '↗', row: -1, column: 1 },
  { id: 'west', label: 'Left', symbol: '←', row: 0, column: -1 },
  { id: 'north', label: 'Up', symbol: '↑', row: -1, column: 0 },
  { id: 'northWest', label: 'Up left', symbol: '↖', row: -1, column: -1 },
  { id: 'southWest', label: 'Down left', symbol: '↙', row: 1, column: -1 },
];
const DEFAULT_DIRECTION_IDS = ['east', 'south', 'southEast'];
const WORD_COLORS = [
  '#6D5DF6',
  '#0EA5E9',
  '#16A34A',
  '#D97706',
  '#DB2777',
  '#7C3AED',
  '#0891B2',
  '#DC2626',
  '#4F46E5',
  '#059669',
];

function normalizeWord(value) {
  return value.replace(/[^a-z]/gi, '').toUpperCase();
}

function parseWords(value) {
  const seen = new Set();
  return value
    .split(/[\n,]+/)
    .map(normalizeWord)
    .filter((word) => word.length >= 2)
    .filter((word) => {
      if (seen.has(word)) return false;
      seen.add(word);
      return true;
    })
    .slice(0, MAX_WORDS);
}

function createRandom(seed) {
  let value = seed || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createSeed(title, words, nonce, gridSize) {
  const source = `${title}|${words.join('|')}|${gridSize}|${nonce}`;
  return source.split('').reduce((hash, character) => (
    ((hash << 5) - hash + character.charCodeAt(0)) >>> 0
  ), 2166136261);
}

function emptyGrid(gridSize) {
  return Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => ''));
}

function canPlaceWord(grid, word, startRow, startColumn, direction, gridSize) {
  for (let index = 0; index < word.length; index += 1) {
    const row = startRow + direction.row * index;
    const column = startColumn + direction.column * index;
    if (row < 0 || row >= gridSize || column < 0 || column >= gridSize) return false;
    if (grid[row][column] && grid[row][column] !== word[index]) return false;
  }
  return true;
}

function placeWord(grid, word, startRow, startColumn, direction) {
  const cells = [];
  for (let index = 0; index < word.length; index += 1) {
    const row = startRow + direction.row * index;
    const column = startColumn + direction.column * index;
    grid[row][column] = word[index];
    cells.push(`${row}-${column}`);
  }
  return cells;
}

function shuffle(items, random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
  }
  return shuffled;
}

function buildWordSearch(words, title, nonce, enabledDirectionIds = DEFAULT_DIRECTION_IDS, gridSize = DEFAULT_GRID_SIZE) {
  const random = createRandom(createSeed(title, words, nonce, gridSize));
  const allowedDirections = DIRECTION_OPTIONS.filter((direction) => enabledDirectionIds.includes(direction.id));
  const grid = emptyGrid(gridSize);
  const placedWords = [];
  const missedWords = [];

  [...words].sort((a, b) => b.length - a.length).forEach((word) => {
    if (word.length > gridSize) {
      missedWords.push(word);
      return;
    }

    const directions = shuffle(allowedDirections, random);
    let placed = false;

    for (let attempt = 0; attempt < 180 && !placed; attempt += 1) {
      const direction = directions[attempt % directions.length];
      const startRow = Math.floor(random() * gridSize);
      const startColumn = Math.floor(random() * gridSize);

      if (canPlaceWord(grid, word, startRow, startColumn, direction, gridSize)) {
        placedWords.push({
          word,
          directionId: direction.id,
          cells: placeWord(grid, word, startRow, startColumn, direction),
        });
        placed = true;
      }
    }

    if (!placed) missedWords.push(word);
  });

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      if (!grid[row][column]) {
        grid[row][column] = ALPHABET[Math.floor(random() * ALPHABET.length)];
      }
    }
  }

  return { grid, placedWords, missedWords };
}

export default function WordSearchMaker() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Space Vocabulary');
  const [wordRows, setWordRows] = useState([]);
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [enabledDirectionIds, setEnabledDirectionIds] = useState(DEFAULT_DIRECTION_IDS);
  const [nonce, setNonce] = useState(1);

  const wordText = useMemo(() => wordRows.join('\n'), [wordRows]);
  const words = useMemo(() => parseWords(wordText), [wordText]);
  const puzzle = useMemo(() => buildWordSearch(words, title, nonce, enabledDirectionIds, gridSize), [words, title, nonce, enabledDirectionIds, gridSize]);
  const placedSet = useMemo(() => new Set(puzzle.placedWords.map((item) => item.word)), [puzzle.placedWords]);
  const enabledDirections = useMemo(() => (
    DIRECTION_OPTIONS.filter((direction) => enabledDirectionIds.includes(direction.id))
  ), [enabledDirectionIds]);
  const answerCellColors = useMemo(() => {
    const nextColors = new Map();

    puzzle.placedWords.forEach((item, wordIndex) => {
      const color = WORD_COLORS[wordIndex % WORD_COLORS.length];
      item.cells.forEach((cell) => {
        if (!nextColors.has(cell)) nextColors.set(cell, color);
      });
    });

    return nextColors;
  }, [puzzle.placedWords]);

  const updateWordRow = (index, value) => {
    const nextRows = [...wordRows];
    nextRows[index] = value.toUpperCase();
    setWordRows(nextRows);
  };

  const deleteWordRow = (index) => {
    setWordRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const addWordRow = () => {
    if (wordRows.length >= MAX_WORDS) return;
    setWordRows((current) => [...current, '']);
  };

  const toggleDirection = (directionId) => {
    setEnabledDirectionIds((current) => {
      if (current.includes(directionId)) {
        return current.length === 1 ? current : current.filter((id) => id !== directionId);
      }

      return [...current, directionId];
    });
    setNonce((value) => value + 1);
  };

  const handleGridSizeChange = (nextSize) => {
    setGridSize(nextSize);
    setNonce((value) => value + 1);
  };

  return (
    <div className="word-search-page">
      <div className="word-search-dot-field word-search-dot-field-top" aria-hidden="true" />
      <div className="word-search-orb" aria-hidden="true" />
      <header className="word-search-header">
        <button type="button" className="word-search-back" onClick={() => navigate('/activities')}>
          <span aria-hidden="true">←</span> Activities
        </button>
        <div className="word-search-title-block">
          <p><SparkleIcon /> PRINTABLE ACTIVITY <SparkleIcon /></p>
          <h1>Word Search Maker</h1>
          <span>{puzzle.placedWords.length} / {words.length || 0} words placed</span>
        </div>
        <button type="button" className="word-search-print" onClick={() => window.print()}>
          <PrintIcon /> Print
        </button>
      </header>

      <main className="word-search-layout">
        <section className="word-search-entry-panel" aria-label="Word search setup">
          <div className="word-search-panel-heading">
            <span className="word-search-tool-icon" aria-hidden="true"><SearchDocIcon /></span>
            <div>
              <p>WORD BANK</p>
              <h2>Build a puzzle</h2>
            </div>
          </div>

          <label className="word-search-title-input">
            <span>Worksheet title</span>
            <span className="word-search-title-field">
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
              <PencilIcon />
            </span>
          </label>

          <div className="word-search-size-picker" aria-label="Grid size">
            <span>Grid size</span>
            <div>
              {GRID_SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={gridSize === size ? 'is-active' : ''}
                  onClick={() => handleGridSizeChange(size)}
                  aria-pressed={gridSize === size}
                >
                  {size} x {size}
                </button>
              ))}
            </div>
          </div>

          <div className="word-search-words-editor">
            <div className="word-search-editor-label">
              <span>Words ({words.length})</span>
            </div>
            <div className="word-search-direction-picker" aria-label="Allowed word directions">
              {DIRECTION_OPTIONS.map((direction) => {
                const isActive = enabledDirectionIds.includes(direction.id);

                return (
                  <button
                    key={direction.id}
                    type="button"
                    className={isActive ? 'is-active' : ''}
                    onClick={() => toggleDirection(direction.id)}
                    aria-pressed={isActive}
                    title={direction.label}
                  >
                    <span aria-hidden="true">{direction.symbol}</span>
                    <em>{direction.label}</em>
                  </button>
                );
              })}
            </div>
            <div className="word-search-editor-body">
              <div className="word-search-word-rows">
                {wordRows.map((row, index) => {
                  const normalized = normalizeWord(row);
                  const isMissed = normalized.length >= 2 && !placedSet.has(normalized);

                  return (
                    <div key={`${index}-${wordRows.length}`} className={`word-search-word-row${isMissed ? ' is-missed' : ''}`}>
                      <span className="word-search-grip" aria-hidden="true"><GripIcon /></span>
                      <span className="word-search-row-number">{index + 1}</span>
                      <input
                        value={row}
                        onChange={(event) => updateWordRow(index, event.target.value)}
                        placeholder="WORD"
                        spellCheck="false"
                        aria-label={`Word ${index + 1}`}
                      />
                      <button type="button" onClick={() => deleteWordRow(index)} aria-label={`Delete word ${index + 1}`}>
                        <TrashIcon />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="word-search-add-rail"
                onClick={addWordRow}
                disabled={wordRows.length >= MAX_WORDS}
              >
                <span aria-hidden="true">+</span>
                Add word
              </button>
            </div>
          </div>

          <div className="word-search-actions">
            <button type="button" onClick={() => setNonce((value) => value + 1)} disabled={words.length === 0}>
              <WandIcon /> Regenerate
            </button>
            <button type="button" onClick={() => setWordRows([])}>
              <TrashIcon /> Clear
            </button>
          </div>

          <p className="word-search-tip"><BulbIcon /> <strong>Tip:</strong> Edit words in the list, then regenerate a fresh puzzle.</p>

          {puzzle.missedWords.length > 0 && (
            <p className="word-search-warning">
              Shorten or remove: {puzzle.missedWords.join(', ')}
            </p>
          )}
        </section>

        <section className="word-search-preview-panel" aria-label="Word search preview">
          <article className="word-search-card">
            <div className="word-search-card-topline">
              <span>CLASSBOP WORD SEARCH</span>
              <strong>{gridSize} x {gridSize}</strong>
            </div>

            <div className="word-search-card-heading">
              <h2>{title.trim() || 'My Word Search'}</h2>
              <p>Name <i /></p>
            </div>

            <div className="word-search-worksheet-body">
              <div
                className="word-search-grid"
                aria-label="Generated word search grid"
                style={{ '--word-search-grid-size': gridSize }}
              >
                {puzzle.grid.flatMap((row, rowIndex) => row.map((letter, columnIndex) => {
                  const key = `${rowIndex}-${columnIndex}`;
                  const answerColor = answerCellColors.get(key);
                  return (
                    <span
                      key={key}
                      className={`word-search-grid-letter${answerColor ? ' is-answer-letter' : ''}`}
                      style={answerColor ? { '--word-answer-color': answerColor } : undefined}
                    >
                      {letter}
                    </span>
                  );
                }))}
              </div>

              <aside className="word-search-card-bank" aria-label="Word list">
                <div className="word-search-bank-title">
                  <strong>WORD LIST</strong>
                  <StarIcon />
                </div>
                {puzzle.placedWords.length ? puzzle.placedWords.map(({ word }, index) => (
                  <span key={word}>
                    <i>{index + 1}</i>
                    {word}
                  </span>
                )) : (
                  <p>Words will appear here.</p>
                )}
              </aside>
            </div>

            <div className="word-search-direction-hint">
              <strong>Directions:</strong>
              {enabledDirections.map((direction) => (
                <span key={direction.id}>
                  <i aria-hidden="true">{direction.symbol}</i>
                  {direction.label}
                </span>
              ))}
            </div>

          </article>
        </section>
      </main>
    </div>
  );
}

function SearchDocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5h8l4 4V13" />
      <path d="M14 3.5V8h4" />
      <path d="M8 11h5M8 14h3" />
      <circle cx="15" cy="16" r="3.1" />
      <path d="m17.3 18.3 2.2 2.2" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 8V4h10v4" />
      <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v6H7z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <circle cx="7" cy="5" r="1.2" />
      <circle cx="13" cy="5" r="1.2" />
      <circle cx="7" cy="10" r="1.2" />
      <circle cx="13" cy="10" r="1.2" />
      <circle cx="7" cy="15" r="1.2" />
      <circle cx="13" cy="15" r="1.2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6 18 20H6L5 6" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function WandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 19 9-9" />
      <path d="m13 6 5 5" />
      <path d="M6 5v3M4.5 6.5h3M19 16v3M17.5 17.5h3" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8 14a6 6 0 1 1 8 0c-.7.7-1 1.4-1 2H9c0-.6-.3-1.3-1-2Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5 9.2 6.4 14 8 9.2 9.6 8 14.5 6.8 9.6 2 8l4.8-1.6Z" />
    </svg>
  );
}
