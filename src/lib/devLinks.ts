// Mémoire des derniers liens de connexion, utilisée UNIQUEMENT en développement / aperçu
// (voir src/app/dev/last-link). Jamais active en production.
type Store = Map<string, string>;
const g = globalThis as unknown as { __devLinks?: Store };

export function devLinksEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.AUTH_SHOW_LINK === 'true';
}

export function rememberLink(email: string, url: string) {
  if (!devLinksEnabled()) return;
  g.__devLinks ??= new Map();
  g.__devLinks.set(email, url);
}

export function lastLink(email: string): string | undefined {
  return g.__devLinks?.get(email);
}
