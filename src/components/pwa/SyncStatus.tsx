'use client';

import { useEffect, useState } from 'react';
import { CloudOff, CloudUpload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { subscribeSync, type SyncState } from '@/lib/offline/sync';
import { useOnline } from '@/hooks/useOnline';

export function SyncStatus() {
  const online = useOnline();
  const [sync, setSync] = useState<SyncState>({ pending: 0, failed: 0, syncing: false, lastError: null });

  useEffect(() => subscribeSync(setSync), []);

  if (!online) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
        <CloudOff className="h-3.5 w-3.5" /> Hors ligne{sync.pending ? ` · ${sync.pending} en attente` : ''}
      </span>
    );
  }
  if (sync.failed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-900" title={sync.lastError ?? ''}>
        <AlertTriangle className="h-3.5 w-3.5" /> {sync.failed} saisie(s) rejetée(s)
      </span>
    );
  }
  if (sync.syncing || sync.pending) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-900">
        <CloudUpload className="h-3.5 w-3.5" /> Synchronisation · {sync.pending}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900">
      <CheckCircle2 className="h-3.5 w-3.5" /> Synchronisé
    </span>
  );
}
