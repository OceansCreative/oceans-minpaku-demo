import { DemoBanner } from '@/components/oceans-base/DemoBanner';
import { FloatingBadge } from '@/components/oceans-base/FloatingBadge';
import { SiteFooter } from '@/components/oceans-base/SiteFooter';
import { TourOverlay } from '@/components/onboarding/TourOverlay';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { AppProviders } from '@/components/providers/AppProviders';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Oceans Minpaku Demo',
  description: 'Sample vacation rental (minpaku) booking & operations system. Built by OceansBase.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col bg-sand text-ink antialiased">
        <AppProviders>
          <DemoBanner />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <FloatingBadge />
          <WelcomeModal />
          <TourOverlay />
        </AppProviders>
      </body>
    </html>
  );
}
