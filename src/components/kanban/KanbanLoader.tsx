'use client';

import dynamic from 'next/dynamic';
import type { KanbanDeal, KanbanStage } from './KanbanBoard';

// dnd-kit génère des identifiants ARIA différents côté serveur et côté navigateur :
// le Kanban est donc rendu uniquement dans le navigateur, avec un squelette en attendant.
const KanbanBoard = dynamic(() => import('./KanbanBoard').then((m) => m.KanbanBoard), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-white/60" aria-busy="true" />,
});

export function KanbanLoader(props: { stages: KanbanStage[]; initialDeals: KanbanDeal[] }) {
  return <KanbanBoard {...props} />;
}
