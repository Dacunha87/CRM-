'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/fields';
import { sendJson } from '@/lib/http';

type Option = { id: string; name: string };

/** Tâche ou rappel. Si `companyId` est fourni, la tâche est liée à cette entreprise. */
export function TaskForm({ companies = [], companyId }: { companies?: Option[]; companyId?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Par défaut : demain à 9 h. Calculé après le rendu pour éviter une différence serveur/navigateur.
  const [dueAt, setDueAt] = useState('');
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setDueAt(new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60_000).toISOString().slice(0, 16));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setErrors({});
    setMessage(null);
    const result = await sendJson('/api/tasks', 'POST', {
      title: data.title,
      dueAt: data.dueAt,
      companyId: companyId ?? (data.companyId || undefined),
    });
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fields);
      setMessage(result.message);
      return;
    }
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Tâche / rappel *" error={errors.title}>
        <Input name="title" required maxLength={200} placeholder="Rappeler pour la proposition" />
      </Field>
      <Field label="Échéance *" error={errors.dueAt}>
        <Input name="dueAt" type="datetime-local" required value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
      </Field>
      {companyId === undefined && companies.length > 0 ? (
        <Field label="Entreprise (optionnel)" error={errors.companyId}>
          <Select name="companyId" defaultValue="">
            <option value="">— Aucune —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      {message ? <p className="text-sm text-destructive sm:col-span-2">{message}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" variant="secondary" disabled={saving}>
          {saving ? 'Ajout…' : 'Ajouter la tâche'}
        </Button>
      </div>
    </form>
  );
}
