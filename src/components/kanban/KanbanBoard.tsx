'use client';

import { DndContext, type DragEndEvent, PointerSensor, TouchSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/fields';
import { formatCHF } from '@/lib/format';
import { sendJson } from '@/lib/http';
import { cn } from '@/lib/utils';

export type KanbanStage = { id: string; name: string; probability: number; kind: 'OPEN' | 'WON' | 'LOST' };
export type KanbanDeal = { id: string; title: string; amount: number; stageId: string; companyName: string; ownerName: string | null };

const STAGE_ACCENT: Record<string, string> = {
  'Novo Lead': 'border-t-slate-500',
  Qualifié: 'border-t-blue-500',
  'Visite / Demo': 'border-t-violet-500',
  'Proposition Envoyée': 'border-t-amber-500',
  Négociation: 'border-t-pink-500',
  Ganho: 'border-t-emerald-500',
  Perdu: 'border-t-red-500',
};

export function KanbanBoard({ stages, initialDeals }: { stages: KanbanStage[]; initialDeals: KanbanDeal[] }) {
  const [deals, setDeals] = useState(initialDeals);
  const [error, setError] = useState<string | null>(null);
  // Déplacement vers « Perdu » : on demande le motif avant d'enregistrer.
  const [lostTarget, setLostTarget] = useState<{ dealId: string; stageId: string } | null>(null);
  const [lostReason, setLostReason] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  async function moveDeal(dealId: string, stageId: string, reason?: string) {
    const previous = deals;
    setError(null);
    setDeals((current) => current.map((d) => (d.id === dealId ? { ...d, stageId } : d)));
    const result = await sendJson(`/api/opportunities/${dealId}`, 'PATCH', { stageId, lostReason: reason });
    if (!result.ok) {
      setDeals(previous); // retour arrière en cas d'échec
      setError(result.message);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    if (!event.over) return;
    const dealId = String(event.active.id);
    const stageId = String(event.over.id);
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stageId === stageId) return;

    const stage = stages.find((s) => s.id === stageId);
    if (stage?.kind === 'LOST') {
      setLostReason('');
      setLostTarget({ dealId, stageId });
      return;
    }
    void moveDeal(dealId, stageId);
  }

  return (
    <>
      {error ? <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="kanban-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
          {stages.map((stage) => (
            <KanbanColumn key={stage.id} stage={stage} deals={deals.filter((d) => d.stageId === stage.id)} />
          ))}
        </div>
      </DndContext>

      <Dialog open={lostTarget !== null} onOpenChange={(open) => !open && setLostTarget(null)}>
        <DialogContent title="Motif de perte" description="Ce motif est obligatoire pour clôturer une opportunité perdue.">
          <Textarea value={lostReason} onChange={(e) => setLostReason(e.target.value)} rows={3} maxLength={500} autoFocus />
          <Button
            className="mt-4 w-full"
            disabled={!lostReason.trim()}
            onClick={() => {
              if (lostTarget) void moveDeal(lostTarget.dealId, lostTarget.stageId, lostReason.trim());
              setLostTarget(null);
            }}
          >
            Marquer comme perdue
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function KanbanColumn({ stage, deals }: { stage: KanbanStage; deals: KanbanDeal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, d) => sum + d.amount, 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={stage.name}
      className={cn(
        'flex w-[78vw] max-w-[280px] shrink-0 snap-start flex-col rounded-xl border border-t-4 bg-white/70 p-2 sm:w-64 md:w-auto md:min-w-0 md:max-w-none md:flex-1',
        STAGE_ACCENT[stage.name] ?? 'border-t-slate-400',
        isOver && 'ring-2 ring-primary',
      )}
    >
      <header className="mb-2 px-1">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{stage.name}</span>
          <span className="text-xs text-muted-foreground">{deals.length}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatCHF(total)} · {stage.probability} %
        </div>
      </header>
      <div className="flex min-h-[120px] flex-col gap-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </section>
  );
}

function DealCard({ deal }: { deal: KanbanDeal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      {...listeners}
      {...attributes}
      className={cn(
        'touch-none cursor-grab rounded-lg border bg-white p-3 text-sm shadow-sm active:cursor-grabbing',
        isDragging && 'opacity-80 shadow-lg',
      )}
    >
      <Link href={`/opportunites/${deal.id}`} className="block font-medium hover:underline" onClick={(e) => isDragging && e.preventDefault()}>
        {deal.title}
      </Link>
      <div className="mt-1 text-xs text-muted-foreground">{deal.companyName}</div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold">{formatCHF(deal.amount)}</span>
        {deal.ownerName ? <span className="text-muted-foreground">{deal.ownerName}</span> : null}
      </div>
    </div>
  );
}
