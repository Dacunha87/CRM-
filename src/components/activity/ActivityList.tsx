import { formatDateTime } from '@/lib/format';

export type ActivityItem = {
  id: string;
  type: 'VISITE' | 'APPEL' | 'EMAIL' | 'NOTE';
  summary: string;
  occurredAt: Date;
  durationMin: number | null;
  hasPhoto: boolean;
  latitude: number | null;
  contact?: { firstName: string; lastName: string } | null;
  opportunity?: { title: string } | null;
};

const TYPE_LABEL: Record<ActivityItem['type'], string> = { VISITE: 'Visite', APPEL: 'Appel', EMAIL: 'E-mail', NOTE: 'Note' };

export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="divide-y">
      {items.map((a) => (
        <li key={a.id} className="space-y-1 py-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{TYPE_LABEL[a.type]}</span>
            <span>{formatDateTime(a.occurredAt)}</span>
            {a.durationMin ? <span>· {a.durationMin} min</span> : null}
            {a.latitude !== null ? <span>· position enregistrée</span> : null}
          </div>
          {a.contact || a.opportunity ? (
            <div className="text-xs text-muted-foreground">
              {a.contact ? `${a.contact.firstName} ${a.contact.lastName}` : null}
              {a.contact && a.opportunity ? ' · ' : null}
              {a.opportunity ? a.opportunity.title : null}
            </div>
          ) : null}
          <p className="whitespace-pre-line">{a.summary}</p>
          {a.hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/activities/${a.id}/photo`} alt="Photo jointe à l'activité" className="mt-2 max-h-48 rounded-md border" loading="lazy" />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
