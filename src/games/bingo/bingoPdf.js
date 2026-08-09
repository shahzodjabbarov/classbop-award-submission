import { createEmojiImage } from './bingoEmojiImage';
import { getBingoItemEmoji, getBingoItemImage, getBingoItemLabel } from './bingoGames';

const INK = [17, 24, 39];
const SOFT_INK = [92, 101, 114];
const PAPER = [247, 252, 255];
const WHITE = [255, 255, 255];
const PATTERN = [225, 239, 255];
const SUNSHINE = [255, 235, 0];
const SKY = [91, 192, 235];
const MINT = [105, 219, 124];
const PINK = [255, 139, 201];
const BABY_BLUE = [229, 248, 255];
const POINT_TO_MM = 0.352778;

function drawEmoji(pdf, emoji, centerX, topY, size) {
  const image = createEmojiImage(emoji);

  if (image) {
    pdf.addImage(image, 'PNG', centerX - size / 2, topY, size, size);
    return;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(size * 1.9);
  pdf.text(emoji, centerX, topY + size * 0.72, { align: 'center' });
}

function getDataUrlFormat(dataUrl) {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'JPEG';
}

function drawContainedImage(pdf, image, x, y, boxWidth, boxHeight) {
  if (!image.startsWith('data:image/')) return false;

  try {
    pdf.addImage(image, getDataUrlFormat(image), x, y, boxWidth, boxHeight, undefined, 'FAST');
    return true;
  } catch {
    return false;
  }
}

function wrapText(pdf, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (!currentLine || pdf.getTextWidth(nextLine) <= maxWidth) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [String(text)];
}

function fitLabel(pdf, label, maxWidth, maxLines, maxFontSize, minFontSize) {
  for (let fontSize = maxFontSize; fontSize >= minFontSize; fontSize -= 0.25) {
    pdf.setFontSize(fontSize);
    const lines = wrapText(pdf, label, maxWidth);

    if (lines.length <= maxLines && lines.every((line) => pdf.getTextWidth(line) <= maxWidth)) {
      return { fontSize, lines };
    }
  }

  pdf.setFontSize(minFontSize);
  return {
    fontSize: minFontSize,
    lines: wrapText(pdf, label, maxWidth).slice(0, maxLines),
  };
}

function getPageSlots(pdf, cardsPerPage) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 7;
  const gap = 5;

  if (cardsPerPage === 1) {
    return [{ x: margin, y: margin, width: pageWidth - margin * 2, height: pageHeight - margin * 2 }];
  }

  if (cardsPerPage === 2) {
    const width = (pageWidth - margin * 2 - gap) / 2;
    return [
      { x: margin, y: margin, width, height: pageHeight - margin * 2 },
      { x: margin + width + gap, y: margin, width, height: pageHeight - margin * 2 },
    ];
  }

  if (cardsPerPage === 3) {
    const width = (pageWidth - margin * 2 - gap * 2) / 3;
    return [
      { x: margin, y: margin, width, height: pageHeight - margin * 2 },
      { x: margin + width + gap, y: margin, width, height: pageHeight - margin * 2 },
      { x: margin + (width + gap) * 2, y: margin, width, height: pageHeight - margin * 2 },
    ];
  }

  const width = (pageWidth - margin * 2 - gap) / 2;
  const height = (pageHeight - margin * 2 - gap) / 2;
  return [
    { x: margin, y: margin, width, height },
    { x: margin + width + gap, y: margin, width, height },
    { x: margin, y: margin + height + gap, width, height },
    { x: margin + width + gap, y: margin + height + gap, width, height },
  ];
}

