import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { startOfZurichDay } from '@/lib/time';
import { Card, CardTitle, EmptyState, PageHeader } from '@/components/ui/card';
import { TaskForm } from '@/components/forms/TaskForm';
import { TaskRow, type TaskItem } from '@/components/tasks/TaskRow';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const user = await requireUser();
  const scope = ownerScope(user);
  const [tasks, companies] = await Promise.all([
    prisma.task.findMany({
      where: scope,
      orderBy: { dueAt: 'asc' },
      take: 300,
      select: {
        id: true,
        title: true,
        dueAt: true,
        done: true,
        company: { select: { id: true, name: true } },
        opportunity: { select: { id: true, title: true } },
      },
    }),
    prisma.company.findMany({ where: scope, orderBy: { name: 'asc' }, select: { id: true, name: true }, take: 500 }),
  ]);

  const today = startOfZurichDay(new Date());
  const tomorrow = startOfZurichDay(new Date(), 1);
  const toItem = (t: (typeof tasks)[number]): TaskItem => ({ ...t, dueAt: t.dueAt.toISOString() });

  const open = tasks.filter((t) => !t.done);
  const sections = [
    { title: 'En retard', items: open.filter((t) => t.dueAt < today) },
    { title: "Aujourd'hui", items: open.filter((t) => t.dueAt >= today && t.dueAt < tomorrow) },
    { title: 'À venir', items: open.filter((t) => t.dueAt >= tomorrow) },
    { title: 'Terminées', items: tasks.filter((t) => t.done) },
  ];

  return (
    <>
      <PageHeader title="Tâches et rappels" />
      <Card className="mb-5 p-4">
        <CardTitle>Nouvelle tâche</CardTitle>
        <div className="mt-3">
          <TaskForm companies={companies} />
        </div>
      </Card>

      <div className="space-y-5">
        {sections.map((section) => (
          <Card key={section.title} className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle>{section.title}</CardTitle>
              <span className="text-xs text-muted-foreground">{section.items.length}</span>
            </div>
            {section.items.length === 0 ? (
              <div className="mt-3">
                <EmptyState>Rien ici.</EmptyState>
              </div>
            ) : (
              <ul className="mt-2 divide-y">
                {section.items.map((t) => (
                  <TaskRow key={t.id} task={toItem(t)} />
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
