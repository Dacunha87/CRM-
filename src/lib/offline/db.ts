// Base locale (IndexedDB via Dexie) : file d'attente des activités et cache des données de choix.
import Dexie, { type Table } from 'dexie';
import type { ActivityInput } from '@/lib/validations';

/** Activité telle qu'envoyée en JSON (dates sous forme de chaînes ISO). */
export type WireActivity = Omit<ActivityInput, 'occurredAt'> & { id: string; occurredAt: string };

export type OutboxItem = {
  id: string; // identifiant UUID de l'activité, également clé d'idempotence côté serveur
  payload: WireActivity;
  createdAt: number;
  error?: string; // rejet définitif renvoyé par le serveur (données invalides)
};

export type CachedCompany = { id: string; name: string; city: string | null };
export type CachedOpportunity = { id: string; title: string; companyId: string };

class CrmDatabase extends Dexie {
  outbox!: Table<OutboxItem, string>;
  companies!: Table<CachedCompany, string>;
  opportunities!: Table<CachedOpportunity, string>;

  constructor() {
    super('crm-ventes');
    this.version(1).stores({
      outbox: 'id, createdAt',
      companies: 'id, name',
      opportunities: 'id, companyId',
    });
  }
}

let instance: CrmDatabase | null = null;

/** Instance paresseuse : ne touche IndexedDB que dans le navigateur. */
export function getDb(): CrmDatabase {
  if (!instance) instance = new CrmDatabase();
  return instance;
}
