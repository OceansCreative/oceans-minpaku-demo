import type { CancellationPolicy, PricingRule } from '@/types';

/**
 * Default dynamic pricing rules. Multipliers compound when multiple rules match
 * (so weekend + high-season together = base * 1.2 * 1.3).
 *
 * Editable from `/admin/pricing`; these are the initial values shipped with the seed.
 */
export const seedPricingRules: PricingRule[] = [
  {
    id: 'rule-weekend',
    condition: { type: 'weekend', value: { weekdays: [5, 6] } }, // Fri+Sat nights
    multiplier: 1.2,
  },
  {
    id: 'rule-golden-week',
    condition: { type: 'season', value: { from: '04-29', to: '05-05' } },
    multiplier: 1.5,
  },
  {
    id: 'rule-summer',
    condition: { type: 'season', value: { from: '07-20', to: '08-31' } },
    multiplier: 1.3,
  },
  {
    id: 'rule-new-year',
    condition: { type: 'season', value: { from: '12-29', to: '01-03' } },
    multiplier: 1.6,
  },
  {
    id: 'rule-last-minute',
    condition: { type: 'leadtime', value: { maxDaysBefore: 3 } },
    multiplier: 0.9,
  },
  {
    id: 'rule-high-occupancy',
    condition: { type: 'occupancy', value: { minOccupancyRate: 0.8 } },
    multiplier: 1.15,
  },
  {
    id: 'rule-long-stay',
    condition: { type: 'lengthOfStay', value: { minNights: 5 } }, // 5+ nights = 連泊割
    multiplier: 0.9,
  },
];

/**
 * Stepped cancellation policy. Apply the policy whose `daysBefore` is the largest value
 * still ≤ days remaining until check-in.
 *
 * Example: 4 days out → 3-day policy applies (50% fee).
 */
export const seedCancellationPolicy: CancellationPolicy[] = [
  { id: 'cxl-7d', daysBefore: 7, depositRate: 0 },
  { id: 'cxl-3d', daysBefore: 3, depositRate: 0.5 },
  { id: 'cxl-1d', daysBefore: 1, depositRate: 1.0 },
];
