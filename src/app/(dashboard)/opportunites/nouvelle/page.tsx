import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { Card, PageHeader } from '@/components/ui/card';
import { OpportunityForm } from '@/components/forms/OpportunityForm';

export const dynamic = 'force-dynamic';

export default async function NewOpportunityPage({ searchParams }: { searchParams: { companyId?: string } }) {
  const user = await requireUser();
  const [companies, stages] = await Promise.all([
    prisma.company.findMany({ where: ownerScope(user), orderBy: { name: 'asc' }, select: { id: true, name: true }, take: 500 }),
    prisma.stage.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title="Nouvelle opportunité" />
      {companies.length === 0 ? (
        <p className="text-sm text-muted-foreground">Créez d&apos;abord une entreprise pour y rattacher une opportunité.</p>
      ) : (
        <Card className="p-5">
          <OpportunityForm
            companies={companies}
            stages={stages}
            defaultCompanyId={searchParams.companyId && companies.some((c) => c.id === searchParams.companyId) ? searchParams.companyId : undefined}
          />
        </Card>
      )}
    </>
  );
}
