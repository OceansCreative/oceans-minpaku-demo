'use client';

import { useEffect, useState } from 'react';

import { useAppStore } from '@/lib/store';

/**
 * Reads the `theme` from the Zustand store and applies/removes `class="dark"` on
 * `document.documentElement`. When `theme === 'system'` it follows
 * `prefers-color-scheme` via a MediaQueryList change listener.
 *
 * A mount guard ensures no DOM manipulation occurs during the server render,
 * preventing SSR/hydration mismatch.
 */
export function ThemeProvider() {
  const theme = useAppStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      return;
    }

    if (theme === 'light') {
      root.classList.remove('dark');
      return;
    }

    // theme === 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark: boolean) => {
      if (dark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    apply(mq.matches);

    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, mounted]);

  return null;
}
