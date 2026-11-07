import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'CRM Ventes', template: '%s · CRM Ventes' },
  description: 'CRM mobile-first pour commerciaux terrain, avec saisie hors ligne.',
  manifest: '/manifest.json',
  applicationName: 'CRM Ventes',
  appleWebApp: { capable: true, title: 'CRM Ventes', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CH">
      <body className="min-h-screen font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