function drawCutGuides(pdf, cardsPerPage) {
  if (cardsPerPage === 1) return;

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setDrawColor(185, 190, 196);
  pdf.setLineWidth(0.25);
  pdf.setLineDashPattern([2, 2], 0);
  if (cardsPerPage === 2) {
    pdf.line(pageWidth / 2, 3, pageWidth / 2, pageHeight - 3);
  }

  if (cardsPerPage === 3) {
    pdf.line(pageWidth / 3, 3, pageWidth / 3, pageHeight - 3);
    pdf.line((pageWidth / 3) * 2, 3, (pageWidth / 3) * 2, pageHeight - 3);
  }

  if (cardsPerPage === 4) {
    pdf.line(pageWidth / 2, 3, pageWidth / 2, pageHeight - 3);
    pdf.line(3, pageHeight / 2, pageWidth - 3, pageHeight / 2);
  }

  pdf.setLineDashPattern([], 0);
}

function drawBrandPattern(pdf, slot) {
  pdf.setTextColor(...PATTERN);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(slot.width < 110 ? 5.2 : 6.5);

  const horizontalStep = slot.width < 110 ? 30 : 38;
  const verticalStep = slot.height < 160 ? 23 : 28;
  const rightEdge = slot.x + slot.width - 17;
  const bottomEdge = slot.y + slot.height - 5;

  for (let y = slot.y + 10; y < bottomEdge; y += verticalStep) {
    const offset = Math.floor((y - slot.y) / verticalStep) % 2 === 0 ? 0 : horizontalStep / 2;
    for (let x = slot.x + 6 + offset; x < rightEdge; x += horizontalStep) {
      pdf.text('classbop.com', x, y, { angle: -18 });
    }
  }
}

function drawAngledLine(pdf, centerX, centerY, length, angleDegrees) {
  const radians = (angleDegrees * Math.PI) / 180;
  const halfX = Math.cos(radians) * length / 2;
  const halfY = Math.sin(radians) * length / 2;
  pdf.line(centerX - halfX, centerY - halfY, centerX + halfX, centerY + halfY);
}

function drawConfetti(pdf, slot) {
  const isCompact = slot.width < 110;
  const marks = [
    { color: PINK, x: 0.13, y: 0.08, angle: 18 },
    { color: SKY, x: 0.87, y: 0.08, angle: -20 },
    { color: MINT, x: 0.09, y: 0.27, angle: -12 },
    { color: SUNSHINE, x: 0.91, y: 0.27, angle: 14 },
    { color: SKY, x: 0.12, y: 0.81, angle: 22 },
    { color: PINK, x: 0.88, y: 0.82, angle: -18 },
  ];
  const size = isCompact ? 2.5 : 3.7;

  pdf.setLineWidth(isCompact ? 0.45 : 0.65);
  marks.forEach((mark, index) => {
    const x = slot.x + slot.width * mark.x;
    const y = slot.y + slot.height * mark.y;
    pdf.setDrawColor(...mark.color);

    if (index % 2 === 0) {
      drawAngledLine(pdf, x, y, size, mark.angle);
      drawAngledLine(pdf, x, y, size, mark.angle + 90);
      return;
    }

    pdf.setFillColor(...mark.color);
    pdf.circle(x, y, size * 0.34, 'F');
  });
}

function drawPlayfulFrame(pdf, slot) {
  const x = slot.x + 1.2;
  const y = slot.y + 1.2;
  const width = slot.width - 2.4;
  const height = slot.height - 2.4;
  const radius = slot.width < 110 ? 3 : 4.5;

  pdf.setFillColor(...PAPER);
  pdf.setDrawColor(...SKY);
  pdf.setLineWidth(slot.width < 110 ? 0.75 : 1.05);
  pdf.roundedRect(x, y, width, height, radius, radius, 'FD');

  pdf.setDrawColor(178, 222, 247);
  pdf.setLineWidth(0.3);
  pdf.setLineDashPattern([2.2, 1.6], 0);
  pdf.roundedRect(x + 2.1, y + 2.1, width - 4.2, height - 4.2, radius - 0.6, radius - 0.6, 'S');
  pdf.setLineDashPattern([], 0);

  const dotRadius = slot.width < 110 ? 0.65 : 0.9;
  [
    { color: SKY, point: [x + 4.2, y + 4.2] },
    { color: PINK, point: [x + width - 4.2, y + 4.2] },
    { color: MINT, point: [x + 4.2, y + height - 4.2] },
    { color: SUNSHINE, point: [x + width - 4.2, y + height - 4.2] },
  ].forEach(({ color, point: [dotX, dotY] }) => {
    pdf.setFillColor(...color);
    pdf.circle(dotX, dotY, dotRadius, 'F');
  });

  drawBrandPattern(pdf, slot);
  drawConfetti(pdf, slot);
}

