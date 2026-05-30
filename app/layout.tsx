import { FloatingBadge } from '@/components/oceans-base/FloatingBadge';

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
      <body className="min-h-screen bg-sand text-ink antialiased">
        {children}
        <FloatingBadge />
      </body>
    </html>
  );
}
