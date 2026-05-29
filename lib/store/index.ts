'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createAppSlice } from './app-slice';
import { createReservationSlice } from './reservation-slice';

import type { AppStore } from './store-type';

export type { AppStore } from './store-type';
export const STORE_NAME = 'oceans-minpaku-store';

/**
 * Root Zustand store. Persisted to `localStorage` so the guest flow and the admin
 * console share the same demo state — approving a reservation in /admin shows
 * up immediately on the guest's status page.
 *
 * Slices merged so far: app, reservation. Pricing / policy slices land in
 * follow-up commits.
 */
export const useAppStore = create<AppStore>()(
  persist(
    (...a) => {
      const [, get] = a;
      return {
        ...createAppSlice(...a),
        ...createReservationSlice(...a),
        // Override resetToSeed so it rebuilds every slice atomically.
        resetToSeed: () => {
          get().resetReservationSlice();
        },
      };
    },
    {
      name: STORE_NAME,
      version: 1,
      // SSR safety: rehydrate explicitly from a client component so Next's render
      // doesn't observe localStorage during the first server pass.
      skipHydration: true,
    },
  ),
);

/** Call from a top-level client component (e.g. providers.tsx) once mounted. */
export function hydrateAppStore(): Promise<void> {
  return useAppStore.persist.rehydrate() ?? Promise.resolve();
}