function drawTitleRibbon(pdf, centerX, titleY, isCompact, slotWidth) {
  const width = Math.min(slotWidth * 0.58, isCompact ? 52 : 86);
  const height = isCompact ? 8.5 : 13;
  const x = centerX - width / 2;
  const y = titleY - height + (isCompact ? 1.4 : 2.2);

  pdf.setFillColor(...SUNSHINE);
  pdf.setDrawColor(...SKY);
  pdf.setLineWidth(isCompact ? 0.5 : 0.7);
  pdf.roundedRect(x, y, width, height, isCompact ? 2 : 3, isCompact ? 2 : 3, 'FD');

  pdf.setDrawColor(...PINK);
  pdf.setLineWidth(isCompact ? 0.45 : 0.6);
  pdf.line(x + width * 0.16, y + height - 1.5, x + width * 0.84, y + height - 1.5);
}

function drawFooterRibbon(pdf, slot, isCompact) {
  const width = Math.min(slot.width * 0.72, isCompact ? 68 : 118);
  const height = isCompact ? 6.8 : 9;
  const x = slot.x + (slot.width - width) / 2;
  const y = slot.y + slot.height - (isCompact ? 10.2 : 13.8);

  pdf.setFillColor(...BABY_BLUE);
  pdf.setDrawColor(...SKY);
  pdf.setLineWidth(isCompact ? 0.35 : 0.5);
  pdf.roundedRect(x, y, width, height, isCompact ? 2.4 : 3, isCompact ? 2.4 : 3, 'FD');

  [
    { color: PINK, dotX: x + (isCompact ? 3.8 : 5.5) },
    { color: MINT, dotX: x + width - (isCompact ? 3.8 : 5.5) },
  ].forEach(({ color, dotX }) => {
    pdf.setFillColor(...color);
    pdf.circle(dotX, y + height / 2, isCompact ? 0.9 : 1.25, 'F');
  });
}

