import { describe, expect, it } from 'vitest';
import { formatCHF, formatDate, formatDateTime, formatPercent } from './format';

describe('formatage fr-CH déterministe', () => {
  it('groupe les milliers avec une apostrophe', () => {
    expect(formatCHF(42000)).toBe('CHF 42’000');
    expect(formatCHF(1234567.4)).toBe('CHF 1’234’567');
    expect(formatCHF(0)).toBe('CHF 0');
  });

  it('formate les dates en heure de Zurich', () => {
    expect(formatDate('2026-11-06T23:30:00Z')).toBe('07.11.2026');
    expect(formatDateTime('2026-11-06T23:30:00Z')).toBe('07.11.2026 00:30');
  });

  it('formate les pourcentages ou une absence de valeur', () => {
    expect(formatPercent(0.256)).toBe('26 %');
    expect(formatPercent(null)).toBe('—');
  });
});
