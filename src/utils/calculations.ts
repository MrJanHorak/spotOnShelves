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
  // BaseItem,
  WallItem,
  ItemType,
  HardwareRecommendation,
  GalleryLayout,
} from '../types';

// Helper function to check if two rectangles overlap
function checkOverlap(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number },
): boolean {
  const horizontalOverlap = !(
    rect1.x + rect1.width <= rect2.x || rect2.x + rect2.width <= rect1.x
  );

  const verticalOverlap = !(
    rect1.y + rect1.height <= rect2.y || rect2.y + rect2.height <= rect1.y
  );

  return horizontalOverlap && verticalOverlap;
}

// Calculate grid spacing metrics for visualization
function calculateGridSpacingMetrics(
  wall: WallDimensions,
  placements: ShelfPlacement[],
  items: WallItem[],
) {
  if (placements.length === 0 || items.length === 0) return undefined;

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(placements.length));
  const rows = Math.ceil(placements.length / cols);

  // Calculate margins and spacings
  const leftmost = Math.min(...placements.map((p) => p.distanceFromLeft));
  const rightmost = Math.max(
    ...placements.map((p) => p.distanceFromLeft + p.width),
  );
  const topmost = Math.max(
    ...placements.map((p) => p.distanceFromFloor + p.height),
  );
  const bottommost = Math.min(...placements.map((p) => p.distanceFromFloor));

  const leftMargin = leftmost;
  const rightMargin = wall.width - rightmost;
  const topMargin = wall.height - topmost;
  const bottomMargin = bottommost;

  // Calculate average spacing between items
  const hSpacings: number[] = [];
  const vSpacings: number[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const idx = row * cols + col;
      const nextIdx = row * cols + col + 1;
      if (idx < placements.length && nextIdx < placements.length) {
        const spacing =
          placements[nextIdx].distanceFromLeft -
          (placements[idx].distanceFromLeft + placements[idx].width);
        if (spacing > 0) hSpacings.push(spacing);
      }
    }
  }

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows - 1; row++) {
      const idx = row * cols + col;
      const nextIdx = (row + 1) * cols + col;
      if (idx < placements.length && nextIdx < placements.length) {
        const spacing =
          placements[idx].distanceFromFloor -
          (placements[nextIdx].distanceFromFloor + placements[nextIdx].height);
        if (spacing > 0) vSpacings.push(spacing);
      }
    }
  }

  const avgHSpacing =
    hSpacings.length > 0
      ? hSpacings.reduce((a, b) => a + b, 0) / hSpacings.length
      : 0;
  const avgVSpacing =
    vSpacings.length > 0
      ? vSpacings.reduce((a, b) => a + b, 0) / vSpacings.length
      : 0;

  return {
    horizontalSpacing: Math.round(avgHSpacing * 10) / 10,
    verticalSpacing: Math.round(avgVSpacing * 10) / 10,
    leftMargin: Math.round(leftMargin * 10) / 10,
    rightMargin: Math.round(rightMargin * 10) / 10,
    topMargin: Math.round(topMargin * 10) / 10,
    bottomMargin: Math.round(bottomMargin * 10) / 10,
    cols,
    rows,
  };
}

export function validateInputs(
  wall: WallDimensions,
  shelves: ShelfDimensions[],
  obstructions: Obstruction[],
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
        `Obstruction ${index + 1} dimensions must be positive numbers`,
      );
    }
    if (obstruction.distanceFromLeft < 0 || obstruction.distanceFromFloor < 0) {
      errors.push(
        `Obstruction ${index + 1} position values must be non-negative`,
      );
    }
    if (obstruction.distanceFromLeft + obstruction.width > wall.width) {
      errors.push(`Obstruction ${index + 1} extends beyond wall width`);
    }
    if (obstruction.distanceFromFloor + obstruction.height > wall.height) {
      errors.push(`Obstruction ${index + 1} extends beyond wall height`);
    }
  });

  // Check for obstruction-obstruction conflicts
  for (let i = 0; i < obstructions.length; i++) {
    for (let j = i + 1; j < obstructions.length; j++) {
      if (
        checkOverlap(
          {
            x: obstructions[i].distanceFromLeft,
            y: obstructions[i].distanceFromFloor,
            width: obstructions[i].width,
            height: obstructions[i].height,
          },
          {
            x: obstructions[j].distanceFromLeft,
            y: obstructions[j].distanceFromFloor,
            width: obstructions[j].width,
            height: obstructions[j].height,
          },
        )
      ) {
        const type1 =
          obstructions[i].type.charAt(0).toUpperCase() +
          obstructions[i].type.slice(1);
        const type2 =
          obstructions[j].type.charAt(0).toUpperCase() +
          obstructions[j].type.slice(1);
        errors.push(`${type1} ${i + 1} overlaps with ${type2} ${j + 1}`);
      }
    }
  }

  return errors;
}

