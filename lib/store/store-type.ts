/**
 * Combined store type. Slices reference this so `set`/`get` see the whole store
 * (a slice can read another slice's state). This file imports type-only from each
 * slice file — the resulting cycle is elided at compile time.
 *
 * Add new slice intersections here as they land.
 */
import type { AppSlice } from './app-slice';
import type { GuestRegisterSlice } from './guest-register-slice';
import type { MessagesSlice } from './messages-slice';
import type { PolicySlice } from './policy-slice';
import type { PricingSlice } from './pricing-slice';
import type { ReservationSlice } from './reservation-slice';

export type AppStore = AppSlice &
  ReservationSlice &
  PricingSlice &
  PolicySlice &
  MessagesSlice &
  GuestRegisterSlice;
