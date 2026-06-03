'use client';

import { Network } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils/cn';

interface OtaPlaceholderCardProps {
  name: string;
  protocol: string;
  notes: string;
  className?: string;
}

/**
 * Expansion placeholder for OTAs we haven't wired yet. Spelled out as a real
 * "we considered this" card rather than a TODO so it doubles as portfolio signal.
 */
export function OtaPlaceholderCard({ name, protocol, notes, className }: OtaPlaceholderCardProps) {
  const t = useTranslations('Admin');
  return (
    <section
      className={cn(
        'space-y-2 rounded-2xl border border-dashed border-ink/15 bg-sand/40 p-5 text-ink/60',
        className,
      )}
    >
      <header className="flex items-center gap-2 text-sm">
        <Network className="h-4 w-4 text-ink/30" />
        <span className="font-medium text-ink/80">{name}</span>
        <span className="ml-auto rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-wider">
          {t('otaExpansionBadge')}
        </span>
      </header>
      <dl className="grid gap-1 text-[11px]">
        <div className="flex justify-between">
          <dt className="text-ink/40">{t('otaProtocolLabel')}</dt>
          <dd>{protocol}</dd>
        </div>
      </dl>
      <p className="text-xs text-ink/60">{notes}</p>
    </section>
  );
}
