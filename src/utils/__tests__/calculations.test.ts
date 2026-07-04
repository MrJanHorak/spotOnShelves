import { calculateLoadCapacity, calculateMaterials, calculateWallItemPlacement } from '../calculations';
import { describe, test, expect } from 'vitest';

describe('calculateMaterials', () => {
  test('calculates basic counts for floating shelves on drywall', () => {
    const shelves = [
      { id: 's1', width: 36, depth: 8 },
      { id: 's2', width: 24, depth: 6 },
    ];

    const result = calculateMaterials(shelves, 'drywall', 'floating');

    expect(result.brackets).toBe(4); // 2 + 2
    expect(result.screws).toBe(8); // 4 * 2
    expect(result.anchors).toBe(4); // 4 * 1
    expect(result.perShelf).toHaveLength(2);
  });

  test('useStuds option removes anchors', () => {
    const shelves = [{ id: 's1', width: 48, depth: 8 }];
    const result = calculateMaterials(shelves, 'drywall', 'bracketed', {
      useStuds: true,
    } as any);
    expect(result.anchors).toBe(0);
  });
});

describe('calculateLoadCapacity', () => {
  test('applies 30% spacing reduction when bracket spacing exceeds 48 inches', () => {
    const wideSpacing = calculateLoadCapacity(
      'drywall',
      'l-bracket',
      2,
      false,
      40,
    );
    const veryWideSpacing = calculateLoadCapacity(
      'drywall',
      'l-bracket',
      2,
      false,
      50,
    );

    expect(veryWideSpacing.notes).toContain(
      'Very wide bracket spacing (>48") reduces capacity by 30%',
    );
    expect(wideSpacing.maxWeight).toBe(63);
    expect(veryWideSpacing.maxWeight).toBe(52);
  });
});

describe('calculateWallItemPlacement', () => {
  test('uses selected wall material for hardware recommendations', () => {
    const result = calculateWallItemPlacement(
      { width: 120, height: 96 },
      [
        {
          id: 'mirror-1',
          type: 'mirror',
          width: 30,
          height: 40,
          weight: 20,
        },
      ],
      [],
      'center',
      'custom',
      57,
      true,
      6,
      undefined,
      undefined,
      false,
      'concrete',
    );

    const recommendation = result.hardwareRecommendations?.[0];
    expect(recommendation?.anchorType).toBe('Masonry anchors or concrete screws');
    expect(recommendation?.notes).toContain(
      'Concrete: use a hammer drill and masonry bit',
    );
  });
});