export function calculateOptimalPlacement(
  wall: WallDimensions,
  shelves: ShelfDimensions[],
  obstructions: Obstruction[],
  alignment: Alignment = 'center',
  studLocations?: number[],
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
      type: 'shelf',
      distanceFromLeft: Math.max(
        wallMargin,
        Math.min(adjustedX, wall.width - shelf.width - wallMargin),
      ),
      distanceFromFloor: currentY,
      width: shelf.width,
      height: shelfHeight,
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
      1,
    )} from left wall, ${placement.distanceFromFloor.toFixed(
      1,
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
    (p) => p.expectedWeight && p.expectedWeight > 30,
  );
  if (heavyShelves.length > 0) {
    instructions.push(
      '⚠️  HEAVY LOAD: For shelves with expected weight >30 lbs, ensure brackets are mounted into studs for maximum safety',
    );
  }

  if (studLocations && studLocations.length > 0) {
    instructions.push(
      `📍 Stud locations detected at: ${studLocations
        .map((s) => s.toFixed(1) + '"')
        .join(', ')}`,
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
  toUnit: 'inches' | 'cm',
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
  unit: 'inches' | 'cm',
): string {
  return `${value.toFixed(1)} ${unit === 'inches' ? 'in' : 'cm'}`;
}

// Load-bearing capacity calculation
export function calculateLoadCapacity(
  wallMaterial: WallMaterial,
  mountingType: MountingType,
  bracketsCount: number,
  useStuds: boolean = false,
  bracketSpacing?: number,
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
          'Bracketed shelves in studs can support 125 lbs per bracket',
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
          'Drywall anchors: use heavy-duty toggle bolts for best results',
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
  startOffset: number = 0,
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
  studLocations: number[],
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
  options: MaterialCalcOptions = {},
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
      bracketSpacing,
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

// Calculate eye-level height for pictures (57-60 inches is standard gallery height)
export function calculateEyeLevelHeight(
  wallHeight: number,
  itemHeight: number,
): number {
  // Standard gallery height is 57 inches to center of artwork
  const standardEyeLevel = 57;

  // If wall is very tall, use standard height; otherwise adjust proportionally
  const eyeLevel = wallHeight > 96 ? standardEyeLevel : wallHeight * 0.55;

  // Return the floor distance to the BOTTOM of the item (center - half height)
  return eyeLevel - itemHeight / 2;
}

// Calculate optimal placement for wall items (pictures, posters, etc.)
export function calculateWallItemPlacement(
  wall: WallDimensions,
  items: (ShelfDimensions | WallItem)[],
  obstructions: Obstruction[],
  alignment: Alignment = 'center',
  galleryLayout: GalleryLayout = 'custom',
  eyeLevelHeight: number = 57,
  autoArrange: boolean = true,
  minSpacing: number = 6,
  horizontalSpacing?: number,
  verticalSpacing?: number,
  distributeEvenly: boolean = false,
): CalculationResult {
  if (items.length === 0) {
    return {
      shelves: [],
      measurements: [],
      instructions: [],
      hardwareRecommendations: [],
    };
  }

  const placements: ShelfPlacement[] = [];
  const hardwareRecommendations: HardwareRecommendation[] = [];

  // Separate items with manual positions from auto-positioned items
  const manualItems = items.filter(
    (item) => item.manualPosition && (item.locked || !autoArrange),
  );
  const autoItems = items.filter(
    (item) => !item.manualPosition || (!item.locked && autoArrange),
  );

  // First, place manually positioned items
  manualItems.forEach((item) => {
    if (item.manualPosition) {
      const itemHeight = item.height || (item.type === 'shelf' ? 1 : 24);
      placements.push({
        id: item.id,
        type: item.type,
        distanceFromLeft: item.manualPosition.distanceFromLeft,
        distanceFromFloor: item.manualPosition.distanceFromFloor,
        width: item.width,
        height: itemHeight,
        depth:
          item.type === 'shelf' ? (item as ShelfDimensions).depth : undefined,
        weight:
          item.weight ||
          (item.type === 'shelf'
            ? (item as ShelfDimensions).expectedWeight
            : undefined),
        expectedWeight:
          item.type === 'shelf'
            ? (item as ShelfDimensions).expectedWeight
            : undefined,
        hangingMethod:
          item.type !== 'shelf' ? (item as WallItem).hangingMethod : undefined,
        frameDepth:
          item.type !== 'shelf' ? (item as WallItem).frameDepth : undefined,
        isFramed:
          item.type !== 'shelf' ? (item as WallItem).isFramed : undefined,
        shape: item.type !== 'shelf' ? (item as WallItem).shape : undefined,
      });
    }
  });

  // Separate shelves from wall items in auto items
  const shelves = autoItems.filter(
    (item): item is ShelfDimensions => item.type === 'shelf',
  );
  const wallItems = autoItems.filter(
    (item): item is WallItem => item.type !== 'shelf',
  );

  // First, place shelves using existing logic
  if (shelves.length > 0) {
    const shelfResult = calculateOptimalPlacement(
      wall,
      shelves,
      obstructions,
      alignment,
    );
    placements.push(...shelfResult.shelves);
  }

  // Then place wall items based on gallery layout
  if (wallItems.length > 0) {
    const wallItemPlacements = applyGalleryLayout(
      wall,
      wallItems,
      obstructions,
      alignment,
      galleryLayout,
      eyeLevelHeight,
      placements, // existing placements to avoid
      minSpacing,
      horizontalSpacing,
      verticalSpacing,
      distributeEvenly,
    );
    placements.push(...wallItemPlacements);

    // Generate hardware recommendations for each wall item
    wallItems.forEach((item) => {
      const recommendation = generateHardwareRecommendation(item, 'drywall');
      hardwareRecommendations.push(recommendation);
    });
  }

  const measurements = placements.map((placement, index) => {
    const item = items.find((i) => i.id === placement.id);
    const typeLabel = item ? getItemTypeLabel(item.type) : 'Item';
    const weightInfo = placement.weight
      ? ` (Weight: ${placement.weight} lbs)`
      : '';
    return `${typeLabel} ${index + 1}: ${placement.distanceFromLeft.toFixed(
      1,
    )}" from left, ${placement.distanceFromFloor.toFixed(
      1,
    )}" from floor${weightInfo}`;
  });

  const instructions = generateInstallationInstructions(items, galleryLayout);

  // Calculate grid spacing metrics if this is a grid layout
  let gridSpacing: ReturnType<typeof calculateGridSpacingMetrics> | undefined =
    undefined;
  if (galleryLayout === 'grid' && wallItems.length > 0) {
    gridSpacing = calculateGridSpacingMetrics(
      wall,
      placements.filter((p) => wallItems.some((w) => w.id === p.id)),
      wallItems,
    );
  }

  return {
    shelves: placements,
    measurements,
    instructions,
    hardwareRecommendations,
    galleryLayout,
    gridSpacing,
  };
}

// Get abbreviated item type label
function getItemTypeAbbreviation(type: ItemType): string {
  const abbreviations: Record<ItemType, string> = {
    shelf: 'S',
    picture: 'P',
    poster: 'Po',
    mirror: 'M',
    tv: 'T',
    artpiece: 'A',
  };
  return abbreviations[type] || '?';
}

// Apply different gallery layout patterns
function applyGalleryLayout(
  wall: WallDimensions,
  items: WallItem[],
  obstructions: Obstruction[],
  alignment: Alignment,
  layout: GalleryLayout,
  eyeLevelHeight: number,
  existingPlacements: ShelfPlacement[],
  minSpacing: number = 6,
  horizontalSpacing?: number,
  verticalSpacing?: number,
  distributeEvenly: boolean = false,
): ShelfPlacement[] {
  const margin = 4; // margin from wall edges
  // Use specific spacings if provided, otherwise fall back to minSpacing
  const hSpacing = horizontalSpacing ?? minSpacing;
  const vSpacing = verticalSpacing ?? minSpacing;

  switch (layout) {
    case 'grid':
      return applyGridLayout(
        wall,
        items,
        margin,
        eyeLevelHeight,
        obstructions,
        existingPlacements,
        hSpacing,
        vSpacing,
        distributeEvenly,
      );
    case 'salon':
      return applySalonLayout(
        wall,
        items,
        margin,
        eyeLevelHeight,
        obstructions,
        existingPlacements,
      );
    case 'linear':
      return applyLinearLayout(
        wall,
        items,
        alignment,
        margin,
        eyeLevelHeight,
        obstructions,
        existingPlacements,
        minSpacing,
      );
    case 'custom':
    default:
      return applyCustomLayout(
        wall,
        items,
        alignment,
        margin,
        eyeLevelHeight,
        obstructions,
        existingPlacements,
      );
  }
}

// Grid layout: evenly spaced in rows and columns, centered around eye level
function applyGridLayout(
  wall: WallDimensions,
  items: WallItem[],
  margin: number,
  eyeLevelHeight: number,
  obstructions: Obstruction[],
  existingPlacements: ShelfPlacement[],
  horizontalSpacing: number = 6,
  verticalSpacing: number = 6,
  distributeEvenly: boolean = false,
): ShelfPlacement[] {
  const placements: ShelfPlacement[] = [];

  // Calculate grid dimensions
  const cols = Math.ceil(Math.sqrt(items.length));
  const rows = Math.ceil(items.length / cols);

  // Calculate total height needed for the grid
  const maxItemHeight = Math.max(...items.map((item) => item.height));
  const totalGridHeight = rows * maxItemHeight + (rows - 1) * verticalSpacing;

  // Find available horizontal zones considering obstructions
  const horizontalZones: Array<{ start: number; end: number; height: number }> =
    [];

  // Start with the full wall width
  const sortedObs = [...obstructions].sort(
    (a, b) => a.distanceFromLeft - b.distanceFromLeft,
  );

  let currentX = margin;
  for (const obs of sortedObs) {
    // Add zone before this obstruction if there's space
    if (currentX < obs.distanceFromLeft - margin) {
      horizontalZones.push({
        start: currentX,
        end: obs.distanceFromLeft - margin,
        height: obs.distanceFromFloor,
      });
    }
    // Move past this obstruction
    currentX = Math.max(currentX, obs.distanceFromLeft + obs.width + margin);
  }

  // Add final zone if there's remaining space
  if (currentX < wall.width - margin) {
    horizontalZones.push({
      start: currentX,
      end: wall.width - margin,
      height: wall.height,
    });
  }

  // If no obstructions, use the full width
  if (horizontalZones.length === 0) {
    horizontalZones.push({
      start: margin,
      end: wall.width - margin,
      height: wall.height,
    });
  }

  // Find the widest available zone to center the grid
  let bestZone = horizontalZones[0];
  for (const zone of horizontalZones) {
    if (zone.end - zone.start > bestZone.end - bestZone.start) {
      bestZone = zone;
    }
  }

  // Calculate available width within the best zone
  const availableWidth = bestZone.end - bestZone.start;
  const maxItemWidth = Math.max(...items.map((item) => item.width));

  // Calculate cell width based on distribution mode
  let cellWidth: number;
  let gridStartX: number;

  if (distributeEvenly) {
    // Distribute items evenly across available space with EQUAL GAPS including edges
    // Formula: margin_gap = item_gap = (availableWidth - cols*itemWidth) / (cols+1)
    const totalItemWidth = cols * maxItemWidth;
    const totalGapSpace = availableWidth - totalItemWidth;
    const gapSize = totalGapSpace / (cols + 1);

    // Position grid to start after first gap
    gridStartX = bestZone.start + gapSize;

    // Cell width includes the item plus the gap after it
    cellWidth = maxItemWidth + gapSize;
  } else {
    // Original behavior: items centered in zone with standard spacing
    cellWidth = availableWidth / cols;
    gridStartX = bestZone.start;
  }

  // Center the grid vertically around eye level
  const gridStartY = eyeLevelHeight - totalGridHeight / 2;

  // Ensure grid stays within bounds
  const finalStartY = Math.max(
    margin,
    Math.min(gridStartY, wall.height - totalGridHeight - margin),
  );

  items.forEach((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);

    // Horizontal positioning - use calculated grid positioning
    const x = distributeEvenly
      ? gridStartX + col * cellWidth
      : gridStartX + col * cellWidth + (cellWidth - item.width) / 2;

    // Vertical positioning - centered around eye level
    const y =
      finalStartY +
      row * (maxItemHeight + verticalSpacing) +
      (maxItemHeight - item.height) / 2;

    // Check if this position would collide with an obstruction
    let finalX = x;
    let finalY = y;

    for (const obs of obstructions) {
      // Check if item would overlap with obstruction
      if (
        x < obs.distanceFromLeft + obs.width &&
        x + item.width > obs.distanceFromLeft &&
        y < obs.distanceFromFloor + obs.height &&
        y + item.height > obs.distanceFromFloor
      ) {
        // Try to shift item above or to the side of obstruction
        if (y + item.height <= obs.distanceFromFloor) {
          // Can fit above
          finalY = obs.distanceFromFloor - item.height - margin;
        } else if (y >= obs.distanceFromFloor + obs.height) {
          // Can fit below
          finalY = obs.distanceFromFloor + obs.height + margin;
        } else if (x + item.width <= obs.distanceFromLeft) {
          // Can fit to the left
          finalX = obs.distanceFromLeft - item.width - margin;
        } else if (x >= obs.distanceFromLeft + obs.width) {
          // Can fit to the right
          finalX = obs.distanceFromLeft + obs.width + margin;
        }
        break;
      }
    }

    placements.push({
      id: item.id,
      type: item.type,
      distanceFromLeft: Math.max(
        margin,
        Math.min(finalX, wall.width - item.width - margin),
      ),
      distanceFromFloor: Math.max(
        margin,
        Math.min(finalY, wall.height - item.height - margin),
      ),
      width: item.width,
      height: item.height,
      weight: item.weight,
      hangingMethod: item.hangingMethod,
      frameDepth: item.frameDepth,
      isFramed: item.isFramed,
      shape: item.shape,
    });
  });

  return placements;
}

// Salon layout: organic, clustered arrangement
function applySalonLayout(
  wall: WallDimensions,
  items: WallItem[],
  margin: number,
  eyeLevelHeight: number,
  obstructions: Obstruction[],
  existingPlacements: ShelfPlacement[],
): ShelfPlacement[] {
  const placements: ShelfPlacement[] = [];

  // Sort by size (largest first)
  const sorted = [...items].sort(
    (a, b) => b.width * b.height - a.width * a.height,
  );

  // Place largest item at eye level center
  if (sorted.length > 0) {
    const centerItem = sorted[0];
    placements.push({
      id: centerItem.id,
      type: centerItem.type,
      distanceFromLeft: (wall.width - centerItem.width) / 2,
      distanceFromFloor: eyeLevelHeight - centerItem.height / 2,
      width: centerItem.width,
      height: centerItem.height,
      weight: centerItem.weight,
      hangingMethod: centerItem.hangingMethod,
      frameDepth: centerItem.frameDepth,
      isFramed: centerItem.isFramed,
      shape: centerItem.shape,
    });

    // Place remaining items around the center
    for (let i = 1; i < sorted.length; i++) {
      const item = sorted[i];
      const angle = (i / (sorted.length - 1)) * Math.PI * 2;
      const distance = 20 + Math.random() * 10;

      const centerX = wall.width / 2;
      const centerY = eyeLevelHeight;

      const x = centerX + Math.cos(angle) * distance - item.width / 2;
      const y = centerY + Math.sin(angle) * distance - item.height / 2;

      placements.push({
        id: item.id,
        type: item.type,
        distanceFromLeft: Math.max(
          margin,
          Math.min(x, wall.width - item.width - margin),
        ),
        distanceFromFloor: Math.max(
          margin,
          Math.min(y, wall.height - item.height - margin),
        ),
        width: item.width,
        height: item.height,
        weight: item.weight,
        hangingMethod: item.hangingMethod,
        frameDepth: item.frameDepth,
        isFramed: item.isFramed,
        shape: item.shape,
      });
    }
  }

  return placements;
}

// Linear layout: single horizontal line at eye level
function applyLinearLayout(
  wall: WallDimensions,
  items: WallItem[],
  alignment: Alignment,
  margin: number,
  eyeLevelHeight: number,
  obstructions: Obstruction[],
  existingPlacements: ShelfPlacement[],
  spacing: number = 6,
): ShelfPlacement[] {
  const placements: ShelfPlacement[] = [];

  // Calculate total width needed
  const totalWidth =
    items.reduce((sum, item) => sum + item.width, 0) +
    spacing * (items.length - 1);

  let startX = margin;
  if (alignment === 'center') {
    startX = (wall.width - totalWidth) / 2;
  } else if (alignment === 'right') {
    startX = wall.width - totalWidth - margin;
  }

  // Check if the linear layout would overlap with existing placements
  // If so, shift vertically
  let baseY = eyeLevelHeight;
  let needsAdjustment = true;
  let attempts = 0;

  while (needsAdjustment && attempts < 20) {
    needsAdjustment = false;
    attempts++;

    let currentX = startX;
    for (const item of items) {
      const y = baseY - item.height / 2;

      // Check overlaps with existing placements
      for (const placement of existingPlacements) {
        if (
          checkOverlap(
            { x: currentX, y, width: item.width, height: item.height },
            {
              x: placement.distanceFromLeft,
              y: placement.distanceFromFloor,
              width: placement.width,
              height: placement.height,
            },
          )
        ) {
          needsAdjustment = true;
          baseY -= item.height + spacing;
          break;
        }
      }

      if (needsAdjustment) break;

      // Check overlaps with obstructions
      for (const obstruction of obstructions) {
        if (
          checkOverlap(
            { x: currentX, y, width: item.width, height: item.height },
            {
              x: obstruction.distanceFromLeft,
              y: obstruction.distanceFromFloor,
              width: obstruction.width,
              height: obstruction.height,
            },
          )
        ) {
          needsAdjustment = true;
          baseY -= item.height + spacing;
          break;
        }
      }

      if (needsAdjustment) break;
      currentX += item.width + spacing;
    }
  }

  let currentX = startX;
  items.forEach((item) => {
    placements.push({
      id: item.id,
      type: item.type,
      distanceFromLeft: currentX,
      distanceFromFloor: baseY - item.height / 2,
      width: item.width,
      height: item.height,
      weight: item.weight,
      hangingMethod: item.hangingMethod,
      frameDepth: item.frameDepth,
      isFramed: item.isFramed,
      shape: item.shape,
    });
    currentX += item.width + spacing;
  });

  return placements;
}

// Custom layout: user-defined or default centered placement with overlap avoidance
function applyCustomLayout(
  wall: WallDimensions,
  items: WallItem[],
  alignment: Alignment,
  margin: number,
  eyeLevelHeight: number,
  obstructions: Obstruction[],
  existingPlacements: ShelfPlacement[],
): ShelfPlacement[] {
  const placements: ShelfPlacement[] = [];
  const minSpacing = 4; // minimum spacing between items

  // Helper function to check if a position overlaps with anything
  const hasOverlap = (
    x: number,
    y: number,
    width: number,
    height: number,
  ): boolean => {
    // Check against existing placements (shelves)
    for (const placement of existingPlacements) {
      if (
        checkOverlap(
          { x, y, width, height },
          {
            x: placement.distanceFromLeft,
            y: placement.distanceFromFloor,
            width: placement.width,
            height: placement.height,
          },
        )
      ) {
        return true;
      }
    }

    // Check against already placed items
    for (const placement of placements) {
      if (
        checkOverlap(
          { x, y, width, height },
          {
            x: placement.distanceFromLeft,
            y: placement.distanceFromFloor,
            width: placement.width,
            height: placement.height,
          },
        )
      ) {
        return true;
      }
    }

    // Check against obstructions
    for (const obstruction of obstructions) {
      if (
        checkOverlap(
          { x, y, width, height },
          {
            x: obstruction.distanceFromLeft,
            y: obstruction.distanceFromFloor,
            width: obstruction.width,
            height: obstruction.height,
          },
        )
      ) {
        return true;
      }
    }

    return false;
  };

  items.forEach((item) => {
    let x = margin;
    let y = eyeLevelHeight - item.height / 2;

    // Calculate initial horizontal position based on alignment
    switch (alignment) {
      case 'center':
        x = (wall.width - item.width) / 2;
        break;
      case 'right':
        x = wall.width - item.width - margin;
        break;
      case 'left':
      default:
        x = margin;
        break;
    }

    // Try to find a non-overlapping position
    let attempts = 0;
    const maxAttempts = 50;

    while (
      hasOverlap(x, y, item.width, item.height) &&
      attempts < maxAttempts
    ) {
      attempts++;

      // Try moving down first
      y -= item.height + minSpacing;

      // If we're too low, try moving to the right
      if (y < margin) {
        y = eyeLevelHeight - item.height / 2;
        x += item.width + minSpacing;

        // If we're too far right, try left side
        if (x + item.width > wall.width - margin) {
          x = margin;
          y = eyeLevelHeight + item.height + minSpacing;
        }
      }

      // Keep within bounds
      x = Math.max(margin, Math.min(x, wall.width - item.width - margin));
      y = Math.max(margin, Math.min(y, wall.height - item.height - margin));
    }

    placements.push({
      id: item.id,
      type: item.type,
      distanceFromLeft: x,
      distanceFromFloor: y,
      width: item.width,
      height: item.height,
      weight: item.weight,
      hangingMethod: item.hangingMethod,
      frameDepth: item.frameDepth,
      isFramed: item.isFramed,
      shape: item.shape,
    });
  });

  return placements;
}

// Generate hardware recommendations based on item type and weight
export function generateHardwareRecommendation(
  item: WallItem,
  wallMaterial: WallMaterial,
): HardwareRecommendation {
  const weight = item.weight || estimateWeight(item);
  const notes: string[] = [];
  let hardware = '';
  let anchorType = '';
  let screwSize = '';
  let quantity = 2;
  let maxWeightCapacity = 0;

  // Determine hardware based on weight
  if (weight <= 5) {
    hardware = 'Picture hanging strips or small nails';
    anchorType = 'Adhesive strips or 1.5" finishing nails';
    screwSize = 'N/A (nails)';
    quantity = 2;
    maxWeightCapacity = 8;
    notes.push(
      "For lightweight items, adhesive strips work well and don't damage walls",
    );
    notes.push('Use two strips or nails for better stability');
  } else if (weight <= 15) {
    hardware = 'Picture hanging hooks with anchors';
    anchorType = 'Plastic anchors or threaded drywall anchors';
    screwSize = '#6 or #8 (1.5")';
    quantity = 2;
    maxWeightCapacity = 20;
    notes.push('Use quality picture hanging hooks rated for weight');
    notes.push('Install anchors first, then hooks');
  } else if (weight <= 30) {
    hardware = 'Heavy-duty picture hangers or D-rings';
    anchorType = 'Toggle bolts or heavy-duty anchors';
    screwSize = '#10 (2")';
    quantity = 2;
    maxWeightCapacity = 40;
    notes.push('For heavier items, consider mounting into studs');
    notes.push('Use two hanging points for better distribution');
  } else if (weight <= 50) {
    hardware = 'French cleat or heavy-duty brackets';
    anchorType = 'Toggle bolts into studs (required)';
    screwSize = '3" wood screws';
    quantity = 4;
    maxWeightCapacity = 75;
    notes.push('⚠️ HEAVY ITEM: Must mount into wall studs');
    notes.push(
      'French cleats provide excellent stability for heavy mirrors/art',
    );
    notes.push('Use stud finder to locate studs before installation');
  } else {
    hardware = 'French cleat or Z-bar mounting system';
    anchorType = 'Must mount into studs';
    screwSize = '3-4" lag bolts';
    quantity = 6;
    maxWeightCapacity = 100;
    notes.push('⚠️ VERY HEAVY ITEM: Professional installation recommended');
    notes.push('Must mount into multiple wall studs');
    notes.push('Consider using Z-bar or French cleat system');
  }

  // Add item-specific recommendations
  if (item.type === 'mirror') {
    notes.push('Mirrors: Ensure hanging method distributes weight evenly');
    notes.push('Consider safety backing film for large mirrors');
  } else if (item.type === 'tv') {
    notes.push(
      'TV: Use TV-specific wall mount rated for your TV weight and size',
    );
    notes.push('ALWAYS mount TV brackets into wall studs');
  } else if (item.type === 'artpiece' && item.isFramed) {
    notes.push('Framed art: Check frame hardware is secure before hanging');
  }

  // Add hanging method-specific notes
  if (item.hangingMethod === 'wire') {
    notes.push('Wire hanging: Keep wire taut and use two hooks for stability');
  } else if (item.hangingMethod === 'french-cleat') {
    notes.push('French cleat: Ensures level hanging and easy removal');
  } else if (item.hangingMethod === 'd-ring') {
    notes.push('D-rings: Use two rings for balanced hanging');
  }

  return {
    itemId: item.id,
    itemType: item.type,
    weight,
    hardware,
    anchorType,
    screwSize,
    quantity,
    notes,
    maxWeightCapacity,
  };
}

// Estimate weight based on item dimensions and type
function estimateWeight(item: WallItem): number {
  const area = item.width * item.height;

  switch (item.type) {
    case 'picture':
      return item.isFramed ? area / 100 : area / 200; // framed pictures heavier
    case 'poster':
      return area / 300; // posters are light
    case 'mirror':
      return area / 50; // mirrors are heavy
    case 'tv':
      return area / 30; // TVs vary, but generally heavy
    case 'artpiece':
      return area / 80; // varies widely
    default:
      return area / 100;
  }
}

// Get human-readable label for item type
function getItemTypeLabel(type: ItemType): string {
  const labels: Record<ItemType, string> = {
    shelf: 'Shelf',
    picture: 'Picture',
    poster: 'Poster',
    mirror: 'Mirror',
    tv: 'TV',
    artpiece: 'Art Piece',
  };
  return labels[type] || 'Item';
}

// Generate installation instructions based on item types
function generateInstallationInstructions(
  items: (ShelfDimensions | WallItem)[],
  galleryLayout?: GalleryLayout,
): string[] {
  const hasShelf = items.some((i) => i.type === 'shelf');
  const hasPictures = items.some((i) => i.type === 'picture');
  const hasPoster = items.some((i) => i.type === 'poster');
  const hasMirror = items.some((i) => i.type === 'mirror');
  const hasTV = items.some((i) => i.type === 'tv');
  const hasArtpiece = items.some((i) => i.type === 'artpiece');
  const hasWallItems = items.some((i) => i.type !== 'shelf');

  const instructions: string[] = [];

  if (hasWallItems) {
    instructions.push(
      '1. Mark center points for each item using measurements provided',
    );
    instructions.push('2. Use a level to ensure all items are straight');
    instructions.push('3. Standard eye level is 57" to center of artwork');

    if (galleryLayout === 'grid') {
      instructions.push(
        '4. Grid layout: Measure spacing carefully for uniform appearance',
      );
    } else if (galleryLayout === 'salon') {
      instructions.push(
        '4. Salon layout: Start with largest piece at center, work outward',
      );
    } else if (galleryLayout === 'linear') {
      instructions.push(
        '4. Linear layout: Ensure all items align at same height',
      );
    }

    const itemTypes: string[] = [];
    if (hasPictures) itemTypes.push('Pictures');
    if (hasPoster) itemTypes.push('Posters');
    if (hasMirror) itemTypes.push('Mirrors');
    if (hasTV) itemTypes.push('TVs');
    if (hasArtpiece) itemTypes.push('Art Pieces');

    instructions.push(
      `5. Installing: ${itemTypes.join(', ')} - Use appropriate hardware based on weight`,
    );
    instructions.push(
      '6. For items over 15 lbs, locate and use wall studs when possible',
    );

    if (hasTV) {
      instructions.push(
        '   ⚠️  TVs: Use heavy-duty brackets mounted into studs',
      );
    }
    if (hasMirror) {
      instructions.push(
        '   💧 Mirrors: Avoid moisture-prone areas; ensure secure mounting',
      );
    }
  }

  if (hasShelf) {
    instructions.push(
      '• Shelves: Use stud finder and ensure brackets are level',
    );
    instructions.push(
      '• Heavy shelves (>30 lbs expected load) must mount into studs',
    );
  }

  instructions.push(
    '⚠️ Safety: Always use appropriate hardware for item weight',
  );
  instructions.push(
    '📏 Tip: Create paper templates to visualize arrangement before drilling',
  );

  return instructions;
}

// Helper function to check for conflicts between placed items and obstructions
export function checkItemObstructionConflicts(
  placements: ShelfPlacement[],
  obstructions: Obstruction[],
): string[] {
  const errors: string[] = [];

  obstructions.forEach((obs, obsIndex) => {
    placements.forEach((placement, placementIndex) => {
      const itemHeight = placement.height || 1;

      if (
        checkOverlap(
          {
            x: obs.distanceFromLeft,
            y: obs.distanceFromFloor,
            width: obs.width,
            height: obs.height,
          },
          {
            x: placement.distanceFromLeft,
            y: placement.distanceFromFloor,
            width: placement.width,
            height: itemHeight,
          },
        )
      ) {
        const obsType = obs.type.charAt(0).toUpperCase() + obs.type.slice(1);
        const itemType =
          placement.type.charAt(0).toUpperCase() + placement.type.slice(1);
        errors.push(
          `${obsType} ${obsIndex + 1} overlaps with ${itemType} ${
            placementIndex + 1
          } - please reposition`,
        );
      }
    });
  });

  return errors;
}

// Helper function to check for conflicts between placed items themselves
export function checkPlacedItemConflicts(
  placements: ShelfPlacement[],
): string[] {
  const errors: string[] = [];

  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const item1 = placements[i];
      const item2 = placements[j];
      const item1Height = item1.height || 1;
      const item2Height = item2.height || 1;

      if (
        checkOverlap(
          {
            x: item1.distanceFromLeft,
            y: item1.distanceFromFloor,
            width: item1.width,
            height: item1Height,
          },
          {
            x: item2.distanceFromLeft,
            y: item2.distanceFromFloor,
            width: item2.width,
            height: item2Height,
          },
        )
      ) {
        const type1 = item1.type.charAt(0).toUpperCase() + item1.type.slice(1);
        const type2 = item2.type.charAt(0).toUpperCase() + item2.type.slice(1);
        errors.push(
          `${type1} ${i + 1} overlaps with ${type2} ${
            j + 1
          } - please reposition or resize`,
        );
      }
    }
  }

  return errors;
}
