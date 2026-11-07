import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { apiError, readJson } from '@/lib/api';
import { findAccessibleCompany } from '@/lib/access';
import { contactInput } from '@/lib/validations';

// GET /api/contacts?companyId=…
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const companyId = new URL(req.url).searchParams.get('companyId');
  if (!companyId) return apiError(422, 'companyId requis');
  if (!(await findAccessibleCompany(user, companyId))) return apiError(404, 'Entreprise introuvable');

  const contacts = await prisma.contact.findMany({
    where: { companyId },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: { id: true, firstName: true, lastName: true, jobTitle: true, email: true, phone: true, isDecisionMaker: true },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const body = await readJson(req, contactInput);
  if ('response' in body) return body.response;

  if (!(await findAccessibleCompany(user, body.data.companyId))) return apiError(404, 'Entreprise introuvable');

  const contact = await prisma.contact.create({
    data: { ...body.data, ownerId: user.id },
    select: { id: true },
  });
  return NextResponse.json(contact, { status: 201 });
}
