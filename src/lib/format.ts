// Formatage déterministe (identique sur le serveur et dans le navigateur, sans risque d'hydratation).
import { APP_TIME_ZONE, zonedParts } from './time';

/** Montant en francs suisses, séparateur de milliers à la suisse : CHF 42’000 */
export function formatCHF(value: number): string {
  const digits = Math.round(value).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '’');
  return `CHF ${grouped}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Date au format suisse : 07.11.2026 */
export function formatDate(value: Date | string): string {
  const p = zonedParts(new Date(value));
  return `${pad(p.day)}.${pad(p.month)}.${p.year}`;
}

/** Date et heure au format suisse : 07.11.2026 16:52 */
export function formatDateTime(value: Date | string): string {
  const p = zonedParts(new Date(value));
  return `${formatDate(value)} ${pad(p.hour)}:${pad(p.minute)}`;
}

export const formatPercent = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)} %`);

export { APP_TIME_ZONE };
