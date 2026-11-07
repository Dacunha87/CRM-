import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { canAccessOwner } from '@/lib/scope';
import { apiError } from '@/lib/api';

// Renvoie la photo d'une activité (data URL décodée en image binaire).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError(401, 'Non authentifié');

  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    select: { photo: true, authorId: true },
  });
  if (!activity?.photo || !canAccessOwner(user, activity.authorId)) return apiError(404, 'Photo introuvable');

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(activity.photo);
  if (!match) return apiError(404, 'Photo introuvable');

  return new Response(Buffer.from(match[2], 'base64'), {
    headers: { 'Content-Type': match[1], 'Cache-Control': 'private, max-age=86400' },
  });
}
