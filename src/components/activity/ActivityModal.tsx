'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Camera, Mic, MicOff, MapPin } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/fields';
import { useSpeech } from '@/hooks/useSpeech';
import { useOnline } from '@/hooks/useOnline';
import { getDb, type CachedCompany, type CachedOpportunity } from '@/lib/offline/db';
import { enqueueActivity } from '@/lib/offline/sync';
import { compressImage, getPosition } from '@/lib/media';
import { ACTIVITY_TYPES } from '@/lib/validations';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<(typeof ACTIVITY_TYPES)[number], string> = {
  VISITE: 'Visite',
  APPEL: 'Appel',
  EMAIL: 'E-mail',
  NOTE: 'Note',
};

/**
 * Saisie rapide d'une activité (objectif : moins de 30 secondes).
 * Fonctionne hors ligne : la saisie part dans la file locale et est envoyée au retour du réseau.
 */
export function ActivityModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const online = useOnline();
  const [type, setType] = useState<(typeof ACTIVITY_TYPES)[number]>('VISITE');
  const [companies, setCompanies] = useState<CachedCompany[]>([]);
  const [opportunities, setOpportunities] = useState<CachedOpportunity[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [summary, setSummary] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [withLocation, setWithLocation] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const speech = useSpeech((text) => setSummary((current) => (current ? `${current} ${text}` : text)));

  // Listes proposées depuis le cache local : disponibles même sans réseau.
  useEffect(() => {
    if (!open) return;
    setMessage(null);
    setError(null);
    void (async () => {
      const db = getDb();
      setCompanies(await db.companies.orderBy('name').toArray());
    })();
  }, [open]);

  useEffect(() => {
    if (!companyId) {
      setOpportunities([]);
      return;
    }
    void (async () => {
      const db = getDb();
      setOpportunities(await db.opportunities.where('companyId').equals(companyId).toArray());
    })();
  }, [companyId]);

  function reset() {
    setType('VISITE');
    setCompanyId('');
    setOpportunityId('');
    setSummary('');
    setDurationMin('');
    setPhoto(null);
    setPhotoError(null);
    setError(null);
  }

  async function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    try {
      setPhoto(await compressImage(file));
    } catch (err) {
      setPhoto(null);
      setPhotoError(err instanceof Error ? err.message : 'Photo impossible à traiter');
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!companyId) return setError('Choisissez une entreprise');
    if (!summary.trim()) return setError('Ajoutez un résumé (saisie ou dictée)');

    setSaving(true);
    try {
      const position = withLocation ? await getPosition() : null;
      const wasOnline = online;
      await enqueueActivity({
        id: crypto.randomUUID(),
        type,
        summary: summary.trim(),
        occurredAt: new Date().toISOString(),
        companyId,
        opportunityId: opportunityId || undefined,
        durationMin: durationMin ? Number(durationMin) : undefined,
        latitude: position?.latitude,
        longitude: position?.longitude,
        photo: photo ?? undefined,
      });
      setMessage(wasOnline ? 'Activité enregistrée.' : 'Enregistrée hors ligne : elle sera envoyée au retour du réseau.');
      reset();
      onOpenChange(false);
    } catch {
      setError("Impossible d'enregistrer localement. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Nouvelle activité" description="Enregistrez votre visite ou votre appel en quelques secondes.">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Type d'activité">
            {ACTIVITY_TYPES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => setType(value)}
                className={cn(
                  'h-10 rounded-md border text-sm font-medium',
                  type === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-white hover:bg-accent',
                )}
              >
                {TYPE_LABELS[value]}
              </button>
            ))}
          </div>

          <Field label="Entreprise">
            <Select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setOpportunityId(''); }} required>
              <option value="">— Choisir —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.city ? ` (${c.city})` : ''}
                </option>
              ))}
            </Select>
            {companies.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                Aucune entreprise en cache. Connectez-vous une fois au réseau pour les charger.
              </span>
            ) : null}
          </Field>

          {opportunities.length > 0 ? (
            <Field label="Opportunité (optionnel)">
              <Select value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
                <option value="">— Aucune —</option>
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          <Field label="Résumé">
            <div className="flex gap-2">
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Ce qui a été dit, décidé, prochaine étape…"
                rows={4}
                className="flex-1"
              />
              {speech.supported ? (
                <Button
                  type="button"
                  variant={speech.listening ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={speech.listening ? speech.stop : speech.start}
                  aria-label={speech.listening ? 'Arrêter la dictée' : 'Dicter le résumé'}
                  className="h-auto self-start"
                >
                  {speech.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              ) : null}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Durée (min)">
              <Input type="number" inputMode="numeric" min={0} max={1440} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
            </Field>
            <Field label="Photo (optionnel)">
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-white text-sm hover:bg-accent">
                <Camera className="h-4 w-4" />
                {photo ? 'Photo ajoutée' : 'Prendre / choisir'}
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhotoChange} />
              </label>
              {photoError ? <span className="text-xs text-destructive">{photoError}</span> : null}
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={withLocation} onChange={(e) => setWithLocation(e.target.checked)} className="h-4 w-4" />
            <MapPin className="h-4 w-4 text-muted-foreground" /> Enregistrer ma position
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <Button type="submit" size="lg" className="w-full" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
