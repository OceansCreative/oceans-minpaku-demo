'use client';

import { ChevronRight, X } from 'lucide-react';

import { useTour } from '@/lib/tour/TourProvider';
import { cn } from '@/lib/utils/cn';

/**
 * Fixed-position overlay that surfaces the active tour step.
 * Anchored bottom-center so it doesn't fight the page content. Skippable.
 */
export function TourOverlay() {
  const { steps, activeStepIndex, isActive, next, skip } = useTour();
  if (!isActive || activeStepIndex === null) return null;
  const step = steps[activeStepIndex];
  if (!step) return null;

  const isLast = activeStepIndex === steps.length - 1;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-labelledby="tour-step-title"
      className={cn(
        'fixed bottom-20 left-1/2 z-[55] w-[min(92vw,420px)] -translate-x-1/2',
        'rounded-xl border border-ink/10 bg-sand shadow-2xl',
        'animate-in fade-in slide-in-from-bottom-2',
      )}
    >
      <div className="space-y-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-moss">
              Step {activeStepIndex + 1} / {steps.length}
            </p>
            <h3 id="tour-step-title" className="font-serif text-lg leading-tight text-ink">
              {step.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={skip}
            aria-label="ツアーを終了"
            className="shrink-0 rounded-full p-1 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-ink/70">{step.body}</p>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={skip}
            className="text-xs text-ink/50 underline-offset-2 hover:underline"
          >
            スキップ
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-sand transition-colors hover:bg-ink/90"
          >
            {step.ctaLabel ?? (isLast ? 'ツアー完了' : '次へ')}
            {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
