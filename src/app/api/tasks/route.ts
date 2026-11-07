import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { apiError, readJson } from '@/lib/api';
import { findAccessibleCompany, findAccessibleOpportunity } from '@/lib/access';
import { taskInput } from '@/lib/validations';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const onlyOpen = new URL(req.url).searchParams.get('open') === '1';
  const tasks = await prisma.task.findMany({
    where: { ...ownerScope(user), ...(onlyOpen ? { done: false } : {}) },
    orderBy: [{ done: 'asc' }, { dueAt: 'asc' }],
    take: 300,
    select: {
      id: true,
      title: true,
      dueAt: true,
      done: true,
      company: { select: { id: true, name: true } },
      opportunity: { select: { id: true, title: true } },
    },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const body = await readJson(req, taskInput);
  if ('response' in body) return body.response;
  const data = body.data;

  let companyId = data.companyId;
  if (data.opportunityId) {
    const opp = await findAccessibleOpportunity(user, data.opportunityId);
    if (!opp) return apiError(404, 'Opportunité introuvable');
    companyId = opp.companyId;
  } else if (companyId && !(await findAccessibleCompany(user, companyId))) {
    return apiError(404, 'Entreprise introuvable');
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      dueAt: data.dueAt,
      ownerId: user.id,
      companyId: companyId ?? null,
      opportunityId: data.opportunityId ?? null,
    },
    select: { id: true },
  });
  return NextResponse.json(task, { status: 201 });
}
