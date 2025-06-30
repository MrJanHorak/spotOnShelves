import { WallDimensions, ShelfDimensions, Obstruction, ShelfPlacement, CalculationResult, Alignment } from '../types';

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
      errors.push(`Obstruction ${index + 1} dimensions must be positive numbers`);
    }
    if (obstruction.distanceFromLeft < 0 || obstruction.distanceFromFloor < 0) {
      errors.push(`Obstruction ${index + 1} position values must be non-negative`);
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
  alignment: Alignment = 'center'
): CalculationResult {
  if (shelves.length === 0) {
    return { shelves: [], measurements: [], instructions: [] };
  }

  // Sort shelves by width for better placement
  const sortedShelves = [...shelves].sort((a, b) => b.width - a.width);
  
  const placements: ShelfPlacement[] = [];
  const usedSpaces: Array<{ x1: number; x2: number; y1: number; y2: number }> = [];

  // Add obstructions to used spaces
  obstructions.forEach(obstruction => {
    usedSpaces.push({
      x1: obstruction.distanceFromLeft,
      x2: obstruction.distanceFromLeft + obstruction.width,
      y1: obstruction.distanceFromFloor,
      y2: obstruction.distanceFromFloor + obstruction.height
    });
  });

  const shelfHeight = 1; // Assume 1 unit shelf thickness
  const minSpacing = 12; // Minimum spacing between shelves
  const wallMargin = 4; // Minimum margin from wall edges

  // Calculate available height zones
  const availableHeight = wall.height - (2 * wallMargin);
  const totalShelfSpace = shelves.length * shelfHeight;
  const totalSpacing = (shelves.length - 1) * minSpacing;
  const remainingSpace = availableHeight - totalShelfSpace - totalSpacing;
  
  let currentY = wallMargin + (remainingSpace / 2); // Start from middle positioning

  sortedShelves.forEach((shelf, index) => {
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

    // Check for horizontal conflicts with obstructions
    let adjustedX = bestX;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const shelfSpace = {
        x1: adjustedX,
        x2: adjustedX + shelf.width,
        y1: currentY,
        y2: currentY + shelfHeight
      };

      const hasConflict = usedSpaces.some(space => 
        !(shelfSpace.x2 <= space.x1 || shelfSpace.x1 >= space.x2 || 
          shelfSpace.y2 <= space.y1 || shelfSpace.y1 >= space.y2)
      );

      if (!hasConflict && adjustedX >= wallMargin && adjustedX + shelf.width <= wall.width - wallMargin) {
        break;
      }

      // Try moving right, then left
      if (attempts % 2 === 0) {
        adjustedX = bestX + (attempts / 2 + 1) * 2;
      } else {
        adjustedX = bestX - (Math.ceil(attempts / 2)) * 2;
      }
      attempts++;
    }

    placements.push({
      id: shelf.id,
      distanceFromLeft: Math.max(wallMargin, Math.min(adjustedX, wall.width - shelf.width - wallMargin)),
      distanceFromFloor: currentY,
      width: shelf.width,
      depth: shelf.depth
    });

    // Add this shelf to used spaces
    usedSpaces.push({
      x1: adjustedX,
      x2: adjustedX + shelf.width,
      y1: currentY,
      y2: currentY + shelfHeight
    });

    currentY += shelfHeight + minSpacing;
  });

  // Calculate vertical spacing
  const verticalSpacing = placements.length > 1 ? 
    (placements[1].distanceFromFloor - placements[0].distanceFromFloor - shelfHeight) : undefined;

  // Generate measurements and instructions
  const measurements = placements.map((placement, index) => 
    `Shelf ${index + 1}: ${placement.distanceFromLeft.toFixed(1)} from left wall, ${placement.distanceFromFloor.toFixed(1)} from floor`
  );

  const instructions = [
    "1. Use a stud finder to locate wall studs for secure mounting",
    "2. Mark the bottom-left corner of each shelf using the measurements provided",
    "3. Use a level to ensure each shelf is perfectly horizontal",
    "4. Mark mounting holes and drill pilot holes",
    "5. Install appropriate anchors or screws based on your wall material",
    "6. Mount shelves and check stability before loading"
  ];

  return {
    shelves: placements,
    verticalSpacing,
    measurements,
    instructions
  };
}

export function convertUnits(value: number, fromUnit: 'inches' | 'cm', toUnit: 'inches' | 'cm'): number {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'inches' && toUnit === 'cm') {
    return value * 2.54;
  } else if (fromUnit === 'cm' && toUnit === 'inches') {
    return value / 2.54;
  }
  
  return value;
}

export function formatMeasurement(value: number, unit: 'inches' | 'cm'): string {
  return `${value.toFixed(1)} ${unit === 'inches' ? 'in' : 'cm'}`;
}