import { ObstructionStandard, ObstructionType, Unit } from '../types';

export type ObstructionPreset = {
  widthIn: number;
  heightIn: number;
  distanceFromLeftIn: number;
  distanceFromFloorIn: number;
};

export const obstructionPresets: Record<
  ObstructionStandard,
  Record<ObstructionType, ObstructionPreset>
> = {
  us: {
    bed: { widthIn: 60, heightIn: 50, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    cabinet: { widthIn: 30, heightIn: 36, distanceFromLeftIn: 12, distanceFromFloorIn: 36 },
    door: { widthIn: 36, heightIn: 80, distanceFromLeftIn: 4, distanceFromFloorIn: 0 },
    window: { widthIn: 36, heightIn: 48, distanceFromLeftIn: 24, distanceFromFloorIn: 36 },
    tv: { widthIn: 55, heightIn: 32, distanceFromLeftIn: 20, distanceFromFloorIn: 30 },
    outlet: { widthIn: 2.75, heightIn: 4.5, distanceFromLeftIn: 12, distanceFromFloorIn: 12 },
    switch: { widthIn: 2.75, heightIn: 4.5, distanceFromLeftIn: 12, distanceFromFloorIn: 48 },
    plumbing: { widthIn: 16, heightIn: 24, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    other: { widthIn: 24, heightIn: 24, distanceFromLeftIn: 0, distanceFromFloorIn: 0 },
  },
  eu: {
    bed: { widthIn: 63, heightIn: 47, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    cabinet: { widthIn: 31.5, heightIn: 27.6, distanceFromLeftIn: 12, distanceFromFloorIn: 35.4 },
    door: { widthIn: 35.4, heightIn: 82.7, distanceFromLeftIn: 4, distanceFromFloorIn: 0 },
    window: { widthIn: 47.2, heightIn: 47.2, distanceFromLeftIn: 24, distanceFromFloorIn: 35.4 },
    tv: { widthIn: 55, heightIn: 32, distanceFromLeftIn: 20, distanceFromFloorIn: 30 },
    outlet: { widthIn: 3.15, heightIn: 3.15, distanceFromLeftIn: 12, distanceFromFloorIn: 11.8 },
    switch: { widthIn: 3.15, heightIn: 3.15, distanceFromLeftIn: 12, distanceFromFloorIn: 41.3 },
    plumbing: { widthIn: 15.7, heightIn: 23.6, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    other: { widthIn: 24, heightIn: 24, distanceFromLeftIn: 0, distanceFromFloorIn: 0 },
  },
  uk: {
    bed: { widthIn: 60, heightIn: 47, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    cabinet: { widthIn: 31.5, heightIn: 28, distanceFromLeftIn: 12, distanceFromFloorIn: 35 },
    door: { widthIn: 33, heightIn: 78, distanceFromLeftIn: 4, distanceFromFloorIn: 0 },
    window: { widthIn: 47, heightIn: 47, distanceFromLeftIn: 24, distanceFromFloorIn: 35 },
    tv: { widthIn: 55, heightIn: 32, distanceFromLeftIn: 20, distanceFromFloorIn: 30 },
    outlet: { widthIn: 3.4, heightIn: 3.4, distanceFromLeftIn: 12, distanceFromFloorIn: 17.7 },
    switch: { widthIn: 3.4, heightIn: 3.4, distanceFromLeftIn: 12, distanceFromFloorIn: 47.2 },
    plumbing: { widthIn: 16, heightIn: 24, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    other: { widthIn: 24, heightIn: 24, distanceFromLeftIn: 0, distanceFromFloorIn: 0 },
  },
  'au-nz': {
    bed: { widthIn: 60, heightIn: 47, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    cabinet: { widthIn: 31.5, heightIn: 28, distanceFromLeftIn: 12, distanceFromFloorIn: 35 },
    door: { widthIn: 32, heightIn: 80.7, distanceFromLeftIn: 4, distanceFromFloorIn: 0 },
    window: { widthIn: 47, heightIn: 47, distanceFromLeftIn: 24, distanceFromFloorIn: 35 },
    tv: { widthIn: 55, heightIn: 32, distanceFromLeftIn: 20, distanceFromFloorIn: 30 },
    outlet: { widthIn: 3.5, heightIn: 4.7, distanceFromLeftIn: 12, distanceFromFloorIn: 11.8 },
    switch: { widthIn: 3.5, heightIn: 4.7, distanceFromLeftIn: 12, distanceFromFloorIn: 43.3 },
    plumbing: { widthIn: 16, heightIn: 24, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    other: { widthIn: 24, heightIn: 24, distanceFromLeftIn: 0, distanceFromFloorIn: 0 },
  },
  jp: {
    bed: { widthIn: 55, heightIn: 45, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    cabinet: { widthIn: 30, heightIn: 26, distanceFromLeftIn: 12, distanceFromFloorIn: 34 },
    door: { widthIn: 31.5, heightIn: 78.7, distanceFromLeftIn: 4, distanceFromFloorIn: 0 },
    window: { widthIn: 36, heightIn: 47, distanceFromLeftIn: 24, distanceFromFloorIn: 35 },
    tv: { widthIn: 50, heightIn: 29, distanceFromLeftIn: 20, distanceFromFloorIn: 30 },
    outlet: { widthIn: 2.8, heightIn: 4.7, distanceFromLeftIn: 12, distanceFromFloorIn: 11.8 },
    switch: { widthIn: 2.8, heightIn: 4.7, distanceFromLeftIn: 12, distanceFromFloorIn: 43.3 },
    plumbing: { widthIn: 16, heightIn: 24, distanceFromLeftIn: 12, distanceFromFloorIn: 0 },
    other: { widthIn: 24, heightIn: 24, distanceFromLeftIn: 0, distanceFromFloorIn: 0 },
  },
};

export function getObstructionStandardLabel(
  standard: ObstructionStandard,
): string {
  const labels: Record<ObstructionStandard, string> = {
    us: 'US',
    eu: 'EU',
    uk: 'UK',
    'au-nz': 'AU/NZ',
    jp: 'JP',
  };
  return labels[standard];
}

export function getDefaultUnitForStandard(standard: ObstructionStandard): Unit {
  return standard === 'us' ? 'inches' : 'cm';
}
