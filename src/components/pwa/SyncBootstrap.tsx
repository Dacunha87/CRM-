'use client';

import { useEffect } from 'react';
import { syncAll } from '@/lib/offline/sync';

/** Lance la synchronisation au chargement, au retour du réseau, puis périodiquement. */
export function SyncBootstrap() {
  useEffect(() => {
    void syncAll();
    const onOnline = () => void syncAll();
    window.addEventListener('online', onOnline);
    const timer = window.setInterval(() => void syncAll(), 60_000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
