export interface PromoCode {
  code: string;
  type: 'percent' | 'fixed';
  /** percent: 0..100 — fixed: JPY amount */
  value: number;
  /** Optional minimum nights required. */
  minNights?: number;
  /** Leave undefined for unlimited (demo). */
  maxUses?: number;
  active: boolean;
}

export const seedPromoCodes: PromoCode[] = [
  { code: 'WELCOME10', type: 'percent', value: 10, active: true },
  { code: 'STAY3', type: 'percent', value: 5, minNights: 3, active: true },
  { code: 'FLAT5000', type: 'fixed', value: 5000, active: true },
  /** Inactive code — demonstrates the INACTIVE error path. */
  { code: 'EXPIRED', type: 'percent', value: 20, active: false },
];
