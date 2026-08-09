// Crossword generator shared by the maker screen and the PDF export.
// Each pass places words greedily: every already-placed letter is tried as an
// intersection point and the candidate that adds the most crossings while
// keeping the grid squarest wins. Several word orderings are tried and the best
// grid is kept. Deterministic, so the preview never jitters while typing.

export const MAX_WORDS = 15;
export const MIN_WORD_LENGTH = 2;

const ACROSS = 'across';
const DOWN = 'down';

const keyOf = (row, column) => `${row}:${column}`;

export function normalizeWord(value) {
  return value.replace(/[^a-z]/gi, '').toUpperCase();
}

// A single greedy pass can paint itself into a corner, so a handful of
// deterministic orderings are tried and the tidiest complete grid wins.
const ATTEMPTS = 14;

function createRandom(seed) {
  let value = seed >>> 0 || 1;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function orderingFor(usable, attempt) {
  const byLength = [...usable].sort((a, b) => b.word.length - a.word.length);
  if (attempt === 0) return byLength;

  const random = createRandom(attempt * 2654435761);
  const shuffled = [...usable];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }

  // Odd attempts stay length-first (just with different tie-breaks); even ones
  // keep the shuffle so a short word can anchor the grid.
  return attempt % 2 === 1
    ? shuffled.sort((a, b) => b.word.length - a.word.length)
    : shuffled;
}

export function buildCrossword(entries) {
  const usable = entries.filter((entry) => entry.word.length >= MIN_WORD_LENGTH);

  if (!usable.length) {
    return { rows: 0, columns: 0, cells: [], across: [], down: [], placed: [], skipped: [] };
  }

  let best = null;

  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const result = attemptLayout(orderingFor(usable, attempt));
    const score = result.placed.length * 1000
      - (result.rows + result.columns)
      - Math.abs(result.rows - result.columns);

    if (!best || score > best.score) best = { score, result };
    if (best.result.skipped.length === 0 && attempt >= 3) break;
  }

  const { result } = best;
  // Report skipped words in the order the teacher typed them.
  const placedIds = new Set(result.placed.map((item) => item.id));
  result.skipped = usable.filter((entry) => !placedIds.has(entry.id));

  return result;
}

