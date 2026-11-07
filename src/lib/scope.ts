// Règles de périmètre : un commercial ne voit que ses données, la chefia voit tout.
// Ce module ne dépend d'aucune librairie serveur afin d'être testable unitairement.
export type ScopedUser = { id: string; role: 'commercial' | 'chefia' };

/** Filtre Prisma à appliquer sur les modèles ayant un champ `ownerId`. */
export function ownerScope(user: ScopedUser): { ownerId?: string } {
  return user.role === 'chefia' ? {} : { ownerId: user.id };
}

export function canAccessOwner(user: ScopedUser, ownerId: string): boolean {
  return user.role === 'chefia' || user.id === ownerId;
}
