// Printable crossword: page 1 is the worksheet, page 2 the answer key.

const INK = [16, 27, 76];
const SOFT_INK = [90, 100, 140];
const LINE = [40, 48, 96];
const PAGE = { width: 210, height: 297, margin: 16 };

function drawHeading(pdf, title, subtitle) {
  pdf.setTextColor(...SOFT_INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('PRINTABLE ACTIVITY', PAGE.margin, PAGE.margin + 2);

  pdf.setTextColor(...INK);
  pdf.setFontSize(22);
  pdf.text(title, PAGE.margin, PAGE.margin + 12);

  pdf.setTextColor(...SOFT_INK);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(subtitle, PAGE.width - PAGE.margin, PAGE.margin + 12, { align: 'right' });

  pdf.setDrawColor(...SOFT_INK);
  pdf.setLineWidth(0.3);
  pdf.line(PAGE.margin, PAGE.margin + 17, PAGE.width - PAGE.margin, PAGE.margin + 17);

  return PAGE.margin + 25;
}

function drawGrid(pdf, layout, top, withAnswers) {
  const available = PAGE.width - PAGE.margin * 2;
  const cell = Math.min(available / layout.columns, 130 / layout.rows, 9.5);
  const gridWidth = cell * layout.columns;
  const originX = (PAGE.width - gridWidth) / 2;

  pdf.setDrawColor(...LINE);
  pdf.setLineWidth(0.28);

  layout.cells.forEach((item) => {
    if (!item.letter) return;

    const x = originX + item.column * cell;
    const y = top + item.row * cell;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, cell, cell, 'FD');

    if (item.number) {
      pdf.setTextColor(...SOFT_INK);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(Math.max(3.6, cell * 0.3));
      pdf.text(String(item.number), x + cell * 0.11, y + cell * 0.32);
    }

    if (withAnswers) {
      pdf.setTextColor(...INK);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(cell * 1.7);
      pdf.text(item.letter, x + cell / 2, y + cell * 0.78, { align: 'center' });
    }
  });

  return top + cell * layout.rows + 10;
}

function drawClues(pdf, layout, top) {
  const columnWidth = (PAGE.width - PAGE.margin * 2 - 10) / 2;
  const columns = [
    { title: 'Across', items: layout.across, x: PAGE.margin },
    { title: 'Down', items: layout.down, x: PAGE.margin + columnWidth + 10 },
  ];

  let lowest = top;

  columns.forEach(({ title, items, x }) => {
    let y = top;

    pdf.setTextColor(...INK);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(title, x, y);
    y += 7;

    pdf.setFontSize(9.5);

    items.forEach((item) => {
      const label = `${item.number}.`;
      const clue = item.clue.trim() || item.word;
      const lines = pdf.splitTextToSize(clue, columnWidth - 9);

      if (y + lines.length * 4.6 > PAGE.height - PAGE.margin) return;

      pdf.setTextColor(...SOFT_INK);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, x, y);

      pdf.setTextColor(...INK);
      pdf.setFont('helvetica', 'normal');
      pdf.text(lines, x + 9, y);

      y += lines.length * 4.6 + 2.4;
    });

    lowest = Math.max(lowest, y);
  });

  return lowest;
}

function drawFooter(pdf) {
  pdf.setTextColor(...SOFT_INK);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('classbop.com', PAGE.width / 2, PAGE.height - 10, { align: 'center' });
}

export async function createCrosswordPdf({ title, layout }) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const safeTitle = title.trim() || 'My Crossword';

  pdf.setProperties({
    title: safeTitle,
    subject: `${layout.placed.length} word printable crossword`,
    author: 'ClassBop',
  });

  let cursor = drawHeading(pdf, safeTitle, 'Name: ______________________');
  cursor = drawGrid(pdf, layout, cursor, false);
  drawClues(pdf, layout, cursor);
  drawFooter(pdf);

  pdf.addPage();
  cursor = drawHeading(pdf, `${safeTitle} - Answer Key`, `${layout.placed.length} words`);
  drawGrid(pdf, layout, cursor, true);
  drawFooter(pdf);

  return pdf;
}

export async function downloadCrosswordPdf({ title, layout }) {
  const pdf = await createCrosswordPdf({ title, layout });
  const fileName = (title.trim() || 'my-crossword')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-crossword';

  pdf.save(`${fileName}-crossword.pdf`);
}
