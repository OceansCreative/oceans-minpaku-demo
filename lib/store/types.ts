/**
 * Zustand slice creator helper. Each slice is a function that receives `set` / `get`
 * keyed to the WHOLE store, but returns only its own partial. Slices are merged
 * inside `lib/store/index.ts`.
 */
import type { AppStore } from './store-type';
import type { StateCreator } from 'zustand';

export type SliceCreator<TSlice> = StateCreator<
  AppStore,
  [['zustand/persist', unknown]],
  [],
  TSlice
>;
