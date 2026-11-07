import { describe, expect, it } from 'vitest';
import { startOfZurichDay, zurichDayKey } from './time';

describe('fuseau Europe/Zurich', () => {
  it('minuit de Zurich en hiver (UTC+1) tombe à 23 h UTC la veille', () => {
    const start = startOfZurichDay(new Date('2026-11-07T15:00:00Z'));
    expect(start.toISOString()).toBe('2026-11-06T23:00:00.000Z');
  });

  it("minuit de Zurich en été (UTC+2) tombe à 22 h UTC la veille", () => {
    const start = startOfZurichDay(new Date('2026-07-01T10:00:00Z'));
    expect(start.toISOString()).toBe('2026-06-30T22:00:00.000Z');
  });

  it('décale correctement de jours entiers', () => {
    const tomorrow = startOfZurichDay(new Date('2026-11-07T15:00:00Z'), 1);
    expect(tomorrow.toISOString()).toBe('2026-11-07T23:00:00.000Z');
  });

  it('un instant proche de minuit UTC appartient déjà au jour suivant à Zurich', () => {
    // 23 h 30 UTC le 6 novembre = 0 h 30 le 7 novembre à Zurich
    expect(zurichDayKey(new Date('2026-11-06T23:30:00Z'))).toBe('2026-11-07');
  });
});
