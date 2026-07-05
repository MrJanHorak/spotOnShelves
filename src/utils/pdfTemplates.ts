import {
  ShelfPlacement,
  WallDimensions,
  Unit,
  ProjectSettings,
  MaterialEstimate,
  CalculationResult,
  Obstruction,
} from '../types';

function drawPrintScaleCheck(
  page: any,
  font: any,
  fontBold: any,
  x: number,
  y: number
) {
  const POINTS_PER_INCH = 72;
  const oneInch = POINTS_PER_INCH;
  const twoCm = (2 / 2.54) * POINTS_PER_INCH;

  page.drawText('Print Scale Check', {
    x,
    y,
    size: 10,
    font: fontBold,
  });

  const barY = y - 14;
  page.drawLine({
    start: { x, y: barY },
    end: { x: x + oneInch, y: barY },
    thickness: 2,
  });
  page.drawLine({
    start: { x, y: barY - 4 },
    end: { x, y: barY + 4 },
    thickness: 1,
  });
  page.drawLine({
    start: { x: x + oneInch, y: barY - 4 },
    end: { x: x + oneInch, y: barY + 4 },
    thickness: 1,
  });
  page.drawText('1 in', {
    x: x + oneInch + 6,
    y: barY - 3,
    size: 9,
    font,
  });

  const bar2Y = barY - 14;
  page.drawLine({
    start: { x, y: bar2Y },
    end: { x: x + twoCm, y: bar2Y },
    thickness: 2,
  });
  page.drawLine({
    start: { x, y: bar2Y - 4 },
    end: { x, y: bar2Y + 4 },
    thickness: 1,
  });
  page.drawLine({
    start: { x: x + twoCm, y: bar2Y - 4 },
    end: { x: x + twoCm, y: bar2Y + 4 },
    thickness: 1,
  });
  page.drawText('2 cm', {
    x: x + twoCm + 6,
    y: bar2Y - 3,
    size: 9,
    font,
  });

  page.drawText('Measure bars after printing before drilling.', {
    x,
    y: bar2Y - 14,
    size: 8,
    font,
  });
}

