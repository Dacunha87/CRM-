// Ajoute l'identifiant et le rôle métier à la session NextAuth.
import type { DefaultSession } from 'next-auth';

type Role = 'commercial' | 'chefia';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession['user'];
  }

  interface User {
    role: Role;
  }
}
