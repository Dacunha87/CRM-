'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatDateTime } from '@/lib/format';
import { sendJson } from '@/lib/http';
import { cn } from '@/lib/utils';

export type TaskItem = {
  id: string;
  title: string;
  dueAt: string;
  done: boolean;
  company: { id: string; name: string } | null;
  opportunity: { id: string; title: string } | null;
};

export function TaskRow({ task }: { task: TaskItem }) {
  const router = useRouter();
  const [done, setDone] = useState(task.done);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !done;
    setDone(next); // mise à jour immédiate ; annulée si l'appel échoue
    const result = await sendJson(`/api/tasks/${task.id}`, 'PATCH', { done: next });
    setBusy(false);
    if (!result.ok) setDone(!next);
    else router.refresh();
  }

  return (
    <li className="flex items-start gap-3 py-3">
      <input
        type="checkbox"
        checked={done}
        onChange={toggle}
        disabled={busy}
        aria-label={`Marquer « ${task.title} » comme faite`}
        className="mt-1 h-5 w-5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium', done && 'text-muted-foreground line-through')}>{task.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(task.dueAt)}
          {task.company ? (
            <>
              {' · '}
              <Link href={`/entreprises/${task.company.id}`} className="hover:underline">
                {task.company.name}
              </Link>
            </>
          ) : null}
          {task.opportunity ? (
            <>
              {' · '}
              <Link href={`/opportunites/${task.opportunity.id}`} className="hover:underline">
                {task.opportunity.title}
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </li>
  );
}
