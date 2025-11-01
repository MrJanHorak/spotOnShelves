import { calculateMaterials } from '../calculations';

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
