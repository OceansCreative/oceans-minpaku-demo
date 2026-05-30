'use client';

import { Compass, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAppStore } from '@/lib/store';
import { DEFAULT_TOUR_STEPS } from '@/lib/tour/steps';
import { useTour } from '@/lib/tour/TourProvider';
import { cn } from '@/lib/utils/cn';

interface WelcomeModalProps {
  /** Optional callback fired when the visitor opts into the guided tour. */
  onStartTour?: () => void;
}

/**
 * First-visit welcome modal — explains what this demo is and offers a guided tour.
 * Reads / writes `hasSeenOnboarding` from the persisted Zustand store so it only
 * shows once per browser. Skippable.
 */
export function WelcomeModal({ onStartTour }: WelcomeModalProps) {
  const hasSeen = useAppStore((s) => s.hasSeenOnboarding);
  const markSeen = useAppStore((s) => s.markOnboardingSeen);
  const { start } = useTour();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Defer to next tick so we don't flicker on hydrate.
    const timer = setTimeout(() => {
      if (!hasSeen) setOpen(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [hasSeen]);

  if (!open) return null;

  function close() {
    markSeen();
    setOpen(false);
  }

  function startTour() {
    markSeen();
    setOpen(false);
    start(DEFAULT_TOUR_STEPS);
    onStartTour?.();
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="welcome-modal-title"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
    >
      <div
        className={cn(
          'relative w-full max-w-lg overflow-hidden rounded-2xl bg-sand shadow-2xl',
          'animate-in fade-in zoom-in-95',
        )}
      >
        <button
          type="button"
          onClick={close}
          aria-label="閉じる"
          className="absolute right-3 top-3 rounded-full p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-5 px-7 py-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-moss/15 text-moss">
              <Compass className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-moss">
              OceansBase Demo
            </p>
          </div>

          <div className="space-y-2">
            <h2 id="welcome-modal-title" className="font-serif text-2xl text-ink">
              ようこそ、和庵 山陰へ
            </h2>
            <p className="text-sm leading-relaxed text-ink/70">
              これは OceansBase
              が制作した民泊予約・運営管理システムのサンプルです。ゲスト側で予約をリクエスト
              し、管理側で承認 → パスコード発行という流れを体験できます。
            </p>
          </div>

          <div className="rounded-lg border border-ink/10 bg-ink/[0.02] px-4 py-3 text-xs text-ink/60">
            <p className="mb-1 font-medium text-ink/80">管理画面ログイン</p>
            <p>
              ユーザー: <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono">demo</code> /
              パスワード: <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono">demo</code>
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={startTour}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-sand transition-colors hover:bg-ink/90"
            >
              <Compass className="h-4 w-4" />
              セルフツアー開始
            </button>
            <button
              type="button"
              onClick={close}
              className="inline-flex flex-1 items-center justify-center rounded-md border border-ink/15 px-4 py-2.5 text-sm text-ink/70 transition-colors hover:bg-ink/5"
            >
              自由に試す
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
