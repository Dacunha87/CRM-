'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, Textarea, Field } from '@/components/ui/fields';
import { sendJson } from '@/lib/http';

type Stage = { id: string; name: string; kind: 'OPEN' | 'WON' | 'LOST' };

/** Changement d'étape depuis la fiche (le motif de perte est demandé si nécessaire). */
export function OpportunityStageForm({
  opportunityId,
  stages,
  currentStageId,
  currentLostReason,
}: {
  opportunityId: string;
  stages: Stage[];
  currentStageId: string;
  currentLostReason: string | null;
}) {
  const router = useRouter();
  const [stageId, setStageId] = useState(currentStageId);
  const [reason, setReason] = useState(currentLostReason ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const target = stages.find((s) => s.id === stageId);
  const needsReason = target?.kind === 'LOST';

  async function save() {
    setError(null);
    if (needsReason && !reason.trim()) return setError('Le motif de perte est obligatoire.');
    setSaving(true);
    const result = await sendJson(`/api/opportunities/${opportunityId}`, 'PATCH', {
      stageId,
      lostReason: needsReason ? reason.trim() : undefined,
    });
    setSaving(false);
    if (!result.ok) return setError(result.message);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Field label="Étape">
        <Select value={stageId} onChange={(e) => setStageId(e.target.value)}>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      {needsReason ? (
        <Field label="Motif de perte *">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} />
        </Field>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button onClick={save} disabled={saving || stageId === currentStageId && (!needsReason || reason === (currentLostReason ?? ''))}>
        {saving ? 'Enregistrement…' : "Mettre à jour l'étape"}
      </Button>
    </div>
  );
}
