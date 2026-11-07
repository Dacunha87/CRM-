import { PageHeader, Card } from '@/components/ui/card';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { requireUser } from '@/lib/session';

export default async function NewCompanyPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Nouvelle entreprise" />
      <Card className="p-5">
        <CompanyForm />
      </Card>
    </>
  );
}
