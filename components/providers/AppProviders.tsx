'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { IntlProvider } from '@/lib/i18n/IntlProvider';
import { hydrateAppStore } from '@/lib/store';
import { TourProvider } from '@/lib/tour/TourProvider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers root.
 * - Triggers Zustand's persist rehydrate exactly once after mount (we use
 *   `skipHydration: true` so SSR doesn't observe localStorage).
 * - Wraps everything in the self-tour provider so any page can drive the tour.
 * - Renders children either way; UI that needs the store should gate on its own
 *   selectors rather than wait for hydrate.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const [, setHydrated] = useState(false);

  useEffect(() => {
    void hydrateAppStore().then(() => {
      setHydrated(true);
    });
  }, []);

  return (
    <IntlProvider>
      <TourProvider>{children}</TourProvider>
    </IntlProvider>
  );
}
