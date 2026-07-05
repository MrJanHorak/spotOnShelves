import { describe, expect, test } from 'vitest';
import { inferObstructionStandardFromLocales } from '../localeDefaults';
import {
  getDefaultUnitForStandard,
  obstructionPresets,
} from '../obstructionStandards';
import { convertUnits } from '../calculations';
import { ObstructionType } from '../../types';

describe('inferObstructionStandardFromLocales', () => {
  test('maps common regions to standards', () => {
    expect(inferObstructionStandardFromLocales(['en-US'])).toBe('us');
    expect(inferObstructionStandardFromLocales(['en-GB'])).toBe('uk');
    expect(inferObstructionStandardFromLocales(['en-AU'])).toBe('au-nz');
    expect(inferObstructionStandardFromLocales(['ja-JP'])).toBe('jp');
  });

  test('defaults unknown region to eu when region code is present', () => {
    expect(inferObstructionStandardFromLocales(['de-CH'])).toBe('eu');
  });

  test('falls back to us when no locale contains a region code', () => {
    expect(inferObstructionStandardFromLocales(['en', 'fr'])).toBe('us');
  });
});

describe('obstruction standards metadata', () => {
  test('returns expected default units for each standard', () => {
    expect(getDefaultUnitForStandard('us')).toBe('inches');
    expect(getDefaultUnitForStandard('eu')).toBe('cm');
    expect(getDefaultUnitForStandard('uk')).toBe('cm');
    expect(getDefaultUnitForStandard('au-nz')).toBe('cm');
    expect(getDefaultUnitForStandard('jp')).toBe('cm');
  });

  test('includes presets for every obstruction type in every standard', () => {
    const obstructionTypes: ObstructionType[] = [
      'bed',
      'cabinet',
      'door',
      'window',
      'tv',
      'outlet',
      'switch',
      'plumbing',
      'other',
    ];

    for (const standard of Object.keys(obstructionPresets)) {
      for (const obstructionType of obstructionTypes) {
        const preset =
          obstructionPresets[standard as keyof typeof obstructionPresets][
            obstructionType
          ];
        expect(preset).toBeDefined();
        expect(preset.widthIn).toBeGreaterThan(0);
        expect(preset.heightIn).toBeGreaterThan(0);
      }
    }
  });
});

describe('unit conversion utility', () => {
  test('converts inches to cm and back consistently', () => {
    const cm = convertUnits(96, 'inches', 'cm');
    expect(cm).toBeCloseTo(243.84, 5);

    const inches = convertUnits(cm, 'cm', 'inches');
    expect(inches).toBeCloseTo(96, 5);
  });
});
