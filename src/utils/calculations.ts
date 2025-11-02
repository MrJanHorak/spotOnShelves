import {
  WallDimensions,
  ShelfDimensions,
  Obstruction,
  ShelfPlacement,
  CalculationResult,
  Alignment,
  MaterialEstimate,
  MountingType,
  WallMaterial,
  MaterialCalcOptions,
  PerShelfMaterial,
} from '../types';

export function validateInputs(
  wall: WallDimensions,
  shelves: ShelfDimensions[],
  obstructions: Obstruction[]
): string[] {
  const errors: string[] = [];

  // Wall validation
  if (wall.width <= 0 || wall.height <= 0) {
    errors.push('Wall dimensions must be positive numbers');
  }

  // Shelf validation
  shelves.forEach((shelf, index) => {
    if (shelf.width <= 0 || shelf.depth <= 0) {
      errors.push(`Shelf ${index + 1} dimensions must be positive numbers`);
    }
    if (shelf.width > wall.width) {
      errors.push(`Shelf ${index + 1} width cannot exceed wall width`);
    }
  });

  // Obstruction validation
  obstructions.forEach((obstruction, index) => {
    if (obstruction.width <= 0 || obstruction.height <= 0) {
      errors.push(
        `Obstruction ${index + 1} dimensions must be positive numbers`
      );
    }
    if (obstruction.distanceFromLeft < 0 || obstruction.distanceFromFloor < 0) {
      errors.push(
        `Obstruction ${index + 1} position values must be non-negative`
      );
    }
    if (obstruction.distanceFromLeft + obstruction.width > wall.width) {
      errors.push(`Obstruction ${index + 1} extends beyond wall width`);
    }
    if (obstruction.distanceFromFloor + obstruction.height > wall.height) {
      errors.push(`Obstruction ${index + 1} extends beyond wall height`);
    }
  });

  return errors;
}

