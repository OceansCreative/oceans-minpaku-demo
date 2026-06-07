/**
 * Combined store type. Slices reference this so `set`/`get` see the whole store
 * (a slice can read another slice's state). This file imports type-only from each
 * slice file — the resulting cycle is elided at compile time.
 *
 * Add new slice intersections here as they land.
 */
import type { AddonSlice } from './addon-slice';
import type { AppSlice } from './app-slice';
import type { GuestRegisterSlice } from './guest-register-slice';
import type { MessagesSlice } from './messages-slice';
import type { NotificationSlice } from './notification-slice';
import type { PolicySlice } from './policy-slice';
import type { PricingSlice } from './pricing-slice';
import type { PromoSlice } from './promo-slice';
import type { ReservationSlice } from './reservation-slice';
import type { ReviewSlice } from './review-slice';
import type { ThemeSlice } from './theme-slice';
import type { WishlistSlice } from './wishlist-slice';

export type AppStore = AppSlice &
  ReservationSlice &
  PricingSlice &
  PolicySlice &
  MessagesSlice &
  GuestRegisterSlice &
  PromoSlice &
  ReviewSlice &
  AddonSlice &
  ThemeSlice &
  WishlistSlice &
  NotificationSlice;
