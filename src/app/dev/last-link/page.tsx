import { notFound } from 'next/navigation';
import { devLinksEnabled, lastLink } from '@/lib/devLinks';

export const dynamic = 'force-dynamic';

// Page de développement : affiche le dernier lien de connexion d'une adresse.
// Introuvable (404) sauf si AUTH_SHOW_LINK=true et hors production.
export default function LastLinkPage({ searchParams }: { searchParams: { email?: string } }) {
  if (!devLinksEnabled()) notFound();
  const email = searchParams.email?.trim().toLowerCase();
  const url = email ? lastLink(email) : undefined;

  return (
    <main className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-xl font-bold">Lien de connexion (aperçu)</h1>
      <p className="text-sm text-muted-foreground">Page réservée au développement. Elle n&apos;existe pas en production.</p>
      <form className="flex gap-2" method="get">
        <input name="email" defaultValue={email ?? ''} placeholder="commercial@demo.ch" className="h-10 flex-1 rounded-md border px-3" />
        <button type="submit" className="h-10 rounded-md bg-blue-600 px-4 text-white">Afficher</button>
      </form>
      {email && url ? (
        <a href={url} className="block rounded-md bg-blue-600 px-4 py-3 text-center font-semibold text-white">
          Se connecter en tant que {email}
        </a>
      ) : email ? (
        <p className="text-sm text-red-700">Aucun lien récent pour cette adresse. Demandez un lien depuis la page de connexion.</p>
      ) : null}
    </main>
  );
}