export function calculateOptimalPlacement(
  wall: WallDimensions,
  shelves: ShelfDimensions[],
  obstructions: Obstruction[],
  alignment: Alignment = 'center',
  studLocations?: number[]
): CalculationResult {
  if (shelves.length === 0) {
    return { shelves: [], measurements: [], instructions: [] };
  }

  // Sort shelves: heaviest first (if weight specified), then by width
  const sortedShelves = [...shelves].sort((a, b) => {
    const weightDiff = (b.expectedWeight || 0) - (a.expectedWeight || 0);
    if (weightDiff !== 0) return weightDiff;
    return b.width - a.width;
  });

  const placements: ShelfPlacement[] = [];
  const usedSpaces: Array<{ x1: number; x2: number; y1: number; y2: number }> =
    [];

  // Add obstructions to used spaces
  obstructions.forEach((obstruction) => {
    usedSpaces.push({
      x1: obstruction.distanceFromLeft,
      x2: obstruction.distanceFromLeft + obstruction.width,
      y1: obstruction.distanceFromFloor,
      y2: obstruction.distanceFromFloor + obstruction.height,
    });
  });

  const shelfHeight = 1; // Assume 1 unit shelf thickness
  const minSpacing = 12; // Minimum spacing between shelves
  const wallMargin = 4; // Minimum margin from wall edges

  // Calculate available height zones
  const availableHeight = wall.height - 2 * wallMargin;
  const totalShelfSpace = shelves.length * shelfHeight;
  const totalSpacing = (shelves.length - 1) * minSpacing;
  const remainingSpace = availableHeight - totalShelfSpace - totalSpacing;

  let currentY = wallMargin + remainingSpace / 2; // Start from middle positioning

  sortedShelves.forEach((shelf) => {
    let bestX = wallMargin;

    // Calculate horizontal position based on alignment
    switch (alignment) {
      case 'left':
        bestX = wallMargin;
        break;
      case 'right':
        bestX = wall.width - shelf.width - wallMargin;
        break;
      case 'center':
      default:
        bestX = (wall.width - shelf.width) / 2;
        break;
    }

    // If this is a heavy shelf and we have stud locations, try to align with studs
    if (
      shelf.expectedWeight &&
      shelf.expectedWeight > 30 &&
      studLocations &&
      studLocations.length > 0
    ) {
      // Find the best stud-aligned position
      let bestStudAlignment = bestX;
      let minStudDistance = Infinity;

      // Try to position shelf so brackets align with studs
      for (const studPos of studLocations) {
        // Try centering shelf on this stud
        const testX = studPos - shelf.width / 2;
        if (
          testX >= wallMargin &&
          testX + shelf.width <= wall.width - wallMargin
        ) {
          const distance = Math.abs(testX - bestX);
          if (distance < minStudDistance) {
            minStudDistance = distance;
            bestStudAlignment = testX;
          }
        }
      }

      // Use stud-aligned position if it's reasonably close to desired position
      if (minStudDistance < 12) {
        bestX = bestStudAlignment;
      }
    }

    // Check for horizontal conflicts with obstructions
    let adjustedX = bestX;
    let attempts = 0;
    const maxAttempts = 30; // Increased from 20 for better placement

    while (attempts < maxAttempts) {
      const shelfSpace = {
        x1: adjustedX,
        x2: adjustedX + shelf.width,
        y1: currentY,
        y2: currentY + shelfHeight,
      };

      // Improved collision detection with better boundary checking
      const hasConflict = usedSpaces.some((space) => {
        const horizontalOverlap = !(
          shelfSpace.x2 <= space.x1 || shelfSpace.x1 >= space.x2
        );
        const verticalOverlap = !(
          shelfSpace.y2 <= space.y1 || shelfSpace.y1 >= space.y2
        );
        return horizontalOverlap && verticalOverlap;
      });

      if (
        !hasConflict &&
        adjustedX >= wallMargin &&
        adjustedX + shelf.width <= wall.width - wallMargin
      ) {
        break;
      }

      // Try moving right, then left, with smaller increments for better fit
      if (attempts % 2 === 0) {
        adjustedX = bestX + (attempts / 2 + 1) * 1.5;
      } else {
        adjustedX = bestX - Math.ceil(attempts / 2) * 1.5;
      }
      attempts++;
    }

    placements.push({
      id: shelf.id,
      distanceFromLeft: Math.max(
        wallMargin,
        Math.min(adjustedX, wall.width - shelf.width - wallMargin)
      ),
      distanceFromFloor: currentY,
      width: shelf.width,
      depth: shelf.depth,
      expectedWeight: shelf.expectedWeight,
    });

    // Add this shelf to used spaces
    usedSpaces.push({
      x1: adjustedX,
      x2: adjustedX + shelf.width,
      y1: currentY,
      y2: currentY + shelfHeight,
    });

    currentY += shelfHeight + minSpacing;
  });

  // Calculate vertical spacing
  const verticalSpacing =
    placements.length > 1
      ? placements[1].distanceFromFloor -
        placements[0].distanceFromFloor -
        shelfHeight
      : undefined;

  // Generate measurements and instructions
  const measurements = placements.map((placement, index) => {
    const weightInfo = placement.expectedWeight
      ? ` (Expected weight: ${placement.expectedWeight} lbs)`
      : '';
    return `Shelf ${index + 1}: ${placement.distanceFromLeft.toFixed(
      1
    )} from left wall, ${placement.distanceFromFloor.toFixed(
      1
    )} from floor${weightInfo}`;
  });

  const instructions = [
    '1. Use a stud finder to locate wall studs for secure mounting',
    '2. Mark the bottom-left corner of each shelf using the measurements provided',
    '3. Use a level to ensure each shelf is perfectly horizontal',
    '4. Mark mounting holes and drill pilot holes',
    '5. Install appropriate anchors or screws based on your wall material',
    '6. Mount shelves and check stability before loading',
  ];

  // Add weight-specific instructions
  const heavyShelves = placements.filter(
    (p) => p.expectedWeight && p.expectedWeight > 30
  );
  if (heavyShelves.length > 0) {
    instructions.push(
      '⚠️  HEAVY LOAD: For shelves with expected weight >30 lbs, ensure brackets are mounted into studs for maximum safety'
    );
  }

  if (studLocations && studLocations.length > 0) {
    instructions.push(
      `📍 Stud locations detected at: ${studLocations
        .map((s) => s.toFixed(1) + '"')
        .join(', ')}`
    );
  }

  return {
    shelves: placements,
    verticalSpacing,
    measurements,
    instructions,
  };
}

