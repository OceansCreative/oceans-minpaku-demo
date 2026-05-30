import { MapPin } from 'lucide-react';
import Link from 'next/link';

import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

import type { ReactNode } from 'react';

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-ink/10 bg-sand/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="font-serif text-lg text-ink">和庵 山陰</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">
              Wa-an San&apos;in
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-ink/70">
            <Link href="/rooms" className="hover:text-ink">
              お部屋
            </Link>
            <Link href="/#access" className="hidden hover:text-ink sm:inline">
              <MapPin className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
              アクセス
            </Link>
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <Link
              href="/admin"
              className="rounded-md bg-ink px-3 py-1.5 text-xs text-sand transition-colors hover:bg-ink/90"
            >
              管理画面
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
