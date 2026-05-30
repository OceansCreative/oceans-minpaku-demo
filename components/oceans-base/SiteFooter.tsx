import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils/cn';

interface SiteFooterProps {
  className?: string;
  variant?: 'guest' | 'admin';
}

/**
 * Footer with OceansBase credit and a "ご相談ください" CTA. Placed on every page
 * via the root layout so visitors always have a one-click route to the contact
 * form on oceans-base.com.
 */
export function SiteFooter({ className, variant = 'guest' }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        'mt-16 border-t border-ink/10 bg-ink/95 px-6 py-10 text-sand',
        variant === 'admin' && 'mt-8 px-4 py-6 text-xs',
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <p className="font-serif text-lg tracking-wide">和庵 山陰 — Wa-an San&apos;in</p>
          <p className="text-sm text-sand/70">
            このサイトは <span className="text-moss">OceansBase</span>{' '}
            が制作したサンプルです。データはダミーで、実際の予約・決済は行えません。
          </p>
          <p className="text-xs text-sand/50">
            Crafted by OceansBase — このようなシステムの開発をご相談いただけます。
          </p>
        </div>
        <Link
          href="https://oceans-base.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'group inline-flex items-center gap-2 rounded-md bg-moss px-4 py-2 text-sm',
            'font-medium text-sand transition-colors hover:bg-moss/90',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-sand',
          )}
        >
          OceansBase に相談する
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-sand/10 pt-4 text-[11px] text-sand/40">
        © {new Date().getFullYear()} OceansBase / Kazushi Ikeda — Apache License 2.0
      </div>
    </footer>
  );
}
