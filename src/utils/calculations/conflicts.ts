import { Obstruction, ShelfPlacement } from '../../types';

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
