// Appels JSON vers l'API interne, avec messages d'erreur exploitables par les formulaires.
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fields: Record<string, string> };

export async function sendJson<T = { id: string }>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, message: 'Pas de connexion au serveur. Réessayez.', fields: {} };
  }

  if (response.status === 204) return { ok: true, data: undefined as T };
  const json = (await response.json().catch(() => ({}))) as {
    error?: string;
    details?: Record<string, string[]>;
  } & Partial<T>;

  if (response.ok) return { ok: true, data: json as T };

  const fields = Object.fromEntries(
    Object.entries(json.details ?? {}).map(([field, messages]) => [field, messages[0] ?? '']),
  );
  return { ok: false, message: json.error ?? `Erreur ${response.status}`, fields };
}
