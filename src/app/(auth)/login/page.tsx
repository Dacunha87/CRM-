import { redirect } from 'next/navigation';
import { z } from 'zod';
import { signIn } from '@/auth';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/fields';

export const dynamic = 'force-dynamic';

const emailSchema = z.string().trim().toLowerCase().email();

async function sendMagicLink(formData: FormData) {
  'use server';
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) redirect('/login?error=email');
  // Auth.js impose sa propre page « verify-request » ; on récupère l'URL sans redirection
  // pour rediriger vers notre page en français.
  const next = await signIn('nodemailer', { email: parsed.data, redirect: false, redirectTo: '/' });
  if (typeof next === 'string' && next.includes('/verify-request')) redirect('/login/verifier');
  redirect('/login?error=send');
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">CRM Ventes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisissez votre adresse e-mail : vous recevrez un lien de connexion valable 15 minutes. Aucun mot de passe.
        </p>
        <form action={sendMagicLink} className="mt-6 space-y-4">
          {searchParams.error === 'send' ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              Impossible d&apos;envoyer le lien pour le moment. Réessayez plus tard.
            </p>
          ) : null}
          <Field label="Adresse e-mail" error={searchParams.error === 'email' ? 'Adresse e-mail invalide' : undefined}>
            <Input name="email" type="email" inputMode="email" autoComplete="email" required placeholder="prenom.nom@entreprise.ch" />
          </Field>
          <Button type="submit" size="lg" className="w-full">
            Recevoir le lien de connexion
          </Button>
        </form>
      </div>
    </main>
  );
}