function drawGrid(pdf, cells, gridSize, x, y, outerSize, isCompact) {
  const framePadding = isCompact ? 1.7 : 2.4;
  const gridX = x + framePadding;
  const gridY = y + framePadding;
  const gridSizeMm = outerSize - framePadding * 2;
  const gap = isCompact ? 0.75 : 1.1;
  const cellSize = (gridSizeMm - gap * (gridSize - 1)) / gridSize;

  pdf.setFillColor(...WHITE);
  pdf.setDrawColor(...INK);
  pdf.setLineWidth(isCompact ? 0.65 : 0.9);
  pdf.roundedRect(x, y, outerSize, outerSize, isCompact ? 2.2 : 3.2, isCompact ? 2.2 : 3.2, 'FD');

  pdf.setDrawColor(...SOFT_INK);
  pdf.setLineWidth(0.25);
  pdf.setLineDashPattern([1.5, 1.2], 0);
  pdf.roundedRect(
    x + (isCompact ? 1 : 1.4),
    y + (isCompact ? 1 : 1.4),
    outerSize - (isCompact ? 2 : 2.8),
    outerSize - (isCompact ? 2 : 2.8),
    isCompact ? 1.7 : 2.5,
    isCompact ? 1.7 : 2.5,
    'S',
  );
  pdf.setLineDashPattern([], 0);

  cells.forEach((cell, index) => {
    const row = Math.floor(index / gridSize);
    const column = index % gridSize;
    const cellX = gridX + column * (cellSize + gap);
    const cellY = gridY + row * (cellSize + gap);

    pdf.setFillColor(...WHITE);
    pdf.setDrawColor(...INK);
    pdf.setLineWidth(isCompact ? 0.45 : 0.6);
    pdf.roundedRect(cellX, cellY, cellSize, cellSize, isCompact ? 0.7 : 1.1, isCompact ? 0.7 : 1.1, 'FD');

    const emoji = getBingoItemEmoji(cell);
    const image = getBingoItemImage(cell);
    const label = getBingoItemLabel(cell);

    pdf.setTextColor(...INK);
    pdf.setFont('helvetica', 'bold');

    if (image) {
      const hasLabel = Boolean(label);
      const padding = Math.max(1.2, cellSize * 0.08);
      const labelHeight = hasLabel ? Math.max(4.5, cellSize * 0.2) : 0;
      const imageBoxHeight = cellSize - padding * 2 - labelHeight;
      const imageSize = Math.max(1, Math.min(cellSize - padding * 2, imageBoxHeight));
      const imageX = cellX + (cellSize - imageSize) / 2;
      const imageY = cellY + padding + Math.max(0, (imageBoxHeight - imageSize) / 2);
      const didDrawImage = drawContainedImage(pdf, image, imageX, imageY, imageSize, imageSize);

      if (hasLabel) {
        const maxFontSize = Math.min(isCompact ? 5.8 : 8, Math.max(isCompact ? 3.8 : 5, cellSize * 0.15));
        const minFontSize = isCompact ? 3.1 : 4;
        const { fontSize, lines } = fitLabel(pdf, label, cellSize - padding * 2, 2, maxFontSize, minFontSize);
        const lineHeight = fontSize * POINT_TO_MM * 1.04;
        const firstBaseline = cellY + cellSize - padding - lineHeight * (lines.length - 1);
        pdf.setFontSize(fontSize);
        lines.forEach((line, lineIndex) => {
          pdf.text(line, cellX + cellSize / 2, firstBaseline + lineIndex * lineHeight, { align: 'center' });
        });
      } else if (!didDrawImage) {
        pdf.setFontSize(Math.min(isCompact ? 7 : 10, cellSize * 0.2));
        pdf.text('Picture', cellX + cellSize / 2, cellY + cellSize / 2, { align: 'center', baseline: 'middle' });
      }
      return;
    }

    if (emoji) {
      const emojiSize = Math.min(isCompact ? 8.5 : 16, Math.max(isCompact ? 4.8 : 7, cellSize * 0.34));
      const maxFontSize = Math.min(isCompact ? 5.8 : 8.8, Math.max(isCompact ? 3.8 : 5.4, cellSize * 0.18));
      const minFontSize = isCompact ? 3.2 : 4.2;
      const maxLines = cellSize < 16 ? 2 : 3;
      const { fontSize, lines } = fitLabel(pdf, label, cellSize - 2.2, maxLines, maxFontSize, minFontSize);
      const lineHeight = fontSize * POINT_TO_MM * 1.08;
      const gapY = Math.max(0.8, cellSize * 0.05);
      const contentHeight = emojiSize + gapY + lineHeight * lines.length;
      const emojiTop = cellY + (cellSize - contentHeight) / 2;
      const firstBaseline = emojiTop + emojiSize + gapY + fontSize * POINT_TO_MM * 0.78;

      drawEmoji(pdf, emoji, cellX + cellSize / 2, emojiTop, emojiSize);
      pdf.setFontSize(fontSize);
      lines.forEach((line, lineIndex) => {
        pdf.text(line, cellX + cellSize / 2, firstBaseline + lineIndex * lineHeight, { align: 'center' });
      });
      return;
    }

    const maxFontSize = Math.min(isCompact ? 14 : 22, Math.max(isCompact ? 7 : 10, cellSize * 0.32));
    const minFontSize = isCompact ? 4.5 : 6;
    const { fontSize, lines } = fitLabel(pdf, label, cellSize - 3, cellSize < 18 ? 3 : 4, maxFontSize, minFontSize);
    const lineHeight = fontSize * POINT_TO_MM * 1.12;
    const firstBaseline = cellY + cellSize / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize * POINT_TO_MM * 0.34;
    pdf.setFontSize(fontSize);
    lines.forEach((line, lineIndex) => {
      pdf.text(line, cellX + cellSize / 2, firstBaseline + lineIndex * lineHeight, { align: 'center' });
    });
  });
}

