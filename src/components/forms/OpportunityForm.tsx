'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/fields';
import { sendJson } from '@/lib/http';

type Option = { id: string; name: string };
type ContactOption = { id: string; firstName: string; lastName: string };

export function OpportunityForm({
  companies,
  stages,
  defaultCompanyId,
}: {
  companies: Option[];
  stages: Option[];
  defaultCompanyId?: string;
}) {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? '');
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Les contacts dépendent de l'entreprise choisie.
  useEffect(() => {
    if (!companyId) return setContacts([]);
    let cancelled = false;
    fetch(`/api/contacts?companyId=${companyId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: ContactOption[]) => !cancelled && setContacts(list));
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setErrors({});
    setMessage(null);
    const result = await sendJson('/api/opportunities', 'POST', { ...data, companyId });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields);
      setMessage(result.message);
      return;
    }
    router.push(`/opportunites/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Titre *" error={errors.title}>
        <Input name="title" required maxLength={200} placeholder="Ex. Renouvellement flotte" />
      </Field>
      <Field label="Entreprise *" error={errors.companyId}>
        <Select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Contact (optionnel)" error={errors.contactId}>
        <Select name="contactId" defaultValue="">
          <option value="">— Aucun —</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Montant (CHF)" error={errors.amount}>
          <Input name="amount" type="number" min={0} step="1" defaultValue={0} inputMode="numeric" />
        </Field>
        <Field label="Étape" error={errors.stageId}>
          <Select name="stageId" defaultValue={stages[0]?.id}>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Clôture prévue" error={errors.expectedCloseDate}>
          <Input name="expectedCloseDate" type="date" />
        </Field>
      </div>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={saving || !companyId}>
        {saving ? 'Création…' : "Créer l'opportunité"}
      </Button>
    </form>
  );
}
