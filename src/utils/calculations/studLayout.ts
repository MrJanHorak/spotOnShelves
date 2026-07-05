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
