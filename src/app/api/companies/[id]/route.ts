import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { apiError, readJson } from '@/lib/api';
import { companyUpdate } from '@/lib/validations';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const company = await prisma.company.findFirst({
    where: { id: params.id, ...ownerScope(user) },
    select: { id: true, name: true, city: true, canton: true, industry: true, website: true, phone: true, address: true, notes: true },
  });
  if (!company) return apiError(404, 'Entreprise introuvable');
  return NextResponse.json(company);
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const body = await readJson(req, companyUpdate);
  if ('response' in body) return body.response;

  const result = await prisma.company.updateMany({ where: { id: params.id, ...ownerScope(user) }, data: body.data });
  if (result.count === 0) return apiError(404, 'Entreprise introuvable');
  return NextResponse.json({ id: params.id });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const result = await prisma.company.deleteMany({ where: { id: params.id, ...ownerScope(user) } });
  if (result.count === 0) return apiError(404, 'Entreprise introuvable');
  return new NextResponse(null, { status: 204 });
}
