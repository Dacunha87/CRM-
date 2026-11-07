import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { toNumber } from '@/lib/api';
import { formatCHF, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, EmptyState } from '@/components/ui/card';
import { ContactForm } from '@/components/forms/ContactForm';
import { TaskForm } from '@/components/forms/TaskForm';
import { DeleteButton } from '@/components/forms/DeleteButton';
import { ActivityList } from '@/components/activity/ActivityList';
import { TaskRow } from '@/components/tasks/TaskRow';

export const dynamic = 'force-dynamic';

export default async function CompanyPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const scope = ownerScope(user);
  const company = await prisma.company.findFirst({
    where: { id: params.id, ...scope },
    include: {
      contacts: { orderBy: { lastName: 'asc' } },
      opportunities: { orderBy: { updatedAt: 'desc' }, include: { stage: { select: { name: true } } } },
      activities: {
        orderBy: { occurredAt: 'desc' },
        take: 20,
        select: {
          id: true,
          type: true,
          summary: true,
          occurredAt: true,
          durationMin: true,
          hasPhoto: true,
          latitude: true,
          contact: { select: { firstName: true, lastName: true } },
          opportunity: { select: { title: true } },
        },
      },
      tasks: {
        where: { done: false },
        orderBy: { dueAt: 'asc' },
        select: { id: true, title: true, dueAt: true, done: true, company: { select: { id: true, name: true } }, opportunity: { select: { id: true, title: true } } },
      },
    },
  });
  if (!company) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[company.city, company.canton, company.industry].filter(Boolean).join(' · ') || 'Fiche entreprise'}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {company.phone ? <a href={`tel:${company.phone}`} className="text-primary hover:underline">{company.phone}</a> : null}
            {company.website ? (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Site web
              </a>
            ) : null}
            {company.address ? <span className="text-muted-foreground">{company.address}</span> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Link href={`/entreprises/${company.id}/modifier`}>
              <Button variant="outline" size="sm">Modifier</Button>
            </Link>
            <Link href={`/opportunites/nouvelle?companyId=${company.id}`}>
              <Button size="sm">Nouvelle opportunité</Button>
            </Link>
          </div>
          <DeleteButton
            url={`/api/companies/${company.id}`}
            redirectTo="/entreprises"
            label="Supprimer"
            question="Supprimer cette entreprise et toutes ses données liées (contacts, opportunités, activités) ?"
          />
        </div>
      </div>

      {company.notes ? <Card className="p-4 text-sm whitespace-pre-line">{company.notes}</Card> : null}

      <Card className="p-4">
        <CardTitle>Opportunités</CardTitle>
        <div className="mt-3">
          {company.opportunities.length === 0 ? (
            <EmptyState>Aucune opportunité.</EmptyState>
          ) : (
            <ul className="divide-y">
              {company.opportunities.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/opportunites/${o.id}`} className="font-medium hover:underline">
                    {o.title}
                  </Link>
                  <span className="text-right text-muted-foreground">
                    {o.stage.name} · {formatCHF(toNumber(o.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <CardTitle>Contacts</CardTitle>
          <ul className="mt-3 divide-y">
            {company.contacts.map((c) => (
              <li key={c.id} className="py-2.5 text-sm">
                <p className="font-medium">
                  {c.firstName} {c.lastName} {c.isDecisionMaker ? <span className="ml-1 rounded bg-violet-100 px-1.5 text-xs text-violet-900">Décideur</span> : null}
                </p>
                <p className="text-muted-foreground">
                  {[c.jobTitle, c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                </p>
              </li>
            ))}
            {company.contacts.length === 0 ? <li className="py-2 text-sm text-muted-foreground">Aucun contact.</li> : null}
          </ul>
          <div className="mt-4 border-t pt-4">
            <ContactForm companyId={company.id} />
          </div>
        </Card>

        <Card className="p-4">
          <CardTitle>Tâches et rappels</CardTitle>
          <ul className="mt-3 divide-y">
            {company.tasks.map((t) => (
              <TaskRow key={t.id} task={{ ...t, dueAt: t.dueAt.toISOString() }} />
            ))}
            {company.tasks.length === 0 ? <li className="py-2 text-sm text-muted-foreground">Aucune tâche ouverte.</li> : null}
          </ul>
          <div className="mt-4 border-t pt-4">
            <TaskForm companyId={company.id} />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <CardTitle>Activités</CardTitle>
        <div className="mt-2">
          {company.activities.length === 0 ? (
            <EmptyState>Aucune activité enregistrée.</EmptyState>
          ) : (
            <ActivityList items={company.activities} />
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Dernière activité le {company.activities[0] ? formatDate(company.activities[0].occurredAt) : '—'}</p>
      </Card>
    </div>
  );
}
