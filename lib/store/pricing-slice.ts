import { seedPricingRules } from '@/lib/seed';

import type { SliceCreator } from './types';
import type { PricingRule } from '@/types';

export interface PricingSlice {
  pricingRules: PricingRule[];
  upsertPricingRule: (rule: PricingRule) => void;
  removePricingRule: (id: string) => void;
  resetPricingSlice: () => void;
}

export const createPricingSlice: SliceCreator<PricingSlice> = (set) => ({
  pricingRules: seedPricingRules,

  upsertPricingRule: (rule) =>
    set((state) => {
      const exists = state.pricingRules.some((r) => r.id === rule.id);
      return {
        pricingRules: exists
          ? state.pricingRules.map((r) => (r.id === rule.id ? rule : r))
          : [...state.pricingRules, rule],
      };
    }),

  removePricingRule: (id) =>
    set((state) => ({
      pricingRules: state.pricingRules.filter((r) => r.id !== id),
    })),

  resetPricingSlice: () => set({ pricingRules: seedPricingRules }),
});
