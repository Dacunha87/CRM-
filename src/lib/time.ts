// Dates et jours calendaires dans le fuseau de l'entreprise (Suisse).
// Indispensable : le serveur (Vercel) tourne en UTC, les commerciaux sont en Suisse.
export const APP_TIME_ZONE = 'Europe/Zurich';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

export function zonedParts(date: Date): ZonedParts {
  const map = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Jour calendaire « AAAA-MM-JJ » dans le fuseau de l'application. */
export function zurichDayKey(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Minuit (heure de Zurich) du jour de `date`, décalé de `offsetDays` jours. */
export function startOfZurichDay(date: Date, offsetDays = 0): Date {
  const p = zonedParts(date);
  const midnightAsUtc = Date.UTC(p.year, p.month - 1, p.day + offsetDays);
  const probe = zonedParts(new Date(midnightAsUtc));
  const wallClockAsUtc = Date.UTC(probe.year, probe.month - 1, probe.day, probe.hour, probe.minute, probe.second);
  const offsetMs = wallClockAsUtc - midnightAsUtc; // décalage du fuseau à cet instant
  return new Date(midnightAsUtc - offsetMs);
}