export function convertUnits(
  value: number,
  fromUnit: 'inches' | 'cm',
  toUnit: 'inches' | 'cm'
): number {
  if (fromUnit === toUnit) return value;

  if (fromUnit === 'inches' && toUnit === 'cm') {
    return value * 2.54;
  } else if (fromUnit === 'cm' && toUnit === 'inches') {
    return value / 2.54;
  }

  return value;
}

export function formatMeasurement(
  value: number,
  unit: 'inches' | 'cm'
): string {
  return `${value.toFixed(1)} ${unit === 'inches' ? 'in' : 'cm'}`;
}

// Load-bearing capacity calculation
export function calculateLoadCapacity(
  wallMaterial: WallMaterial,
  mountingType: MountingType,
  bracketsCount: number,
  useStuds: boolean = false,
  bracketSpacing?: number
): { maxWeight: number; safetyFactor: number; notes: string[] } {
  const notes: string[] = [];

  // Base capacity per bracket based on mounting type and wall material
  let capacityPerBracket = 50; // default in pounds

  if (useStuds) {
    // Mounting into studs provides significantly higher capacity
    switch (mountingType) {
      case 'floating':
        capacityPerBracket = 100;
        notes.push('Floating shelves in studs can support 100 lbs per bracket');
        break;
      case 'bracketed':
        capacityPerBracket = 125;
        notes.push(
          'Bracketed shelves in studs can support 125 lbs per bracket'
        );
        break;
      case 'l-bracket':
        capacityPerBracket = 150;
        notes.push('L-brackets in studs can support 150 lbs per bracket');
        break;
    }
  } else {
    // Mounting with anchors - capacity varies by wall material
    switch (wallMaterial) {
      case 'drywall':
        capacityPerBracket = mountingType === 'floating' ? 35 : 50;
        notes.push(
          'Drywall anchors: use heavy-duty toggle bolts for best results'
        );
        break;
      case 'plaster':
        capacityPerBracket = mountingType === 'floating' ? 40 : 55;
        notes.push('Plaster walls: use molly bolts or toggle anchors');
        break;
      case 'concrete':
        capacityPerBracket = mountingType === 'floating' ? 100 : 125;
        notes.push('Concrete: use masonry anchors with proper drill size');
        break;
      case 'brick':
        capacityPerBracket = mountingType === 'floating' ? 90 : 110;
        notes.push('Brick: drill into brick (not mortar) for best hold');
        break;
    }
  }

  // Adjust for bracket spacing (wider spacing reduces overall capacity)
  let spacingFactor = 1.0;
  if (bracketSpacing && bracketSpacing > 32) {
    spacingFactor = 0.85; // reduce capacity by 15% for wide spacing
    notes.push('Wide bracket spacing (>32") reduces overall capacity by 15%');
  } else if (bracketSpacing && bracketSpacing > 48) {
    spacingFactor = 0.7; // reduce capacity by 30% for very wide spacing
    notes.push('Very wide bracket spacing (>48") reduces capacity by 30%');
  }

  // Calculate total capacity with safety factor
  const safetyFactor = 0.75; // Conservative 75% of theoretical max
  const theoreticalMax = bracketsCount * capacityPerBracket * spacingFactor;
  const maxWeight = Math.floor(theoreticalMax * safetyFactor);

  notes.push(`Theoretical maximum: ${Math.floor(theoreticalMax)} lbs`);
  notes.push(`Safe working load (75% safety factor): ${maxWeight} lbs`);

  return { maxWeight, safetyFactor, notes };
}

