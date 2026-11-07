import { signOut } from '@/auth';
import { requireUser } from '@/lib/session';
import { BottomNav } from '@/components/nav/BottomNav';
import { QuickActivityButton } from '@/components/activity/QuickActivityButton';
import { SyncBootstrap } from '@/components/pwa/SyncBootstrap';
import { SyncStatus } from '@/components/pwa/SyncStatus';

// Toutes les pages protégées : vérifie la session une fois, puis affiche la coquille commune.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold">CRM Ventes</span>
            <SyncStatus />
          </div>
          <div className="flex items-center gap-4">
            <BottomNav placement="inline" />
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-muted-foreground sm:inline">{user.name ?? user.email}</span>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/login' });
                }}
              >
                <button type="submit" className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>

      <BottomNav placement="bottom" />

      <QuickActivityButton />
      <SyncBootstrap />
    </div>
  );
}