function attemptLayout(ordered) {
  const grid = new Map();
  const placed = [];
  const bounds = { minRow: 0, maxRow: 0, minColumn: 0, maxColumn: 0 };

  const letterAt = (row, column) => grid.get(keyOf(row, column)) || '';

  // Returns how many letters the placement would share with words already on
  // the board, or -1 when the placement is illegal.
  function crossingsFor(word, row, column, direction) {
    const stepRow = direction === DOWN ? 1 : 0;
    const stepColumn = direction === ACROSS ? 1 : 0;

    // Both ends need a gap so two words never read as one.
    if (letterAt(row - stepRow, column - stepColumn)) return -1;
    if (letterAt(row + stepRow * word.length, column + stepColumn * word.length)) return -1;

    let crossings = 0;

    for (let index = 0; index < word.length; index += 1) {
      const cellRow = row + stepRow * index;
      const cellColumn = column + stepColumn * index;
      const existing = letterAt(cellRow, cellColumn);

      if (existing) {
        if (existing !== word[index]) return -1;
        crossings += 1;
      } else if (
        letterAt(cellRow + stepColumn, cellColumn + stepRow)
        || letterAt(cellRow - stepColumn, cellColumn - stepRow)
      ) {
        // A fresh letter sitting beside another word would create a nonsense
        // two-letter run in the perpendicular direction.
        return -1;
      }
    }

    return crossings;
  }

  function scoreFor(word, row, column, direction, crossings) {
    const endRow = direction === DOWN ? row + word.length - 1 : row;
    const endColumn = direction === ACROSS ? column + word.length - 1 : column;
    const width = Math.max(bounds.maxColumn, endColumn) - Math.min(bounds.minColumn, column) + 1;
    const height = Math.max(bounds.maxRow, endRow) - Math.min(bounds.minRow, row) + 1;

    return crossings * 14 - (width + height) - Math.abs(width - height);
  }

  function commit(entry, row, column, direction) {
    const stepRow = direction === DOWN ? 1 : 0;
    const stepColumn = direction === ACROSS ? 1 : 0;

    for (let index = 0; index < entry.word.length; index += 1) {
      grid.set(keyOf(row + stepRow * index, column + stepColumn * index), entry.word[index]);
    }

    const endRow = row + stepRow * (entry.word.length - 1);
    const endColumn = column + stepColumn * (entry.word.length - 1);
    bounds.minRow = Math.min(bounds.minRow, row);
    bounds.maxRow = Math.max(bounds.maxRow, endRow);
    bounds.minColumn = Math.min(bounds.minColumn, column);
    bounds.maxColumn = Math.max(bounds.maxColumn, endColumn);

    placed.push({ ...entry, row, column, direction });
  }

  function tryPlace(entry) {
    let best = null;

    placed.forEach((anchor) => {
      const anchorStepRow = anchor.direction === DOWN ? 1 : 0;
      const anchorStepColumn = anchor.direction === ACROSS ? 1 : 0;
      const direction = anchor.direction === ACROSS ? DOWN : ACROSS;

      for (let anchorIndex = 0; anchorIndex < anchor.word.length; anchorIndex += 1) {
        const letter = anchor.word[anchorIndex];
        const anchorRow = anchor.row + anchorStepRow * anchorIndex;
        const anchorColumn = anchor.column + anchorStepColumn * anchorIndex;

        for (let index = 0; index < entry.word.length; index += 1) {
          if (entry.word[index] !== letter) continue;

          const row = direction === DOWN ? anchorRow - index : anchorRow;
          const column = direction === ACROSS ? anchorColumn - index : anchorColumn;
          const crossings = crossingsFor(entry.word, row, column, direction);
          if (crossings < 1) continue;

          const score = scoreFor(entry.word, row, column, direction, crossings);
          if (!best || score > best.score) best = { row, column, direction, score };
        }
      }
    });

    if (!best) return false;
    commit(entry, best.row, best.column, best.direction);
    return true;
  }

  commit(ordered[0], 0, 0, ACROSS);

  let pending = ordered.slice(1).filter((entry) => !tryPlace(entry));

  // Words that had nowhere to go early on often fit once the grid has filled
  // out, so sweep the leftovers until a pass places nothing new.
  for (let sweep = 0; sweep < 2 && pending.length; sweep += 1) {
    const remaining = pending.filter((entry) => !tryPlace(entry));
    if (remaining.length === pending.length) break;
    pending = remaining;
  }

  return finalize(placed, pending, bounds);
}

function finalize(placed, skipped, bounds) {
  const rows = bounds.maxRow - bounds.minRow + 1;
  const columns = bounds.maxColumn - bounds.minColumn + 1;

  const shifted = placed.map((item) => ({
    ...item,
    row: item.row - bounds.minRow,
    column: item.column - bounds.minColumn,
  }));

  const letters = new Map();
  shifted.forEach(({ word, row, column, direction }) => {
    const stepRow = direction === DOWN ? 1 : 0;
    const stepColumn = direction === ACROSS ? 1 : 0;
    for (let index = 0; index < word.length; index += 1) {
      letters.set(keyOf(row + stepRow * index, column + stepColumn * index), word[index]);
    }
  });

  // Standard crossword numbering: row by row, a number for every cell that
  // starts an across or a down entry.
  const numbers = new Map();
  let counter = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (!letters.has(keyOf(row, column))) continue;

      const startsAcross = !letters.has(keyOf(row, column - 1)) && letters.has(keyOf(row, column + 1));
      const startsDown = !letters.has(keyOf(row - 1, column)) && letters.has(keyOf(row + 1, column));

      if (startsAcross || startsDown) {
        counter += 1;
        numbers.set(keyOf(row, column), counter);
      }
    }
  }

  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const letter = letters.get(keyOf(row, column));
      cells.push(letter
        ? { row, column, letter, number: numbers.get(keyOf(row, column)) || null }
        : { row, column, letter: null, number: null });
    }
  }

  const numbered = shifted
    .map((item) => ({ ...item, number: numbers.get(keyOf(item.row, item.column)) || 0 }))
    .sort((a, b) => a.number - b.number);

  return {
    rows,
    columns,
    cells,
    placed: numbered,
    across: numbered.filter((item) => item.direction === ACROSS),
    down: numbered.filter((item) => item.direction === DOWN),
    skipped,
  };
}
