import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { toNumber } from '@/lib/api';
import { formatCHF, formatDate } from '@/lib/format';
import { Card, CardTitle, EmptyState } from '@/components/ui/card';
import { DeleteButton } from '@/components/forms/DeleteButton';
import { OpportunityStageForm } from '@/components/forms/OpportunityActions';
import { ActivityList } from '@/components/activity/ActivityList';
import { TaskRow } from '@/components/tasks/TaskRow';
import { TaskForm } from '@/components/forms/TaskForm';

export const dynamic = 'force-dynamic';

export default async function OpportunityPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const scope = ownerScope(user);
  const opp = await prisma.opportunity.findFirst({
    where: { id: params.id, ...scope },
    include: {
      company: { select: { id: true, name: true } },
      contact: { select: { firstName: true, lastName: true } },
      stage: true,
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 20,
        select: { id: true, type: true, summary: true, occurredAt: true, durationMin: true, hasPhoto: true, latitude: true, contact: { select: { firstName: true, lastName: true } }, opportunity: { select: { title: true } } },
      },
      tasks: { where: { done: false }, orderBy: { dueAt: 'asc' }, select: { id: true, title: true, dueAt: true, done: true, company: { select: { id: true, name: true } }, opportunity: { select: { id: true, title: true } } } },
    },
  });
  if (!opp) notFound();

  const stages = await prisma.stage.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true, kind: true } });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{opp.title}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/entreprises/${opp.company.id}`} className="hover:underline">
              {opp.company.name}
            </Link>
            {opp.contact ? ` · ${opp.contact.firstName} ${opp.contact.lastName}` : ''}
          </p>
          <p className="mt-2 text-lg font-semibold">
            {formatCHF(toNumber(opp.amount))} <span className="text-sm font-normal text-muted-foreground">· {opp.stage.name} · {opp.stage.probability} %</span>
          </p>
          {opp.expectedCloseDate ? <p className="text-sm text-muted-foreground">Clôture prévue : {formatDate(opp.expectedCloseDate)}</p> : null}
          {opp.lostReason ? <p className="mt-1 text-sm text-red-700">Motif de perte : {opp.lostReason}</p> : null}
        </div>
        <DeleteButton url={`/api/opportunities/${opp.id}`} redirectTo="/opportunites" label="Supprimer" question="Supprimer cette opportunité ?" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <CardTitle>Étape</CardTitle>
          <div className="mt-3">
            <OpportunityStageForm
              opportunityId={opp.id}
              stages={stages}
              currentStageId={opp.stageId}
              currentLostReason={opp.lostReason}
            />
          </div>
        </Card>

        <Card className="p-4">
          <CardTitle>Tâches</CardTitle>
          <ul className="mt-3 divide-y">
            {opp.tasks.map((t) => (
              <TaskRow key={t.id} task={{ ...t, dueAt: t.dueAt.toISOString() }} />
            ))}
            {opp.tasks.length === 0 ? <li className="py-2 text-sm text-muted-foreground">Aucune tâche ouverte.</li> : null}
          </ul>
          <div className="mt-4 border-t pt-4">
            <TaskForm companyId={opp.company.id} />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <CardTitle>Activités</CardTitle>
        <div className="mt-2">
          {opp.activities.length === 0 ? <EmptyState>Aucune activité liée.</EmptyState> : <ActivityList items={opp.activities} />}
        </div>
      </Card>
    </div>
  );
}
