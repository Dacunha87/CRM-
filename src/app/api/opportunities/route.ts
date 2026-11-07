import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { apiError, readJson, toNumber } from '@/lib/api';
import { findAccessibleCompany } from '@/lib/access';
import { opportunityInput } from '@/lib/validations';

// GET /api/opportunities?light=1 ou ?companyId=…
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const url = new URL(req.url);
  const light = url.searchParams.get('light') === '1';
  const companyId = url.searchParams.get('companyId') ?? undefined;

  const rows = await prisma.opportunity.findMany({
    where: { ...ownerScope(user), ...(companyId ? { companyId } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: light ? 1000 : 200,
    select: light
      ? { id: true, title: true, companyId: true }
      : {
          id: true,
          title: true,
          amount: true,
          companyId: true,
          stageId: true,
          stage: { select: { name: true, kind: true, probability: true } },
          company: { select: { name: true } },
          owner: { select: { name: true } },
        },
  });

  return NextResponse.json(
    rows.map((row) => ('amount' in row ? { ...row, amount: toNumber(row.amount) } : row)),
  );
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const body = await readJson(req, opportunityInput);
  if ('response' in body) return body.response;
  const data = body.data;

  if (!(await findAccessibleCompany(user, data.companyId))) return apiError(404, 'Entreprise introuvable');

  const stage = await prisma.stage.findUnique({ where: { id: data.stageId }, select: { kind: true } });
  if (!stage) return apiError(422, 'Étape inconnue');

  const opportunity = await prisma.opportunity.create({
    data: {
      title: data.title,
      amount: data.amount,
      expectedCloseDate: data.expectedCloseDate,
      stageId: data.stageId,
      companyId: data.companyId,
      contactId: data.contactId,
      ownerId: user.id,
      closedAt: stage.kind === 'OPEN' ? null : new Date(),
    },
    select: { id: true },
  });
  return NextResponse.json(opportunity, { status: 201 });
}
