import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { apiError, readJson } from '@/lib/api';
import { taskUpdate } from '@/lib/validations';

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const body = await readJson(req, taskUpdate);
  if ('response' in body) return body.response;
  const { done, ...rest } = body.data;

  const result = await prisma.task.updateMany({
    where: { id: params.id, ...ownerScope(user) },
    data: {
      ...rest,
      ...(done === undefined ? {} : { done, completedAt: done ? new Date() : null }),
    },
  });
  if (result.count === 0) return apiError(404, 'Tâche introuvable');
  return NextResponse.json({ id: params.id });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const result = await prisma.task.deleteMany({ where: { id: params.id, ...ownerScope(user) } });
  if (result.count === 0) return apiError(404, 'Tâche introuvable');
  return new NextResponse(null, { status: 204 });
}
