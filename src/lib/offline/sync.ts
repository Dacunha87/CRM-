// Synchronisation hors ligne : envoi de la file d'attente et rafraîchissement du cache.
// Règles :
//  - Chaque activité porte un UUID généré sur l'appareil ; le serveur l'utilise pour dédupliquer.
//  - Une erreur réseau ou 5xx arrête la file (on réessaiera) ; une erreur 4xx définitive reste visible.
//  - Un 401 signifie que la session a expiré : on arrête et l'utilisateur doit se reconnecter.
import { getDb, type OutboxItem, type WireActivity } from './db';

type Listener = (state: SyncState) => void;
export type SyncState = { pending: number; failed: number; syncing: boolean; lastError: string | null };

let state: SyncState = { pending: 0, failed: 0, syncing: false, lastError: null };
const listeners = new Set<Listener>();

function emit(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state));
}

export function subscribeSync(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

async function refreshCounts() {
  const items = await getDb().outbox.toArray();
  emit({
    pending: items.filter((item) => !item.error).length,
    failed: items.filter((item) => item.error).length,
  });
}

/** Ajoute une activité à la file locale puis tente l'envoi immédiatement. */
export async function enqueueActivity(payload: WireActivity): Promise<void> {
  const item: OutboxItem = { id: payload.id, payload, createdAt: Date.now() };
  await getDb().outbox.put(item);
  await refreshCounts();
  void flushOutbox();
}

export async function flushOutbox(): Promise<void> {
  if (state.syncing || typeof navigator === 'undefined' || !navigator.onLine) return;
  emit({ syncing: true, lastError: null });
  try {
    const items = await getDb().outbox.orderBy('createdAt').toArray();
    for (const item of items) {
      if (item.error) continue;
      let response: Response;
      try {
        response = await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
      } catch {
        break; // réseau coupé : on garde la file pour plus tard
      }

      if (response.ok) {
        await getDb().outbox.delete(item.id);
      } else if (response.status === 401) {
        emit({ lastError: 'Session expirée : reconnectez-vous pour envoyer vos saisies.' });
        break;
      } else if (response.status >= 500) {
        emit({ lastError: 'Serveur indisponible, nouvel essai automatique.' });
        break;
      } else {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        await getDb().outbox.update(item.id, { error: body.error ?? `Erreur ${response.status}` });
      }
    }
  } finally {
    emit({ syncing: false });
    await refreshCounts();
  }
}

/** Télécharge entreprises et opportunités pour les proposer hors ligne. */
export async function refreshCache(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.onLine) return;
  try {
    const [companiesRes, oppsRes] = await Promise.all([
      fetch('/api/companies?light=1'),
      fetch('/api/opportunities?light=1'),
    ]);
    const db = getDb();
    if (companiesRes.ok) {
      const companies = (await companiesRes.json()) as { id: string; name: string; city: string | null }[];
      await db.transaction('rw', db.companies, async () => {
        await db.companies.clear();
        await db.companies.bulkPut(companies);
      });
    }
    if (oppsRes.ok) {
      const opps = (await oppsRes.json()) as { id: string; title: string; companyId: string }[];
      await db.transaction('rw', db.opportunities, async () => {
        await db.opportunities.clear();
        await db.opportunities.bulkPut(opps);
      });
    }
  } catch {
    // Pas de réseau : on garde le cache existant.
  }
}

/** Synchronise tout : cache de référence puis envoi de la file. */
export async function syncAll(): Promise<void> {
  await refreshCache();
  await flushOutbox();
  await refreshCounts();
}
