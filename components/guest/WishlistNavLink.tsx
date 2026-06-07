'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useAppStore } from '@/lib/store';

/**
 * Nav link to /wishlist that shows a count badge when the wishlist is non-empty.
 * Rendered as a client component so it can read from Zustand.
 */
export function WishlistNavLink() {
  const count = useAppStore((s) => s.wishlist.length);
  const t = useTranslations('Nav');

  return (
    <Link
      href="/wishlist"
      className="relative rounded-md px-2 py-1 hover:bg-ink/[0.04] hover:text-ink dark:hover:bg-white/10 dark:hover:text-gray-100"
    >
      <span aria-hidden className="text-base leading-none">
        ♡
      </span>
      <span className="sr-only">{t('wishlist')}</span>
      {count > 0 && (
        <span
          aria-label={String(count)}
          className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-medium leading-none text-white"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
