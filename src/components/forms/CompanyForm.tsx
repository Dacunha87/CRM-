'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/fields';
import { sendJson } from '@/lib/http';

type CompanyValues = {
  name: string;
  city: string;
  canton: string;
  industry: string;
  website: string;
  phone: string;
  address: string;
  notes: string;
};

const EMPTY: CompanyValues = { name: '', city: '', canton: '', industry: '', website: '', phone: '', address: '', notes: '' };

/** Création (sans `companyId`) ou modification d'une entreprise. */
export function CompanyForm({ companyId, initial }: { companyId?: string; initial?: Partial<CompanyValues> }) {
  const router = useRouter();
  const [values, setValues] = useState<CompanyValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof CompanyValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrors({});
    const result = companyId
      ? await sendJson(`/api/companies/${companyId}`, 'PATCH', values)
      : await sendJson('/api/companies', 'POST', values);
    setSaving(false);

    if (!result.ok) {
      setErrors(result.fields);
      setMessage(result.message);
      return;
    }
    router.push(`/entreprises/${companyId ?? result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nom de l'entreprise *" error={errors.name}>
        <Input value={values.name} onChange={set('name')} required maxLength={200} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ville" error={errors.city}>
          <Input value={values.city} onChange={set('city')} />
        </Field>
        <Field label="Canton (2 lettres)" error={errors.canton}>
          <Input value={values.canton} onChange={set('canton')} maxLength={2} placeholder="VD" />
        </Field>
        <Field label="Secteur" error={errors.industry}>
          <Input value={values.industry} onChange={set('industry')} />
        </Field>
        <Field label="Téléphone" error={errors.phone}>
          <Input type="tel" value={values.phone} onChange={set('phone')} />
        </Field>
        <Field label="Site web" error={errors.website}>
          <Input type="url" value={values.website} onChange={set('website')} placeholder="https://" />
        </Field>
      </div>
      <Field label="Adresse" error={errors.address}>
        <Input value={values.address} onChange={set('address')} />
      </Field>
      <Field label="Notes" error={errors.notes}>
        <Textarea value={values.notes} onChange={set('notes')} rows={4} />
      </Field>
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={saving}>
        {saving ? 'Enregistrement…' : companyId ? 'Enregistrer les modifications' : "Créer l'entreprise"}
      </Button>
    </form>
  );
}
