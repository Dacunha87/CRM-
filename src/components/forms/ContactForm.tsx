'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/fields';
import { sendJson } from '@/lib/http';

export function ContactForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setErrors({});
    setMessage(null);
    const result = await sendJson('/api/contacts', 'POST', {
      ...data,
      companyId,
      isDecisionMaker: data.isDecisionMaker === 'on',
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
      <Field label="Prénom *" error={errors.firstName}>
        <Input name="firstName" required />
      </Field>
      <Field label="Nom *" error={errors.lastName}>
        <Input name="lastName" required />
      </Field>
      <Field label="Fonction" error={errors.jobTitle}>
        <Input name="jobTitle" />
      </Field>
      <Field label="E-mail" error={errors.email}>
        <Input name="email" type="email" />
      </Field>
      <Field label="Téléphone" error={errors.phone}>
        <Input name="phone" type="tel" />
      </Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <input name="isDecisionMaker" type="checkbox" className="h-4 w-4" /> Décideur
      </label>
      {message ? <p className="text-sm text-destructive sm:col-span-2">{message}</p> : null}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Ajout…' : 'Ajouter le contact'}
        </Button>
      </div>
    </form>
  );
}
