'use client';

import { Globe } from 'lucide-react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { LanguageCode } from '@/types';

const OPTIONS: { code: LanguageCode; short: string; label: string }[] = [
  { code: 'ja', short: 'JA', label: '日本語' },
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'zh', short: 'ZH', label: '中文' },
  { code: 'ko', short: 'KO', label: '한국어' },
];

interface LanguageSwitcherProps {
  className?: string;
  /** When true, render a compact icon trigger (header). When false, a full select list. */
  compact?: boolean;
}

export function LanguageSwitcher({ className, compact = true }: LanguageSwitcherProps) {
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  if (compact) {
    return (
      <div
        className={cn(
          'group relative inline-flex items-center gap-1 rounded-md border border-ink/15 px-2.5 py-1 text-xs text-ink/70',
          className,
        )}
      >
        <Globe className="h-3 w-3" />
        <span aria-hidden>{language.toUpperCase()}</span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          aria-label="言語を切り替える"
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {OPTIONS.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <fieldset className={cn('flex flex-wrap gap-1.5', className)}>
      <legend className="sr-only">言語を切り替える</legend>
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLanguage(o.code)}
          className={cn(
            'rounded-full px-3 py-1 text-xs',
            language === o.code ? 'bg-ink text-sand' : 'bg-ink/[0.04] text-ink/70 hover:bg-ink/10',
          )}
        >
          {o.short} {o.label}
        </button>
      ))}
    </fieldset>
  );
}
