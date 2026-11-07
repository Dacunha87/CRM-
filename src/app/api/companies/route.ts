import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { apiError, readJson } from '@/lib/api';
import { companyInput } from '@/lib/validations';

// GET /api/companies?q=texte&light=1
// light=1 renvoie une version légère, mise en cache pour le mode hors ligne.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  const light = url.searchParams.get('light') === '1';

  const companies = await prisma.company.findMany({
    where: {
      ...ownerScope(user),
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    orderBy: { name: 'asc' },
    take: light ? 1000 : 200,
    select: light
      ? { id: true, name: true, city: true }
      : { id: true, name: true, city: true, canton: true, industry: true, updatedAt: true, owner: { select: { name: true } } },
  });
  return NextResponse.json(companies);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const body = await readJson(req, companyInput);
  if ('response' in body) return body.response;

  const company = await prisma.company.create({ data: { ...body.data, ownerId: user.id }, select: { id: true } });
  return NextResponse.json(company, { status: 201 });
}
