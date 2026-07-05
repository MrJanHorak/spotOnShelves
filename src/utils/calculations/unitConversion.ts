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