function drawCard(pdf, game, gridSize, cells, cardNumber, totalCards, slot) {
  const isCompact = slot.width < 110;
  const centerX = slot.x + slot.width / 2;
  const frameInset = isCompact ? 6 : 8;
  const titleY = slot.y + (isCompact ? 10 : 13);
  const detailsY = titleY + (isCompact ? 9 : 13);
  const headerBottom = detailsY + (isCompact ? 4 : 6);
  const footerHeight = isCompact ? 12 : 16;
  const availableBottom = slot.y + slot.height - footerHeight;

  drawPlayfulFrame(pdf, slot);
  drawFooterRibbon(pdf, slot, isCompact);

  drawTitleRibbon(pdf, centerX, titleY, isCompact, slot.width);
  pdf.setTextColor(...INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isCompact ? 15 : slot.width > 180 ? 27 : 20);
  pdf.text('BINGO', centerX, titleY, { align: 'center' });
  pdf.setFontSize(isCompact ? 6.2 : 8.5);
  pdf.text(game.title.toUpperCase(), centerX, titleY + (isCompact ? 4.6 : 6.5), { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(isCompact ? 5.4 : 7.5);
  pdf.text(`Card ${cardNumber} of ${totalCards}`, slot.x + frameInset, detailsY);
  pdf.text(
    isCompact ? 'Name: ______________' : 'Name: __________________________',
    slot.x + slot.width - frameInset,
    detailsY,
    { align: 'right' },
  );

  const maxGridWidth = slot.width - frameInset * 2;
  const maxGridHeight = availableBottom - headerBottom;
  const outerGridSize = Math.min(maxGridWidth, maxGridHeight);
  const gridX = centerX - outerGridSize / 2;
  const gridY = headerBottom + (maxGridHeight - outerGridSize) / 2;
  drawGrid(pdf, cells, gridSize, gridX, gridY, outerGridSize, isCompact);

  pdf.setTextColor(...INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isCompact ? 5.2 : 7.3);
  pdf.text('Row, column, or diagonal = BINGO!', centerX, slot.y + slot.height - (isCompact ? 7 : 9), { align: 'center' });
  pdf.setTextColor(...SOFT_INK);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(isCompact ? 4.8 : 6.5);
  pdf.text('classbop.com', centerX, slot.y + slot.height - (isCompact ? 3.8 : 5), { align: 'center' });
}

export async function createBingoPdf({ game, gridSize, cards, cardsPerPage = 1 }) {
  const { jsPDF } = await import('jspdf');
  const orientation = cardsPerPage === 2 || cardsPerPage === 3 ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  pdf.setProperties({
    title: `${game.title} - ${gridSize}x${gridSize}`,
    subject: `${cards.length} printable classroom bingo cards`,
    author: 'ClassBop',
  });

  const slots = getPageSlots(pdf, cardsPerPage);

  cards.forEach((cells, index) => {
    const slotIndex = index % cardsPerPage;
    if (index > 0 && slotIndex === 0) pdf.addPage();
    if (slotIndex === 0) drawCutGuides(pdf, cardsPerPage);
    drawCard(pdf, game, gridSize, cells, index + 1, cards.length, slots[slotIndex]);
  });

  return pdf;
}

export async function downloadBingoPdf({ game, gridSize, cards, cardsPerPage = 1 }) {
  const pdf = await createBingoPdf({ game, gridSize, cards, cardsPerPage });
  const safeTitle = game.id.replace(/[^a-z0-9-]/gi, '-');
  pdf.save(`${safeTitle}-bingo-${gridSize}x${gridSize}-${cards.length}-cards-${cardsPerPage}-per-page.pdf`);
}
