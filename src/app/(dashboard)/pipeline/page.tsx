import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { toNumber } from '@/lib/api';
import { KanbanLoader } from '@/components/kanban/KanbanLoader';
import { PageHeader } from '@/components/ui/card';
import { formatCHF } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const user = await requireUser();
  const [stages, opportunities] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true, probability: true, kind: true } }),
    prisma.opportunity.findMany({
      where: ownerScope(user),
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        amount: true,
        stageId: true,
        company: { select: { name: true } },
        owner: { select: { name: true } },
      },
    }),
  ]);

  const total = opportunities.reduce((sum, o) => sum + toNumber(o.amount), 0);

  return (
    <>
      <PageHeader title="Pipeline" action={<span className="text-sm text-muted-foreground">Total : {formatCHF(total)}</span>} />
      <p className="mb-3 text-sm text-muted-foreground">Glissez une opportunité vers une autre colonne pour changer son étape.</p>
      <KanbanLoader
        stages={stages}
        initialDeals={opportunities.map((o) => ({
          id: o.id,
          title: o.title,
          amount: toNumber(o.amount),
          stageId: o.stageId,
          companyName: o.company.name,
          ownerName: o.owner.name,
        }))}
      />
    </>
  );
}
