import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { ownerScope } from '@/lib/scope';
import { PageHeader, Card } from '@/components/ui/card';
import { CompanyForm } from '@/components/forms/CompanyForm';

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const company = await prisma.company.findFirst({
    where: { id: params.id, ...ownerScope(user) },
    select: { id: true, name: true, city: true, canton: true, industry: true, website: true, phone: true, address: true, notes: true },
  });
  if (!company) notFound();

  return (
    <>
      <PageHeader title={`Modifier ${company.name}`} />
      <Card className="p-5">
        <CompanyForm
          companyId={company.id}
          initial={{
            name: company.name,
            city: company.city ?? '',
            canton: company.canton ?? '',
            industry: company.industry ?? '',
            website: company.website ?? '',
            phone: company.phone ?? '',
            address: company.address ?? '',
            notes: company.notes ?? '',
          }}
        />
      </Card>
    </>
  );
}
