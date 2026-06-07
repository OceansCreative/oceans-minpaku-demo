import { MapPin } from 'lucide-react';
import Link from 'next/link';

import { ThemeToggle } from '@/components/guest/ThemeToggle';
import { WishlistNavLink } from '@/components/guest/WishlistNavLink';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

import type { ReactNode } from 'react';

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-sand/85 backdrop-blur supports-[backdrop-filter]:bg-sand/65 dark:border-gray-700/60 dark:bg-gray-900/85 dark:supports-[backdrop-filter]:bg-gray-900/70 print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex shrink-0 flex-col leading-tight">
            <span className="font-serif text-base text-ink dark:text-gray-100 sm:text-lg">
              和庵 山陰
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-ink/40 dark:text-gray-500 sm:inline">
              Wa-an San&apos;in
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm text-ink/70 dark:text-gray-400 sm:gap-5">
            <Link
              href="/rooms"
              className="rounded-md px-2 py-1 hover:bg-ink/[0.04] hover:text-ink dark:hover:bg-white/10 dark:hover:text-gray-100"
            >
              お部屋
            </Link>
            <Link
              href="/#access"
              className="hidden rounded-md px-2 py-1 hover:bg-ink/[0.04] hover:text-ink dark:hover:bg-white/10 dark:hover:text-gray-100 sm:inline"
            >
              <MapPin className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
              アクセス
            </Link>
            <WishlistNavLink />
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/admin"
              className="rounded-md bg-ink px-2.5 py-1.5 text-[11px] text-sand transition-colors hover:bg-ink/90 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 sm:px-3 sm:text-xs"
            >
              管理
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
