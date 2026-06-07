'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { createAddonSlice } from './addon-slice';
import { createAppSlice } from './app-slice';
import { createGuestRegisterSlice } from './guest-register-slice';
import { createMessagesSlice } from './messages-slice';
import { createPolicySlice } from './policy-slice';
import { createPricingSlice } from './pricing-slice';
import { createPromoSlice } from './promo-slice';
import { createReservationSlice } from './reservation-slice';
import { createReviewSlice } from './review-slice';
import { createThemeSlice } from './theme-slice';
import { createWishlistSlice } from './wishlist-slice';

import type { AppStore } from './store-type';

export type { AppStore } from './store-type';
export const STORE_NAME = 'oceans-minpaku-store';

/**
 * Root Zustand store. Persisted to `localStorage` so the guest flow and the admin
 * console share the same demo state — approving a reservation in /admin shows
 * up immediately on the guest's status page.
 *
 * Slices merged: app, reservation, pricing, policy.
 */
export const useAppStore = create<AppStore>()(
  persist(
    (...a) => {
      const [, get] = a;
      return {
        ...createAppSlice(...a),
        ...createReservationSlice(...a),
        ...createPricingSlice(...a),
        ...createPolicySlice(...a),
        ...createMessagesSlice(...a),
        ...createGuestRegisterSlice(...a),
        ...createPromoSlice(...a),
        ...createReviewSlice(...a),
        ...createAddonSlice(...a),
        ...createThemeSlice(...a),
        ...createWishlistSlice(...a),
        // Override resetToSeed so it rebuilds every slice atomically.
        resetToSeed: () => {
          const state = get();
          state.resetReservationSlice();
          state.resetPricingSlice();
          state.resetPolicySlice();
          state.resetMessagesSlice();
          state.resetGuestRegisterSlice();
          state.clearPromo();
          state.resetReviewSlice();
          state.clearAddons();
          state.clearWishlist();
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
