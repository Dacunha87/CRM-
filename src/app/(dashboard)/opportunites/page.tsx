import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { toNumber } from '@/lib/api';
import { formatCHF } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, EmptyState, PageHeader } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function OpportunitiesPage() {
  const user = await requireUser();
  const opportunities = await prisma.opportunity.findMany({
    where: ownerScope(user),
    orderBy: { updatedAt: 'desc' },
    take: 200,
    select: { id: true, title: true, amount: true, company: { select: { name: true } }, stage: { select: { name: true, kind: true } } },
  });

  return (
    <>
      <PageHeader
        title="Opportunités"
        action={
          <Link href="/opportunites/nouvelle">
            <Button>Nouvelle opportunité</Button>
          </Link>
        }
      />
      {opportunities.length === 0 ? (
        <EmptyState>Aucune opportunité pour le moment.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {opportunities.map((o) => (
            <li key={o.id}>
              <Link href={`/opportunites/${o.id}`} className="block">
                <Card className="p-4 transition-colors hover:bg-accent/40">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{o.title}</p>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs">{o.stage.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{o.company.name}</p>
                  <p className="mt-2 text-sm font-medium">{formatCHF(toNumber(o.amount))}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
