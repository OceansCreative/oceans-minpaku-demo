'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createAppSlice, type AppSlice } from './app-slice';

/**
 * Root Zustand store. Persisted to `localStorage` so the guest flow and the admin
 * console share the same demo state — approving a reservation in /admin shows
 * up immediately on the guest's status page.
 *
 * Domain slices (reservation, pricing, policy) are merged in by the slice-specific
 * commits that follow this one.
 */
export type AppStore = AppSlice;

export const STORE_NAME = 'oceans-minpaku-store';

export const useAppStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createAppSlice(...a),
    }),
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
