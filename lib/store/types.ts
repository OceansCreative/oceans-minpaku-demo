/**
 * Zustand slice creator helper. Each slice is a function that receives `set` / `get`
 * and returns its partial state. Slices are merged inside `lib/store/index.ts`.
 */
import type { StateCreator } from 'zustand';

export type SliceCreator<TSlice, TStore = TSlice> = StateCreator<
  TStore,
  [['zustand/persist', unknown]],
  [],
  TSlice
>;
