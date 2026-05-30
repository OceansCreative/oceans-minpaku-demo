import { Sparkles } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils/cn';

interface FloatingBadgeProps {
  className?: string;
}

/**
 * Persistent "OceansBase 制作サンプル" badge — fixed to the lower-right of every
 * screen. Clicks open oceans-base.com in a new tab. Tasteful enough that it
 * doesn't fight the hospitality aesthetic.
 */
export function FloatingBadge({ className }: FloatingBadgeProps) {
  return (
    <Link
      href="https://oceans-base.com"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full',
        'bg-ink/90 px-4 py-2 text-sm text-sand shadow-lg backdrop-blur',
        'transition-colors hover:bg-ink focus-visible:outline focus-visible:outline-2',
        'focus-visible:outline-offset-2 focus-visible:outline-moss',
        className,
      )}
      aria-label="OceansBase 制作サンプル — oceans-base.com で詳細を見る"
    >
      <Sparkles className="h-4 w-4 text-moss transition-transform group-hover:rotate-12" />
      <span className="hidden sm:inline">OceansBase 制作サンプル</span>
      <span className="sm:hidden">DEMO</span>
      <span className="rounded-full bg-moss/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-moss">
        Demo
      </span>
    </Link>
  );
}
