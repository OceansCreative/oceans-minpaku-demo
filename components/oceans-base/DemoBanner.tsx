import { Info } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

interface DemoBannerProps {
  className?: string;
}

/**
 * Slim top strip reminding visitors that this is a portfolio demo with mock data.
 * Subdued so it doesn't dominate the page; dismiss-free so it can't be missed.
 */
export function DemoBanner({ className }: DemoBannerProps) {
  return (
    <div
      role="note"
      className={cn(
        'flex items-center justify-center gap-2 border-b border-ink/10 bg-ink/[0.03] px-4 py-1.5',
        'text-[11px] text-ink/60 sm:text-xs',
        className,
      )}
    >
      <Info className="h-3.5 w-3.5 shrink-0 text-moss" />
      <span>
        これは <span className="font-medium">OceansBase 制作のサンプル</span>{' '}
        です。表示データはダミーで、実際の予約・決済・スマートロック連携は行われません。
      </span>
    </div>
  );
}
