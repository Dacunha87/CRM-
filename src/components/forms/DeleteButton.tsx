'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { sendJson } from '@/lib/http';

export function DeleteButton({ url, redirectTo, label, question }: { url: string; redirectTo: string; label: string; question: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!window.confirm(question)) return;
    setBusy(true);
    const result = await sendJson(url, 'DELETE');
    setBusy(false);
    if (!result.ok) return setError(result.message);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" variant="destructive" size="sm" onClick={onClick} disabled={busy}>
        {label}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
