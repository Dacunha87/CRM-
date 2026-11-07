// Helpers pour les routes API : réponses d'erreur homogènes et lecture validée du JSON.
import { NextResponse } from 'next/server';
import type { ZodType, ZodTypeDef } from 'zod';

export function apiError(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export async function readJson<T>(
  req: Request,
  schema: ZodType<T, ZodTypeDef, unknown>,
): Promise<{ data: T } | { response: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { response: apiError(400, 'Corps de requête JSON invalide') };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { response: apiError(422, 'Données invalides', parsed.error.flatten().fieldErrors) };
  }
  return { data: parsed.data };
}

/** Convertit un Decimal Prisma (ou null) en nombre JavaScript sérialisable en JSON. */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(String(value));
}
