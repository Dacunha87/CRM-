import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { apiError, readJson } from '@/lib/api';
import { findAccessibleCompany, findAccessibleOpportunity } from '@/lib/access';
import { activityInput } from '@/lib/validations';

const activitySelect = {
  id: true,
  type: true,
  summary: true,
  occurredAt: true,
  createdAt: true,
  durationMin: true,
  latitude: true,
  longitude: true,
  hasPhoto: true,
  companyId: true,
  contactId: true,
  opportunityId: true,
  contact: { select: { firstName: true, lastName: true } },
  opportunity: { select: { title: true } },
  author: { select: { name: true } },
} satisfies Prisma.ActivitySelect;

// GET /api/activities?companyId=…  (les photos ne sont jamais renvoyées ici, cf. /photo)
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const companyId = new URL(req.url).searchParams.get('companyId');
  const activities = await prisma.activity.findMany({
    where: {
      ...(user.role === 'chefia' ? {} : { authorId: user.id }),
      ...(companyId ? { companyId } : {}),
    },
    orderBy: { occurredAt: 'desc' },
    take: 100,
    select: activitySelect,
  });
  return NextResponse.json(activities);
}

// POST /api/activities : idempotent. Un identifiant déjà connu renvoie l'activité existante,
// ce qui permet de rejouer sans risque une saisie hors ligne.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const body = await readJson(req, activityInput);
  if ('response' in body) return body.response;
  const data = body.data;

  if (data.id) {
    const existing = await prisma.activity.findUnique({ where: { id: data.id }, select: activitySelect });
    if (existing) {
      const owner = await prisma.activity.findUnique({ where: { id: data.id }, select: { authorId: true } });
      if (owner?.authorId !== user.id) return apiError(409, 'Identifiant déjà utilisé');
      return NextResponse.json(existing);
    }
  }

  if (!(await findAccessibleCompany(user, data.companyId))) return apiError(404, 'Entreprise introuvable');

  if (data.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: data.contactId, companyId: data.companyId },
      select: { id: true },
    });
    if (!contact) return apiError(422, 'Contact inconnu pour cette entreprise');
  }
  if (data.opportunityId) {
    const opp = await findAccessibleOpportunity(user, data.opportunityId);
    if (!opp || opp.companyId !== data.companyId) return apiError(422, 'Opportunité inconnue pour cette entreprise');
  }

  const { photo, ...rest } = data;
  try {
    const created = await prisma.activity.create({
      data: {
        ...rest,
        authorId: user.id,
        photo: photo ?? null,
        hasPhoto: Boolean(photo),
      },
      select: activitySelect,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    // Course entre deux envois identiques : on renvoie l'existant.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && data.id) {
      const existing = await prisma.activity.findUnique({ where: { id: data.id }, select: activitySelect });
      if (existing) return NextResponse.json(existing);
    }
    throw error;
  }
}
