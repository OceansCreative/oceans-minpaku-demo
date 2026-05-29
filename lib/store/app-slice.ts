import type { SliceCreator } from './types';
import type { LanguageCode } from '@/types';

/**
 * Cross-cutting application state — language, demo-mode flag, hydration tracking.
 * Domain data lives in its own slice (reservation, pricing, policy).
 */
export interface AppSlice {
  language: LanguageCode;
  /**
   * Anchor date for relative seed data. Stored as ISO so persist roundtrips cleanly.
   * Set on first hydrate so the demo's "today" stays stable across page navigations.
   */
  seedAnchorIso: string;
  hasSeenOnboarding: boolean;
  setLanguage: (language: LanguageCode) => void;
  markOnboardingSeen: () => void;
  /** Reset every slice to seed values (admin "サンプルデータリセット" button). */
  resetToSeed: () => void;
}

export const createAppSlice: SliceCreator<AppSlice> = (set) => ({
  language: 'ja',
  seedAnchorIso: new Date().toISOString(),
  hasSeenOnboarding: false,
  setLanguage: (language) => set({ language }),
  markOnboardingSeen: () => set({ hasSeenOnboarding: true }),
  // Implemented by the root store so it can rebuild every slice atomically.
  resetToSeed: () => {
    // Wired up in lib/store/index.ts where the full slice set is in scope.
  },
});
