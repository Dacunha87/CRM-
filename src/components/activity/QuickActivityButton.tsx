'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ActivityModal } from './ActivityModal';

/** Bouton flottant d'accès à la saisie rapide, présent sur toutes les pages protégées. */
export function QuickActivityButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 md:bottom-6"
      >
        <Plus className="h-5 w-5" /> Activité
      </button>
      <ActivityModal open={open} onOpenChange={setOpen} />
    </>
  );
}
