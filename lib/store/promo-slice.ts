import { seedPromoCodes } from '@/lib/seed/promos';
import { applyPromoCode } from '@/lib/services/promo';

import type { SliceCreator } from './types';
import type { PromoError, PromoResult } from '@/lib/services/promo';

export type { PromoError, PromoResult };

export interface PromoSlice {
  appliedPromo: PromoResult | null;
  promoError: PromoError | null;
  applyPromo: (code: string, amount: number, nights: number) => void;
  clearPromo: () => void;
}

export const createPromoSlice: SliceCreator<PromoSlice> = (set) => ({
  appliedPromo: null,
  promoError: null,

  applyPromo: (code, amount, nights) => {
    const result = applyPromoCode(code, amount, nights, seedPromoCodes);
    if (result.ok) {
      set({ appliedPromo: result.result, promoError: null });
    } else {
      set({ appliedPromo: null, promoError: result.error });
    }
  },

  clearPromo: () => set({ appliedPromo: null, promoError: null }),
});
