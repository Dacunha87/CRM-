import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/fields';
import { Card, EmptyState, PageHeader } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage({ searchParams }: { searchParams: { q?: string } }) {
  const user = await requireUser();
  const q = searchParams.q?.trim();

  const companies = await prisma.company.findMany({
    where: {
      ...ownerScope(user),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } }] } : {}),
    },
    orderBy: { name: 'asc' },
    take: 200,
    select: {
      id: true,
      name: true,
      city: true,
      canton: true,
      industry: true,
      _count: { select: { contacts: true, opportunities: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Entreprises"
        action={
          <Link href="/entreprises/nouvelle">
            <Button>Nouvelle entreprise</Button>
          </Link>
        }
      />
      <form className="mb-4 flex gap-2" role="search">
        <Input name="q" defaultValue={q ?? ''} placeholder="Rechercher par nom ou ville" aria-label="Rechercher" />
        <Button type="submit" variant="secondary">
          Chercher
        </Button>
      </form>

      {companies.length === 0 ? (
        <EmptyState>{q ? 'Aucun résultat.' : 'Aucune entreprise pour le moment.'}</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {companies.map((c) => (
            <li key={c.id}>
              <Link href={`/entreprises/${c.id}`} className="block">
                <Card className="p-4 transition-colors hover:bg-accent/40">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[c.city, c.canton, c.industry].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {c._count.contacts} contact(s) · {c._count.opportunities} opportunité(s)
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
