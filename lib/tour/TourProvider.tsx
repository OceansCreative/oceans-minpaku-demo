'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { TourState, TourStep } from './types';

interface TourContextValue extends TourState {
  start: (steps: TourStep[]) => void;
  next: () => void;
  skip: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

interface TourProviderProps {
  children: ReactNode;
}

/**
 * Owns the self-tour state machine: list of steps, current index, advance / skip.
 * Components that want to TRIGGER the tour call `useTour().start(steps)` with their
 * own step list. The actual step content is registered in Phase 10.
 */
export function TourProvider({ children }: TourProviderProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const start = useCallback(
    (next: TourStep[]) => {
      setSteps(next);
      setActiveStepIndex(next.length > 0 ? 0 : null);
      const firstNav = next[0]?.navigateTo;
      if (firstNav) router.push(firstNav);
    },
    [router],
  );

  const advance = useCallback(
    (delta: number) => {
      setActiveStepIndex((current) => {
        if (current === null) return null;
        const target = current + delta;
        if (target >= steps.length) return null;
        if (target < 0) return 0;
        const nextStep = steps[target];
        if (nextStep?.navigateTo) router.push(nextStep.navigateTo);
        return target;
      });
    },
    [router, steps],
  );

  const next = useCallback(() => advance(1), [advance]);
  const skip = useCallback(() => setActiveStepIndex(null), []);

  const value = useMemo<TourContextValue>(
    () => ({
      steps,
      activeStepIndex,
      isActive: activeStepIndex !== null,
      start,
      next,
      skip,
    }),
    [steps, activeStepIndex, start, next, skip],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used inside <TourProvider>');
  return ctx;
}
