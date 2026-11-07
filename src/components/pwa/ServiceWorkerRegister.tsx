'use client';

import { useEffect } from 'react';

/** Enregistre le service worker (cache de l'application shell, pages hors ligne). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Pas bloquant : l'application fonctionne sans service worker.
    });
  }, []);
  return null;
}
