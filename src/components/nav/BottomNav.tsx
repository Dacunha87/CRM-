'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, CheckSquare, Kanban, LayoutDashboard, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/', label: 'Accueil', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/entreprises', label: 'Entreprises', icon: Building2 },
  { href: '/opportunites', label: 'Opportunités', icon: Target },
  { href: '/taches', label: 'Tâches', icon: CheckSquare },
];

/**
 * Navigation principale.
 * - `bottom` : barre fixée en bas de l'écran sur mobile, masquée sur ordinateur.
 * - `inline` : liens horizontaux dans l'en-tête, visibles sur ordinateur uniquement.
 * Ne pas fixer la barre à l'intérieur de l'en-tête : son fond flouté la piégerait.
 */
export function BottomNav({ placement }: { placement: 'bottom' | 'inline' }) {
  const pathname = usePathname();
  const frame =
    placement === 'bottom'
      ? 'fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 backdrop-blur md:hidden'
      : 'hidden md:block';
  return (
    <nav aria-label="Navigation principale" className={frame}>
      <ul className="mx-auto flex max-w-5xl justify-around md:gap-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium md:flex-row md:gap-2 md:rounded-md md:px-3 md:py-1.5 md:text-sm',
                  active ? 'text-primary md:bg-accent' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
