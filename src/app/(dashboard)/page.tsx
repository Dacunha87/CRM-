import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { computeKpis } from '@/lib/kpi';
import { toNumber } from '@/lib/api';
import { startOfZurichDay } from '@/lib/time';
import { formatCHF, formatDateTime, formatPercent } from '@/lib/format';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { PipelineChart } from '@/components/dashboard/PipelineChart';
import { Card, CardTitle, EmptyState } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const user = await requireUser();
  const scope = ownerScope(user);
  const activityScope = user.role === 'chefia' ? {} : { authorId: user.id };
  const now = new Date();
  const startOfTomorrow = startOfZurichDay(now, 1);

  const [stages, opportunities, companiesTotal, companiesWithOpportunity, activitiesLast7Days, visits, quotaSum, recent, dueTasks] =
    await Promise.all([
      prisma.stage.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true, order: true, kind: true, probability: true } }),
      prisma.opportunity.findMany({
        where: scope,
        select: {
          amount: true,
          stageId: true,
          stage: { select: { id: true, name: true, order: true, kind: true, probability: true } },
        },
      }),
      prisma.company.count({ where: scope }),
      prisma.company.count({ where: { ...scope, opportunities: { some: {} } } }),
      prisma.activity.count({ where: { ...activityScope, occurredAt: { gte: new Date(now.getTime() - 7 * DAY) } } }),
      prisma.activity.findMany({
        where: { ...activityScope, type: 'VISITE', occurredAt: { gte: new Date(now.getTime() - 30 * DAY) } },
        select: { occurredAt: true, createdAt: true },
      }),
      user.role === 'chefia'
        ? prisma.user.aggregate({ where: { role: 'commercial' }, _sum: { quota: true } }).then((r) => toNumber(r._sum.quota))
        : prisma.user.findUnique({ where: { id: user.id }, select: { quota: true } }).then((r) => toNumber(r?.quota)),
      prisma.activity.findMany({
        where: activityScope,
        orderBy: { occurredAt: 'desc' },
        take: 5,
        select: { id: true, type: true, summary: true, occurredAt: true, company: { select: { id: true, name: true } } },
      }),
      prisma.task.count({ where: { ...scope, done: false, dueAt: { lt: startOfTomorrow } } }),
    ]);

  const kpis = computeKpis({
    stages,
    opportunities: opportunities.map((o) => ({ ...o, amount: toNumber(o.amount) })),
    companiesTotal,
    companiesWithOpportunity,
    activitiesLast7Days,
    visits,
    quota: quotaSum,
  });

  const firstName = user.name?.split(' ')[0] ?? user.email;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bonjour {firstName}</h1>
        <p className="text-sm text-muted-foreground">
          {dueTasks > 0 ? `${dueTasks} tâche(s) à traiter aujourd'hui ou en retard.` : 'Aucune tâche en retard.'}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Pipeline ouvert" value={formatCHF(kpis.openPipeline)} />
        <KpiCard label="Pipeline pondéré" value={formatCHF(kpis.weightedPipeline)} />
        <KpiCard label="Win rate" value={formatPercent(kpis.winRate)} hint="Cible 30 %" />
        <KpiCard label="Coverage" value={kpis.coverage === null ? '—' : `${kpis.coverage.toFixed(1)}×`} hint="Cible 3× (pipeline / objectif)" />
        <KpiCard label="Entreprises → opportunité" value={formatPercent(kpis.leadToOpportunityRate)} hint="Cible 25 %" />
        <KpiCard label="Activités (7 jours)" value={String(kpis.activitiesLast7Days)} />
        <KpiCard label="Visites saisies le jour même" value={formatPercent(kpis.sameDayVisitRate)} hint="Cible 90 %, sur 30 jours" />
        <KpiCard label="Entreprises" value={String(companiesTotal)} />
      </section>

      <Card className="p-4">
        <CardTitle>Pipeline par étape</CardTitle>
        <div className="mt-3">
          <PipelineChart data={kpis.pipelineByStage.map((s) => ({ name: s.name, amount: s.amount }))} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle>Dernières activités</CardTitle>
          <Link href="/entreprises" className="text-sm text-primary hover:underline">
            Entreprises
          </Link>
        </div>
        <div className="mt-3">
          {recent.length === 0 ? (
            <EmptyState>Aucune activité. Utilisez le bouton « Activité » pour commencer.</EmptyState>
          ) : (
            <ul className="divide-y">
              {recent.map((a) => (
                <li key={a.id} className="py-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <Link href={`/entreprises/${a.company.id}`} className="font-medium hover:underline">
                      {a.company.name}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(a.occurredAt)}</span>
                  </div>
                  <p className="text-muted-foreground">
                    {a.type.toLowerCase()} · {a.summary.slice(0, 120)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
