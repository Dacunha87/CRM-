import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { apiError, readJson } from '@/lib/api';
import { opportunityUpdate } from '@/lib/validations';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const opp = await prisma.opportunity.findFirst({
    where: { id: params.id, ...ownerScope(user) },
    include: {
      stage: true,
      company: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!opp) return apiError(404, 'Opportunité introuvable');
  return NextResponse.json({ ...opp, amount: Number(opp.amount) });
}

// PATCH : mise à jour générique, y compris changement d'étape (glisser-déposer du Kanban).
export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const body = await readJson(req, opportunityUpdate);
  if ('response' in body) return body.response;
  const data = body.data;

  const current = await prisma.opportunity.findFirst({
    where: { id: params.id, ...ownerScope(user) },
    select: { id: true, lostReason: true },
  });
  if (!current) return apiError(404, 'Opportunité introuvable');

  let stageFields: { stageId?: string; stageChangedAt?: Date; closedAt?: Date | null; lostReason?: string | null } = {};
  if (data.stageId) {
    const stage = await prisma.stage.findUnique({ where: { id: data.stageId }, select: { id: true, kind: true } });
    if (!stage) return apiError(422, 'Étape inconnue');

    const reason = data.lostReason ?? current.lostReason;
    if (stage.kind === 'LOST' && !reason) {
      return apiError(422, 'Motif de perte obligatoire', { lostReason: ['Indiquez le motif de perte'] });
    }
    stageFields = {
      stageId: stage.id,
      stageChangedAt: new Date(),
      closedAt: stage.kind === 'OPEN' ? null : new Date(),
      lostReason: stage.kind === 'LOST' ? reason : null,
    };
  } else if (data.lostReason !== undefined) {
    stageFields = { lostReason: data.lostReason ?? null };
  }

  const { stageId: _ignored, lostReason: _ignoredReason, ...rest } = data;
  await prisma.opportunity.update({
    where: { id: params.id },
    data: { ...rest, ...stageFields },
  });
  return NextResponse.json({ id: params.id });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const result = await prisma.opportunity.deleteMany({ where: { id: params.id, ...ownerScope(user) } });
  if (result.count === 0) return apiError(404, 'Opportunité introuvable');
  return new NextResponse(null, { status: 204 });
}
