import { Cormorant_Garamond, Noto_Sans_JP } from 'next/font/google';

import { DemoBanner } from '@/components/oceans-base/DemoBanner';
import { FloatingBadge } from '@/components/oceans-base/FloatingBadge';
import { SiteFooter } from '@/components/oceans-base/SiteFooter';
import { TourOverlay } from '@/components/onboarding/TourOverlay';
import { WelcomeModal } from '@/components/onboarding/WelcomeModal';
import { AppProviders } from '@/components/providers/AppProviders';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '和庵 山陰 — Oceans Minpaku Demo',
  description: 'Sample vacation rental (minpaku) booking & operations system. Built by OceansBase.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col bg-sand font-sans text-ink antialiased">
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