// Calculate stud locations based on standard spacing
export function calculateStudLocations(
  wallWidth: number,
  studSpacing: number = 16,
  startOffset: number = 0
): number[] {
  const studs: number[] = [];
  let position = startOffset;

  while (position <= wallWidth) {
    studs.push(position);
    position += studSpacing;
  }

  return studs;
}

// Find nearest stud to a given position
export function findNearestStud(
  position: number,
  studLocations: number[]
): { stud: number; distance: number } | null {
  if (studLocations.length === 0) return null;

  let nearest = studLocations[0];
  let minDistance = Math.abs(position - studLocations[0]);

  for (const stud of studLocations) {
    const distance = Math.abs(position - stud);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = stud;
    }
  }

  return { stud: nearest, distance: minDistance };
}

// Material calculator: estimates brackets, screws and anchors needed
export function calculateMaterials(
  shelves: ShelfDimensions[] | ShelfPlacement[],
  wallMaterial: WallMaterial,
  mountingType: MountingType,
  options: MaterialCalcOptions = {}
): MaterialEstimate & { perShelf?: PerShelfMaterial[] } {
  // Determine brackets needed per shelf based on width and mounting style
  const bracketsForWidth = (width: number) => {
    if (mountingType === 'floating') {
      if (width <= 36) return 2;
      if (width <= 72) return 3;
      return Math.max(3, Math.ceil(width / 36));
    }

    if (mountingType === 'bracketed') {
      return width <= 48 ? 2 : 3;
    }

    // l-bracket or default
    return 2;
  };

  const screwsPerBracket = 2;
  const anchorsPerBracket = 1; // assume one anchor per bracket when not into studs

  const perShelf: PerShelfMaterial[] = [];
  let totalBrackets = 0;
  let totalScrews = 0;
  let totalAnchors = 0;
  let totalCapacity = 0;

  shelves.forEach((s, i) => {
    const b = bracketsForWidth(s.width);
    const sc = b * screwsPerBracket;
    const an = options.useStuds ? 0 : b * anchorsPerBracket;
    const id = (s as ShelfPlacement).id || `shelf-${i + 1}`;

    // Calculate bracket spacing for this specific shelf
    const bracketSpacing = s.width / b;

    // Calculate bracket positions from left edge of shelf
    const bracketPositions: number[] = [];
    for (let j = 0; j < b; j++) {
      // Center brackets within their sections
      const position = (s.width * (j + 0.5)) / b;
      bracketPositions.push(Math.round(position * 10) / 10); // round to 1 decimal
    }

    // Calculate load capacity for THIS specific shelf
    const shelfLoadCapacity = calculateLoadCapacity(
      wallMaterial,
      mountingType,
      b, // brackets for this shelf only
      options.useStuds || false,
      bracketSpacing
    );

    perShelf.push({
      id,
      width: s.width,
      brackets: b,
      screws: sc,
      anchors: an,
      maxWeightCapacity: shelfLoadCapacity.maxWeight,
      bracketSpacing: Math.round(bracketSpacing * 10) / 10, // round to 1 decimal
      bracketPositions, // add bracket positions array
    });

    totalBrackets += b;
    totalScrews += sc;
    totalAnchors += an;
    totalCapacity += shelfLoadCapacity.maxWeight;
  });

  const anchorType = (() => {
    switch (wallMaterial) {
      case 'drywall':
        return 'Drywall anchors (toggle or heavy-duty) or mount into studs';
      case 'plaster':
        return 'Plaster anchors (molly/toggle) or mount into studs';
      case 'concrete':
        return 'Concrete/masonry anchors (use hammer drill)';
      case 'brick':
        return 'Brick anchors (drill into brick, not mortar)';
      default:
        return 'Use appropriate anchors for your wall type';
    }
  })();

  const notes = `Calculated for mounting type: ${mountingType}. Weight capacities shown per shelf. Total capacity: ${totalCapacity} lbs.`;

  return {
    brackets: totalBrackets,
    screws: totalScrews,
    anchors: totalAnchors,
    anchorType,
    notes,
    perShelf,
    maxWeightCapacity: totalCapacity,
    safetyFactor: 0.75,
  };
}
