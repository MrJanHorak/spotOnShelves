import { ObstructionStandard } from '../types';

function inferObstructionStandardFromLocale(
  locale: string,
): ObstructionStandard | null {
  const match = locale.match(/[-_]([A-Za-z]{2})\b/);
  const region = match?.[1]?.toUpperCase();
  if (!region) return null;

  if (region === 'US' || region === 'CA') return 'us';
  if (region === 'GB' || region === 'UK' || region === 'IE') return 'uk';
  if (region === 'AU' || region === 'NZ') return 'au-nz';
  if (region === 'JP') return 'jp';
  return 'eu';
}

export function inferObstructionStandardFromLocales(
  localeCandidates: string[],
): ObstructionStandard {
  for (const locale of localeCandidates) {
    const standard = inferObstructionStandardFromLocale(locale);
    if (standard) return standard;
  }
  return 'us';
}

export function detectObstructionStandardFromBrowser(): ObstructionStandard {
  if (typeof navigator === 'undefined') return 'us';

  const localeCandidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().locale,
  ].filter(Boolean) as string[];

  return inferObstructionStandardFromLocales(localeCandidates);
}
