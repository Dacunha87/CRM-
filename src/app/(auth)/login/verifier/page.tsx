export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold">Vérifiez vos e-mails</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Si votre adresse est enregistrée, un lien de connexion vient de vous être envoyé. Il est valable 15 minutes.
        </p>
      </div>
    </main>
  );
}
