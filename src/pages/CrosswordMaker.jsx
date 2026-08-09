import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MAX_WORDS, buildCrossword, normalizeWord } from '../tools/crossword/crosswordLayout';
import { downloadCrosswordPdf } from '../tools/crossword/crosswordPdf';
import './CrosswordMaker.css';

const STARTER_WORDS = [
  ['PLANET', 'A world that orbits a star'],
  ['COMET', 'A ball of ice and dust'],
  ['ROCKET', 'A vehicle that goes to space'],
  ['TELESCOPE', 'An instrument used to see far'],
  ['GALAXY', 'A huge system of stars'],
  ['ASTRONAUT', 'A person who travels in space'],
  ['SATELLITE', 'An object that orbits a planet'],
  ['GRAVITY', 'A force that pulls things down'],
];

let rowSequence = 0;
const createRow = (word = '', clue = '') => {
  rowSequence += 1;
  return { id: `row-${rowSequence}`, word, clue };
};

const starterRows = () => STARTER_WORDS.map(([word, clue]) => createRow(word, clue));
const blankRows = () => Array.from({ length: 4 }, () => createRow());

export default function CrosswordMaker() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('My Crossword');
  const [rows, setRows] = useState(starterRows);
  const [draggingId, setDraggingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const listRef = useRef(null);
  // The ref drives the drag itself (pointermove can fire before a re-render
  // lands); the state is only there to style the row being moved.
  const draggingRef = useRef(null);

  const entries = useMemo(() => rows
    .map((row) => ({ ...row, word: normalizeWord(row.word) }))
    .filter((row) => row.word.length > 0), [rows]);

  const layout = useMemo(() => buildCrossword(entries), [entries]);
  const hasGrid = layout.placed.length > 0;

  const updateRow = (id, patch) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id) => {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.id !== id) : [createRow()]));
  };

  const addRow = () => {
    setRows((current) => (current.length >= MAX_WORDS ? current : [...current, createRow()]));
  };

  const clearAll = () => {
    setTitle('My Crossword');
    setRows(blankRows());
  };

  const moveRow = (fromId, toId) => {
    if (fromId === toId) return;
    setRows((current) => {
      const fromIndex = current.findIndex((row) => row.id === fromId);
      const toIndex = current.findIndex((row) => row.id === toId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  // Reordering runs on pointer events rather than HTML5 drag-and-drop so the
  // grip works the same way under a finger as it does under a mouse.
  const startReorder = (event, id) => {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is an optimisation; the drag still tracks without it.
    }
    draggingRef.current = id;
    setDraggingId(id);
  };

  const trackReorder = (event) => {
    const activeId = draggingRef.current;
    const items = listRef.current?.querySelectorAll('[data-row-id]');
    if (!activeId || !items) return;

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
        moveRow(activeId, item.dataset.rowId);
      }
    });
  };

  const endReorder = () => {
    draggingRef.current = null;
    setDraggingId(null);
  };

  const handleDownload = async () => {
    if (!hasGrid || isSaving) return;
    setIsSaving(true);
    try {
      await downloadCrosswordPdf({ title, layout });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cw-page">
      <header className="cw-header">
        <button type="button" className="cw-back" onClick={() => navigate('/activities')}>
          <ArrowIcon />
          Activities
        </button>

        <div className="cw-title-block">
          <p className="cw-kicker">
            <SparkIcon />
            Printable activity
            <SparkIcon />
          </p>
          <h1>
            <span className="cw-title-glyph" aria-hidden="true"><GridGlyph /></span>
            Crossword Maker
          </h1>
          <p className="cw-subtitle">Create a custom crossword from your words and prompts.</p>
          <span className="cw-count">{entries.length} / {MAX_WORDS} words</span>
        </div>

        <button type="button" className="cw-clear" onClick={clearAll}>
          <TrashIcon />
          Clear all
        </button>
      </header>

      <main className="cw-layout">
        <section className="cw-panel cw-bank" aria-label="Crossword word list">
          <div className="cw-panel-head">
            <span className="cw-panel-badge" aria-hidden="true"><BankIcon /></span>
            <div>
              <p>Word bank</p>
              <h2>Words and prompts</h2>
            </div>
          </div>

          <label className="cw-title-field">
            <span>Worksheet title</span>
            <div className="cw-title-input">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="My Crossword"
                maxLength={48}
              />
              <PencilIcon />
            </div>
          </label>

          <ul className="cw-rows" ref={listRef}>
            {rows.map((row, index) => {
              const word = normalizeWord(row.word);

              return (
                <li
                  key={row.id}
                  data-row-id={row.id}
                  className={`cw-row${draggingId === row.id ? ' is-dragging' : ''}`}
                >
                  <span
                    className="cw-row-grip"
                    title="Drag to reorder"
                    onPointerDown={(event) => startReorder(event, row.id)}
                    onPointerMove={trackReorder}
                    onPointerUp={endReorder}
                    onPointerCancel={endReorder}
                  >
                    <GripIcon />
                  </span>

                  <span className="cw-row-number">{index + 1}</span>

                  <label className="cw-row-field cw-row-word">
                    <span>Word</span>
                    <input
                      value={word}
                      onChange={(event) => updateRow(row.id, { word: normalizeWord(event.target.value) })}
                      placeholder="PLANET"
                      spellCheck="false"
                      maxLength={16}
                    />
                  </label>

                  <label className="cw-row-field cw-row-clue">
                    <span>Prompt</span>
                    <input
                      value={row.clue}
                      onChange={(event) => updateRow(row.id, { clue: event.target.value })}
                      placeholder="A world that orbits a star"
                    />
                  </label>

                  <button
                    type="button"
                    className="cw-row-remove"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Remove word ${index + 1}`}
                  >
                    <TrashIcon />
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            className="cw-add"
            onClick={addRow}
            disabled={rows.length >= MAX_WORDS}
          >
            <span aria-hidden="true">+</span>
            {rows.length >= MAX_WORDS ? `Maximum ${MAX_WORDS} words` : 'Add another word'}
          </button>

          {layout.skipped.length > 0 && (
            <p className="cw-note">
              No shared letters for {layout.skipped.map((item) => item.word).join(', ')} — swap a word or add
              one that overlaps.
            </p>
          )}
        </section>

        <section className="cw-panel cw-preview" aria-label="Crossword preview">
          <div className="cw-preview-top">
            <p className="cw-preview-kicker">Crossword preview</p>
            <button
              type="button"
              className="cw-download"
              onClick={handleDownload}
              disabled={!hasGrid || isSaving}
            >
              <DownloadIcon />
              {isSaving ? 'Preparing…' : 'Download PDF'}
            </button>
          </div>

          <div className="cw-preview-title-row">
            <h2>{title.trim() || 'My Crossword'}</h2>
            <p className="cw-name-line">Name: <i /></p>
          </div>

          <div className="cw-sheet">
            <StarIcon className="cw-star cw-star-one" />
            <StarIcon className="cw-star cw-star-two" />

            {hasGrid ? (
              <div
                className="cw-grid"
                style={{ '--cw-columns': layout.columns, '--cw-rows': layout.rows }}
                aria-label={`Crossword grid, ${layout.columns} by ${layout.rows}`}
              >
                {layout.cells.map((cell) => (
                  <span
                    key={`${cell.row}-${cell.column}`}
                    className={cell.letter ? 'cw-cell is-open' : 'cw-cell'}
                  >
                    {cell.number && <em>{cell.number}</em>}
                  </span>
                ))}
              </div>
            ) : (
              <p className="cw-empty">
                Add at least two words that share a letter and the grid builds itself.
              </p>
            )}
          </div>

          <div className="cw-clues">
            <ClueList title="Across" arrow="→" items={layout.across} />
            <ClueList title="Down" arrow="↓" items={layout.down} />
          </div>
        </section>
      </main>
    </div>
  );
}

function ClueList({ title, arrow, items }) {
  return (
    <section className="cw-clue-list">
      <h3>
        {title}
        <span aria-hidden="true">{arrow}</span>
      </h3>
      {items.length ? (
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <span className="cw-clue-number">{item.number}</span>
              <span className="cw-clue-text">{item.clue.trim() || item.word}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p>Clues appear here.</p>
      )}
    </section>
  );
}

/* ---- icons ---- */

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path d="M12 0c1.2 7.6 3.2 10.8 12 12-8.8 1.2-10.8 4.4-12 12-1.2-7.6-3.2-10.8-12-12C8.8 10.8 10.8 7.6 12 0Z" fill="currentColor" />
    </svg>
  );
}

function StarIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5 14.9 9l6.6.6-5 4.4 1.5 6.5L12 17l-6 3.5 1.5-6.5-5-4.4L9.1 9Z" />
    </svg>
  );
}

function GridGlyph() {
  return (
    <svg viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="30" height="30" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M13 3v30M23 3v30M3 13h30M3 23h30" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <path d="M26 34.5 36.5 24l5 5L31 39.5l-6 1.5Z" fill="#ffc93c" stroke="#101b4c" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M8 9h1.5M8 13h1.5M13 9h3M13 13h3M8.75 4.5v15" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L20 8l-4-4L4 16Z" />
      <path d="M14.5 5.5 18.5 9.5" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor" aria-hidden="true">
      {[2, 8, 14].map((y) => [2, 8].map((x) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" />
      )))}
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6.5h16M9.5 6.5V4.5h5v2M6.5 6.5 7.5 20h9l1-13.5M10 10v6.5M14 10v6.5" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v11M7.5 10 12 14.5 16.5 10M4 19h16" />
    </svg>
  );
}
