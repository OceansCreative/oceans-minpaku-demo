'use client';

import { useTranslations } from 'next-intl';

import { useAppStore } from '@/lib/store';

import type { Theme } from '@/lib/store/theme-slice';

const CYCLE: Theme[] = ['light', 'dark', 'system'];

const ICONS: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  system: '💻',
};

/**
 * Compact toggle button that cycles light → dark → system → light.
 * Placed in the guest header nav and the admin header.
 */
export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const t = useTranslations('theme');

  function handleClick() {
    const idx = CYCLE.indexOf(theme);
    const next = CYCLE[(idx + 1) % CYCLE.length];
    if (next) setTheme(next);
  }

  const ariaLabel = `${t('toggle_aria')} (${t(theme)})`;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="rounded-md p-1.5 text-ink/60 transition-colors hover:bg-ink/[0.06] hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
    >
      <span aria-hidden className="text-base leading-none">
        {ICONS[theme]}
      </span>
    </button>
  );
}
