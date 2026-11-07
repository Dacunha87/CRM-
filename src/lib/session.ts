// Accès à l'utilisateur courant côté serveur (pages et routes API).
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { ScopedUser } from '@/lib/scope';

export type CurrentUser = ScopedUser & { name: string | null; email: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    name: session.user.name ?? null,
    email: session.user.email ?? '',
  };
}

/** À utiliser dans les layouts et pages protégées : redirige vers la connexion si nécessaire. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
