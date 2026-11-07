// Vérifie qu'une ressource référencée appartient au périmètre de l'utilisateur.
import { prisma } from '@/lib/prisma';
import { ownerScope, type ScopedUser } from '@/lib/scope';

export function findAccessibleCompany(user: ScopedUser, companyId: string) {
  return prisma.company.findFirst({ where: { id: companyId, ...ownerScope(user) }, select: { id: true } });
}

export function findAccessibleOpportunity(user: ScopedUser, opportunityId: string) {
  return prisma.opportunity.findFirst({
    where: { id: opportunityId, ...ownerScope(user) },
    select: { id: true, companyId: true, stage: { select: { kind: true } } },
  });
}