export async function generateDrillingTemplate(
  shelf: ShelfPlacement,
  shelfIndex: number,
  unit: Unit,
  bracketsCount: number,
  bracketPositions?: number[]
): Promise<Blob> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const pdfLib: any = await import('pdf-lib');
  const { PDFDocument, StandardFonts, rgb } = pdfLib;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Letter size: 612 x 792 points
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36; // 0.5 inch margins

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Title
  page.drawText(`Drilling Template - Shelf ${shelfIndex}`, {
    x: margin,
    y: pageHeight - margin - 20,
    size: 18,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Shelf information
  let currentY = pageHeight - margin - 50;
  const lineHeight = 20;

  const info = [
    `Shelf ID: ${shelf.id}`,
    `Width: ${shelf.width.toFixed(1)} ${unit === 'inches' ? 'in' : 'cm'}`,
    `Depth: ${(shelf.depth ?? 0).toFixed(1)} ${
      unit === 'inches' ? 'in' : 'cm'
    }`,
    `Distance from left wall: ${shelf.distanceFromLeft.toFixed(1)} ${
      unit === 'inches' ? 'in' : 'cm'
    }`,
    `Distance from floor: ${shelf.distanceFromFloor.toFixed(1)} ${
      unit === 'inches' ? 'in' : 'cm'
    }`,
    `Number of brackets: ${bracketsCount}`,
  ];

  if (bracketPositions && bracketPositions.length > 0) {
    info.push(
      `Bracket positions (from left edge): ${bracketPositions
        .map((pos) => `${pos.toFixed(1)} ${unit === 'inches' ? 'in' : 'cm'}`)
        .join(', ')}`
    );
  }

  if (shelf.expectedWeight) {
    info.push(`Expected weight: ${shelf.expectedWeight} lbs`);
  }

  info.forEach((line) => {
    page.drawText(line, {
      x: margin,
      y: currentY,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    currentY -= lineHeight;
  });

  currentY -= 20;

  // Instructions
  page.drawText('Installation Instructions:', {
    x: margin,
    y: currentY,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  currentY -= lineHeight;

  const instructions = [
    '1. Cut out this template along the dotted lines',
    '2. Align the bottom edge with your floor measurement',
    '3. Align the left edge with your left wall measurement',
    '4. Use a level to ensure template is horizontal',
    '5. Mark drilling points through the circles',
    '6. Drill pilot holes at marked points',
  ];

  instructions.forEach((instruction) => {
    page.drawText(instruction, {
      x: margin + 10,
      y: currentY,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    currentY -= 16;
  });

  currentY -= 30;

  // Scale indicator
  page.drawText('FULL SCALE TEMPLATE (1:1)', {
    x: margin,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(1, 0, 0),
  });

  currentY -= 40;

  drawPrintScaleCheck(page, font, fontBold, margin, currentY);
  currentY -= 62;

  // Draw the template
  // Convert inches to points (1 inch = 72 points)
  const POINTS_PER_INCH = 72;
  const shelfWidthPoints = shelf.width * POINTS_PER_INCH;

  // Check if shelf fits on page
  if (shelfWidthPoints > pageWidth - 2 * margin) {
    page.drawText('WARNING: SHELF TOO WIDE FOR SINGLE PAGE', {
      x: margin,
      y: currentY,
      size: 14,
      font: fontBold,
      color: rgb(1, 0, 0),
    });
    page.drawText('Template shown at reduced scale for reference', {
      x: margin,
      y: currentY - 20,
      size: 10,
      font,
      color: rgb(1, 0, 0),
    });
  }

  // Draw shelf outline (scaled to fit if necessary)
  const availableWidth = pageWidth - 2 * margin;
  const scale = Math.min(1, availableWidth / shelfWidthPoints);
  const scaledWidth = shelfWidthPoints * scale;
  const templateHeight = 60; // Height of template area

  // Outer rectangle (cutting guide)
  page.drawRectangle({
    x: margin,
    y: currentY - templateHeight,
    width: scaledWidth,
    height: templateHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
    borderDashArray: [5, 3],
  });

  // Shelf outline
  page.drawRectangle({
    x: margin,
    y: currentY - 50,
    width: scaledWidth,
    height: 40,
    borderColor: rgb(0, 0, 1),
    borderWidth: 1,
  });

  // Draw bracket positions
  for (let i = 0; i < bracketsCount; i++) {
    const bracketX = margin + (scaledWidth * (i + 0.5)) / bracketsCount;

    // Draw circle for drilling point
    page.drawCircle({
      x: bracketX,
      y: currentY - 30,
      size: 8,
      borderColor: rgb(1, 0, 0),
      borderWidth: 2,
    });

    // Cross hair
    page.drawLine({
      start: { x: bracketX - 12, y: currentY - 30 },
      end: { x: bracketX + 12, y: currentY - 30 },
      thickness: 1,
      color: rgb(1, 0, 0),
    });
    page.drawLine({
      start: { x: bracketX, y: currentY - 30 - 12 },
      end: { x: bracketX, y: currentY - 30 + 12 },
      thickness: 1,
      color: rgb(1, 0, 0),
    });

    // Label
    page.drawText(`Bracket ${i + 1}`, {
      x: bracketX - 20,
      y: currentY - 55,
      size: 8,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // Measurement guides
  page.drawText(`${shelf.width.toFixed(1)}"`, {
    x: margin + scaledWidth / 2 - 15,
    y: currentY - templateHeight - 15,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function generatePanoramicDrillingTemplate(
  shelf: ShelfPlacement,
  shelfIndex: number,
  unit: Unit,
  bracketsCount: number,
  bracketPositions?: number[]
): Promise<Blob> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const pdfLib: any = await import('pdf-lib');
  const { PDFDocument, StandardFonts, rgb } = pdfLib;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Letter size LANDSCAPE: 792 x 612 points (11 x 8.5 inches)
  const pageWidth = 792; // 11 inches wide
  const pageHeight = 612; // 8.5 inches tall
  const margin = 36; // 0.5 inch margins
  const POINTS_PER_INCH = 72;

  // Use full width for template (minus margins and overlap area)
  const overlapWidth = 36; // 0.5 inch overlap for taping
  const usableWidth = pageWidth - 2 * margin - overlapWidth;
  const shelfWidthPoints = shelf.width * POINTS_PER_INCH;

  // Calculate how many pages needed
  const numPages = Math.ceil(shelfWidthPoints / usableWidth);

  // Template dimensions
  const templateHeight = 180; // More height for landscape
  const shelfHeight = 120;

  for (let pageNum = 0; pageNum < numPages; pageNum++) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate section of shelf shown on this page
    const sectionStartInches = (pageNum * usableWidth) / POINTS_PER_INCH;
    const sectionEndInches = Math.min(
      ((pageNum + 1) * usableWidth + overlapWidth) / POINTS_PER_INCH,
      shelf.width
    );
    const sectionWidth = sectionEndInches - sectionStartInches;

    // Title
    let currentY = pageHeight - margin - 20;
    page.drawText(
      `Panoramic Drilling Template (Landscape) - Shelf ${shelfIndex} - Page ${
        pageNum + 1
      } of ${numPages}`,
      {
        x: margin,
        y: currentY,
        size: 16,
        font: fontBold,
        color: rgb(0, 0, 0),
      }
    );

    currentY -= 30;

    // Page-specific information
    const pageInfo = [
      `Shelf ID: ${shelf.id}`,
      `Total shelf width: ${shelf.width.toFixed(1)} ${
        unit === 'inches' ? 'in' : 'cm'
      }`,
      `This section: ${sectionStartInches.toFixed(
        1
      )}" to ${sectionEndInches.toFixed(1)}"`,
      `Section width: ${sectionWidth.toFixed(1)} ${
        unit === 'inches' ? 'in' : 'cm'
      }`,
    ];

    if (pageNum === 0) {
      pageInfo.push(
        `Distance from left wall: ${shelf.distanceFromLeft.toFixed(1)} ${
          unit === 'inches' ? 'in' : 'cm'
        }`
      );
      pageInfo.push(
        `Distance from floor: ${shelf.distanceFromFloor.toFixed(1)} ${
          unit === 'inches' ? 'in' : 'cm'
        }`
      );
    }

    const lineHeight = 18;
    pageInfo.forEach((line) => {
      page.drawText(line, {
        x: margin,
        y: currentY,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    });

    currentY -= 20;

    // Instructions for this page
    page.drawText('Instructions:', {
      x: margin,
      y: currentY,
      size: 13,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    currentY -= lineHeight;

    const instructions = [
      '1. Cut along the OUTER dashed line',
      pageNum > 0
        ? '2. Overlap with previous page using alignment marks'
        : '2. Align left edge with wall measurement',
      '3. Tape pages together to create full template',
      '4. Use level to ensure template is horizontal',
      '5. Mark drilling points through the circles',
    ];

    instructions.forEach((instruction) => {
      page.drawText(instruction, {
        x: margin + 10,
        y: currentY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    });

    currentY -= 30;

    drawPrintScaleCheck(page, font, fontBold, margin, currentY);
    currentY -= 68;

    // Draw alignment marks and cut guides
    const templateY = currentY;

    // Draw cutting guide (outer dashed box)
    page.drawRectangle({
      x: margin,
      y: templateY - templateHeight,
      width: sectionWidth * POINTS_PER_INCH,
      height: templateHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
      borderDashArray: [10, 5],
    });

    // If not first page, draw overlap zone on left
    if (pageNum > 0) {
      page.drawRectangle({
        x: margin,
        y: templateY - templateHeight,
        width: overlapWidth,
        height: templateHeight,
        color: rgb(0.95, 0.95, 0.95),
        opacity: 0.5,
      });

      // Overlap instructions
      page.drawText('OVERLAP', {
        x: margin + 5,
        y: templateY - 15,
        size: 8,
        font: fontBold,
        color: rgb(0.5, 0.5, 0.5),
      });
      page.drawText('ZONE', {
        x: margin + 5,
        y: templateY - 25,
        size: 8,
        font: fontBold,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Draw alignment marks
    const alignY = templateY - templateHeight / 2;

    // Left alignment mark
    if (pageNum > 0) {
      // Triangle pointing right
      page.drawLine({
        start: { x: margin + overlapWidth - 5, y: alignY },
        end: { x: margin + overlapWidth + 10, y: alignY - 10 },
        thickness: 2,
        color: rgb(1, 0, 0),
      });
      page.drawLine({
        start: { x: margin + overlapWidth - 5, y: alignY },
        end: { x: margin + overlapWidth + 10, y: alignY + 10 },
        thickness: 2,
        color: rgb(1, 0, 0),
      });
      page.drawLine({
        start: { x: margin + overlapWidth + 10, y: alignY - 10 },
        end: { x: margin + overlapWidth + 10, y: alignY + 10 },
        thickness: 2,
        color: rgb(1, 0, 0),
      });
    }

    // Right alignment mark (for next page to match)
    if (pageNum < numPages - 1) {
      const rightX = margin + sectionWidth * POINTS_PER_INCH;
      // Triangle pointing left
      page.drawLine({
        start: { x: rightX + 5, y: alignY },
        end: { x: rightX - 10, y: alignY - 10 },
        thickness: 2,
        color: rgb(1, 0, 0),
      });
      page.drawLine({
        start: { x: rightX + 5, y: alignY },
        end: { x: rightX - 10, y: alignY + 10 },
        thickness: 2,
        color: rgb(1, 0, 0),
      });
      page.drawLine({
        start: { x: rightX - 10, y: alignY - 10 },
        end: { x: rightX - 10, y: alignY + 10 },
        thickness: 2,
        color: rgb(1, 0, 0),
      });

      page.drawText('Match this mark with next page', {
        x: rightX - 80,
        y: alignY + 15,
        size: 7,
        font,
        color: rgb(1, 0, 0),
      });
    }

    // Draw shelf outline
    const shelfY = templateY - (templateHeight - shelfHeight) / 2;
    page.drawRectangle({
      x: margin,
      y: shelfY - shelfHeight,
      width: sectionWidth * POINTS_PER_INCH,
      height: shelfHeight,
      borderColor: rgb(0, 0, 0.8),
      borderWidth: 2,
    });

    // Draw center line
    page.drawLine({
      start: { x: margin, y: shelfY - shelfHeight / 2 },
      end: {
        x: margin + sectionWidth * POINTS_PER_INCH,
        y: shelfY - shelfHeight / 2,
      },
      thickness: 1,
      color: rgb(0, 0, 0.5),
      dashArray: [3, 3],
    });

    // Draw brackets that fall on this page section
    if (bracketPositions) {
      bracketPositions.forEach((position, i) => {
        // Check if this bracket is on this page section
        if (position >= sectionStartInches && position < sectionEndInches) {
          const relativePosition = position - sectionStartInches;
          const bracketX = margin + relativePosition * POINTS_PER_INCH;
          const bracketY = shelfY - shelfHeight / 2;

          // Draw drilling circle
          page.drawCircle({
            x: bracketX,
            y: bracketY,
            size: 12,
            borderColor: rgb(1, 0, 0),
            borderWidth: 2,
          });

          // Crosshair
          page.drawLine({
            start: { x: bracketX - 20, y: bracketY },
            end: { x: bracketX + 20, y: bracketY },
            thickness: 1,
            color: rgb(1, 0, 0),
          });
          page.drawLine({
            start: { x: bracketX, y: bracketY - 20 },
            end: { x: bracketX, y: bracketY + 20 },
            thickness: 1,
            color: rgb(1, 0, 0),
          });

          // Bracket label
          page.drawText(`Bracket ${i + 1}`, {
            x: bracketX - 25,
            y: bracketY - 35,
            size: 10,
            font: fontBold,
            color: rgb(1, 0, 0),
          });

          // Distance from left edge
          page.drawText(`${position.toFixed(1)}"`, {
            x: bracketX - 15,
            y: bracketY + 25,
            size: 9,
            font,
            color: rgb(1, 0, 0),
          });
        }
      });
    }

    // Measurement ruler at bottom
    const rulerY = shelfY - shelfHeight - 10;
    page.drawLine({
      start: { x: margin, y: rulerY },
      end: { x: margin + sectionWidth * POINTS_PER_INCH, y: rulerY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    // Start and end measurements
    page.drawText(`${sectionStartInches.toFixed(1)}"`, {
      x: margin - 10,
      y: rulerY - 15,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${sectionEndInches.toFixed(1)}"`, {
      x: margin + sectionWidth * POINTS_PER_INCH - 20,
      y: rulerY - 15,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Tick marks every inch
    for (
      let i = Math.ceil(sectionStartInches);
      i <= Math.floor(sectionEndInches);
      i++
    ) {
      const tickX = margin + (i - sectionStartInches) * POINTS_PER_INCH;
      page.drawLine({
        start: { x: tickX, y: rulerY - 3 },
        end: { x: tickX, y: rulerY + 3 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }

    // Footer with page info
    page.drawText(
      `Page ${
        pageNum + 1
      }/${numPages} | Cut along dashed line | Tape pages together using overlap zones`,
      {
        x: margin,
        y: 20,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4),
      }
    );
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function generateAllTemplates(
  shelves: ShelfPlacement[],
  _wall: WallDimensions,
  unit: Unit,
  bracketsPerShelf: number[],
  bracketPositionsPerShelf?: number[][]
): Promise<Blob> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const pdfLib: any = await import('pdf-lib');
  const { PDFDocument } = pdfLib;

  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < shelves.length; i++) {
    const templateBlob = await generateDrillingTemplate(
      shelves[i],
      i + 1,
      unit,
      bracketsPerShelf[i] || 2,
      bracketPositionsPerShelf?.[i]
    );

    const templateBytes = await templateBlob.arrayBuffer();
    const templateDoc = await PDFDocument.load(templateBytes);
    const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);
    pdfDoc.addPage(templatePage);
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export async function generateComprehensivePDF(
  wall: WallDimensions,
  shelves: ShelfPlacement[],
  obstructions: Obstruction[],
  settings: ProjectSettings,
  materialEstimate: MaterialEstimate,
  result: CalculationResult,
  schematicCanvas: HTMLCanvasElement,
  schematicCssWidth: number,
  schematicCssHeight: number,
  pageSize: 'Letter' | 'A4' = 'Letter',
  widthAdjust: number = 1
): Promise<Blob> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const pdfLib: any = await import('pdf-lib');
  const { PDFDocument, StandardFonts, rgb } = pdfLib;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page dimensions
  const pageSizes: Record<string, [number, number]> = {
    Letter: [612, 792], // 8.5 x 11 inches
    A4: [595.28, 841.89],
  };
  const [pageWidth, pageHeight] = pageSizes[pageSize];
  const margin = 36; // 0.5 inch

  // ========== PAGE 1: PROJECT OVERVIEW ==========
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Title
  page1.drawText('Spot On Shelves - Installation Plan', {
    x: margin,
    y,
    size: 24,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 40;

  // Project metadata
  const today = new Date().toLocaleDateString();
  page1.drawText(`Generated: ${today}`, {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 30;

  // Wall Information Section
  page1.drawText('Wall Information', {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 20;

  const wallInfo = [
    `Width: ${wall.width.toFixed(1)} ${
      settings.unit === 'inches' ? 'in' : 'cm'
    }`,
    `Height: ${wall.height.toFixed(1)} ${
      settings.unit === 'inches' ? 'in' : 'cm'
    }`,
    `Material: ${
      settings.wallMaterial.charAt(0).toUpperCase() +
      settings.wallMaterial.slice(1)
    }`,
    `Mounting Type: ${
      settings.mountingType.charAt(0).toUpperCase() +
      settings.mountingType.slice(1).replace('-', ' ')
    }`,
  ];

  wallInfo.forEach((line) => {
    page1.drawText(line, { x: margin + 10, y, size: 12, font });
    y -= 18;
  });
  y -= 10;

  // Shelf Summary Section
  page1.drawText('Shelf Summary', {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 20;

  page1.drawText(`Number of shelves: ${shelves.length}`, {
    x: margin + 10,
    y,
    size: 12,
    font,
  });
  y -= 25;

  shelves.forEach((shelf, index) => {
    if (y < margin + 100) {
      // Not enough space
      return;
    }
    page1.drawText(`Shelf ${index + 1}:`, {
      x: margin + 20,
      y,
      size: 11,
      font: fontBold,
    });
    y -= 16;
    page1.drawText(
      `  Width: ${shelf.width.toFixed(1)}", Depth: ${(shelf.depth ?? 0).toFixed(
        1
      )}"`,
      { x: margin + 30, y, size: 10, font }
    );
    y -= 14;
    page1.drawText(
      `  Distance from left: ${shelf.distanceFromLeft.toFixed(1)}"`,
      { x: margin + 30, y, size: 10, font }
    );
    y -= 14;
    page1.drawText(
      `  Distance from floor: ${shelf.distanceFromFloor.toFixed(1)}"`,
      { x: margin + 30, y, size: 10, font }
    );
    y -= 18;
  });

  // Obstructions if any
  if (obstructions.length > 0 && y > margin + 60) {
    y -= 10;
    page1.drawText('Obstructions', {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4),
    });
    y -= 20;
    page1.drawText(`${obstructions.length} obstruction(s) noted on schematic`, {
      x: margin + 10,
      y,
      size: 12,
      font,
    });
  }

  // Overall capacity warning
  if (materialEstimate.maxWeightCapacity && y > margin + 40) {
    y -= 30;
    page1.drawRectangle({
      x: margin,
      y: y - 35,
      width: pageWidth - 2 * margin,
      height: 40,
      color: rgb(0.9, 0.95, 1),
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 2,
    });
    page1.drawText('Total Maximum Safe Weight Capacity', {
      x: margin + 10,
      y: y - 10,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.5),
    });
    page1.drawText(`${materialEstimate.maxWeightCapacity} lbs`, {
      x: margin + 10,
      y: y - 28,
      size: 18,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.8),
    });
  }

  // ========== PAGE 2: SCHEMATIC DIAGRAM (LANDSCAPE) ==========
  const schematicPageWidth = pageHeight;
  const schematicPageHeight = pageWidth;
  const page2 = pdfDoc.addPage([schematicPageWidth, schematicPageHeight]);
  y = schematicPageHeight - margin;

  page2.drawText('Wall Schematic', {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 30;

  // Embed schematic image
  const pngDataUrl = schematicCanvas.toDataURL('image/png');
  const pngBuffer = await (await fetch(pngDataUrl)).arrayBuffer();
  const schematicImg = await pdfDoc.embedPng(pngBuffer);

  const POINTS_PER_INCH = 72;
  const CSS_PX_PER_INCH = 96;
  const pxToPoints = (px: number) => (px * POINTS_PER_INCH) / CSS_PX_PER_INCH;

  // schematicCanvas.width/height are device pixel dimensions (css px * scale).
  // We want to size the image in the PDF according to the CSS pixel dimensions
  // as it appears on the page. Use the measured CSS width/height passed from caller.
  const imgWpt = pxToPoints(schematicCssWidth);
  const imgHpt = pxToPoints(schematicCssHeight);
  const availW = schematicPageWidth - 2 * margin;
  const availH = y - margin - 60; // Leave space for legend
  // Keep moderate upscaling to avoid oversized labels while still filling space.
  const scale = Math.min(availW / imgWpt, availH / imgHpt, 1.2);
  const drawW = imgWpt * scale * widthAdjust;
  const drawH = imgHpt * scale;
  const imgX = (schematicPageWidth - drawW) / 2;
  const imgY = margin + 60;

  page2.drawImage(schematicImg, {
    x: imgX,
    y: imgY,
    width: drawW,
    height: drawH,
  });

  // Legend at bottom
  let legendY = margin + 35;
  page2.drawText('Legend:', {
    x: margin,
    y: legendY,
    size: 10,
    font: fontBold,
  });
  legendY -= 15;

  const legendItems = [
    {
      color: rgb(0.95, 0.96, 0.98),
      label: 'Wall',
      border: rgb(0.2, 0.25, 0.32),
    },
    {
      color: rgb(0.02, 0.59, 0.41),
      label: 'Shelves',
      border: rgb(0.02, 0.47, 0.34),
    },
  ];

  let legendX = margin;
  legendItems.forEach((item) => {
    page2.drawRectangle({
      x: legendX,
      y: legendY - 8,
      width: 12,
      height: 12,
      color: item.color,
      borderColor: item.border,
      borderWidth: 1,
    });
    page2.drawText(item.label, {
      x: legendX + 18,
      y: legendY - 6,
      size: 9,
      font,
    });
    legendX += 100;
  });

  drawPrintScaleCheck(
    page2,
    font,
    fontBold,
    schematicPageWidth - margin - 170,
    margin + 46,
  );
  page2.drawText('Schematic page is for planning; use drilling templates for 1:1 marks.', {
    x: margin,
    y: margin + 6,
    size: 8,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  // ========== PAGE 3: MATERIAL ESTIMATE ==========
  const page3 = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  page3.drawText('Material Estimate & Installation Guide', {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 35;

  // Summary boxes
  page3.drawText('Materials Required:', {
    x: margin,
    y,
    size: 14,
    font: fontBold,
  });
  y -= 25;

  const boxWidth = (pageWidth - 2 * margin - 20) / 3;
  const boxHeight = 50;

  // Brackets box
  page3.drawRectangle({
    x: margin,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: rgb(0.93, 0.94, 0.99),
    borderColor: rgb(0.4, 0.45, 0.7),
    borderWidth: 1,
  });
  page3.drawText('Brackets', {
    x: margin + 10,
    y: y - 20,
    size: 10,
    font,
    color: rgb(0.3, 0.35, 0.6),
  });
  page3.drawText(`${materialEstimate.brackets}`, {
    x: margin + 10,
    y: y - 40,
    size: 20,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.5),
  });

  // Screws box
  page3.drawRectangle({
    x: margin + boxWidth + 10,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: rgb(0.94, 0.99, 0.94),
    borderColor: rgb(0.4, 0.7, 0.45),
    borderWidth: 1,
  });
  page3.drawText('Screws', {
    x: margin + boxWidth + 20,
    y: y - 20,
    size: 10,
    font,
    color: rgb(0.3, 0.6, 0.35),
  });
  page3.drawText(`${materialEstimate.screws}`, {
    x: margin + boxWidth + 20,
    y: y - 40,
    size: 20,
    font: fontBold,
    color: rgb(0.2, 0.5, 0.25),
  });

  // Anchors box
  page3.drawRectangle({
    x: margin + 2 * boxWidth + 20,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    color: rgb(1, 0.98, 0.93),
    borderColor: rgb(0.7, 0.6, 0.4),
    borderWidth: 1,
  });
  page3.drawText('Anchors', {
    x: margin + 2 * boxWidth + 30,
    y: y - 20,
    size: 10,
    font,
    color: rgb(0.6, 0.5, 0.3),
  });
  page3.drawText(`${materialEstimate.anchors}`, {
    x: margin + 2 * boxWidth + 30,
    y: y - 40,
    size: 20,
    font: fontBold,
    color: rgb(0.5, 0.4, 0.2),
  });

  y -= boxHeight + 20;

  page3.drawText(`Anchor Type: ${materialEstimate.anchorType}`, {
    x: margin,
    y,
    size: 11,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 30;

  // Per-shelf breakdown table
  page3.drawText('Per-Shelf Breakdown:', {
    x: margin,
    y,
    size: 14,
    font: fontBold,
  });
  y -= 20;

  // Table header
  const colX = [
    margin,
    margin + 80,
    margin + 160,
    margin + 260,
    margin + 340,
    margin + 420,
  ];
  const headerY = y;
  page3.drawRectangle({
    x: margin,
    y: headerY - 18,
    width: pageWidth - 2 * margin,
    height: 18,
    color: rgb(0.9, 0.9, 0.9),
  });

  ['Shelf', 'Width', 'Brackets', 'Screws', 'Anchors', 'Max Weight'].forEach(
    (header, i) => {
      page3.drawText(header, {
        x: colX[i],
        y: headerY - 12,
        size: 9,
        font: fontBold,
      });
    }
  );

  y = headerY - 25;

  // Table rows
  if (materialEstimate.perShelf) {
    materialEstimate.perShelf.forEach((row: any) => {
      if (y < margin + 80) {
        return;
      }

      const values = [
        row.id,
        `${row.width}"`,
        `${row.brackets}`,
        `${row.screws}`,
        `${row.anchors}`,
        row.maxWeightCapacity ? `${row.maxWeightCapacity} lbs` : '-',
      ];

      values.forEach((val, i) => {
        page3.drawText(val, { x: colX[i], y, size: 9, font });
      });

      y -= 16;
    });
  }

  // Total row
  if (y > margin + 60) {
    y -= 5;
    page3.drawRectangle({
      x: margin,
      y: y - 18,
      width: pageWidth - 2 * margin,
      height: 18,
      color: rgb(0.95, 0.95, 0.95),
    });

    page3.drawText('TOTAL', {
      x: colX[0],
      y: y - 12,
      size: 10,
      font: fontBold,
    });
    page3.drawText(`${materialEstimate.brackets}`, {
      x: colX[2],
      y: y - 12,
      size: 10,
      font: fontBold,
    });
    page3.drawText(`${materialEstimate.screws}`, {
      x: colX[3],
      y: y - 12,
      size: 10,
      font: fontBold,
    });
    page3.drawText(`${materialEstimate.anchors}`, {
      x: colX[4],
      y: y - 12,
      size: 10,
      font: fontBold,
    });
    page3.drawText(
      materialEstimate.maxWeightCapacity
        ? `${materialEstimate.maxWeightCapacity} lbs`
        : '-',
      { x: colX[5], y: y - 12, size: 10, font: fontBold }
    );
    y -= 30;
  }

  // Bracket positions details
  if (materialEstimate.perShelf && y > margin + 100) {
    page3.drawText('Bracket Positions (distance from left edge of shelf):', {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4),
    });
    y -= 18;

    materialEstimate.perShelf.forEach((row: any) => {
      if (y < margin + 40 || !row.bracketPositions) return;

      const positions = row.bracketPositions
        .map((pos: number) => `${pos.toFixed(1)}"`)
        .join(', ');

      page3.drawText(`${row.id}: ${positions}`, {
        x: margin + 10,
        y,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 14;
    });
  }

  // ========== PAGE 4: INSTALLATION INSTRUCTIONS ==========
  const page4 = pdfDoc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;

  page4.drawText('Installation Instructions', {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 35;

  // Helper function to remove emojis and unsupported Unicode characters
  const stripEmojis = (text: string): string => {
    // Remove emojis and other characters that can't be encoded in WinAnsi
    // This regex matches most emoji patterns
    return text
      .replace(
        /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu,
        ''
      )
      .trim();
  };

  // Step-by-step instructions
  result.instructions.forEach((instruction, index) => {
    if (y < margin + 40) {
      return;
    }

    // Remove emojis from instruction text
    const cleanInstruction = stripEmojis(instruction);

    // Draw step number circle
    page4.drawCircle({
      x: margin + 10,
      y: y - 8,
      size: 10,
      color: rgb(0.2, 0.4, 0.8),
    });
    page4.drawText(`${index + 1}`, {
      x: margin + 7,
      y: y - 11,
      size: 9,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Wrap long instructions
    const maxWidth = pageWidth - 2 * margin - 30;
    const words = cleanInstruction.split(' ');
    let line = '';
    let lineY = y - 10;

    words.forEach((word) => {
      const testLine = line + word + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, 10);
      if (testWidth > maxWidth && line !== '') {
        page4.drawText(line, {
          x: margin + 30,
          y: lineY,
          size: 10,
          font,
        });
        line = word + ' ';
        lineY -= 14;
      } else {
        line = testLine;
      }
    });

    if (line !== '') {
      page4.drawText(line, {
        x: margin + 30,
        y: lineY,
        size: 10,
        font,
      });
    }

    y = lineY - 20;
  });

  // Safety warnings section
  if (y > margin + 120) {
    y -= 20;
    page4.drawText('Safety Guidelines', {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0.8, 0.3, 0.1),
    });
    y -= 20;

    const safetyTips = [
      'Always wear safety glasses when drilling',
      'Check for electrical wires and plumbing behind walls',
      'Use appropriate personal protective equipment',
      'Test mounting security before loading shelves',
      'Never exceed manufacturer weight specifications',
    ];

    safetyTips.forEach((tip) => {
      if (y < margin + 20) return;
      page4.drawText(`• ${tip}`, {
        x: margin + 10,
        y,
        size: 9,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 14;
    });
  }

  // Footer on all pages
  const footer = 'Generated by Spot On Shelves';
  pdfDoc.getPages().forEach((page: any, index: number) => {
    const { width } = page.getSize();
    page.drawText(footer, {
      x: margin,
      y: 20,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    page.drawText(`Page ${index + 1} of ${pdfDoc.getPageCount()}`, {
      x: width - margin - 60,
      y: 20,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
