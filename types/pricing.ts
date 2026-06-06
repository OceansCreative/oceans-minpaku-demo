/**
 * Dynamic pricing rule. Each rule multiplies the room base price when its condition matches.
 * Multiple matching rules compound (multiplier_1 * multiplier_2 * ...).
 */

export interface WeekendCondition {
  /**
   * Days treated as "weekend" for this rule. 0 = Sunday … 6 = Saturday.
   *
   * Defaults aren't applied automatically — pass the explicit list. For Japan
   * the standard is `[5, 6]` (Fri night + Sat night) since the Fri→Sat checkout
   * is the canonical weekend stay.
   */
  weekdays: number[];
}

export interface SeasonCondition {
  /** Inclusive MM-DD start. */
  from: string;
  /** Inclusive MM-DD end. */
  to: string;
}

export interface LeadTimeCondition {
  /** Rule applies when booking lead time (days) is ≤ this number. */
  maxDaysBefore: number;
}

export interface OccupancyCondition {
  /** Rule applies when month-of-stay occupancy ≥ this fraction (0–1). */
  minOccupancyRate: number;
}

export interface LengthOfStayCondition {
  /** Rule applies when the stay is at least this many nights (連泊割). */
  minNights: number;
}

export type PricingRuleCondition =
  | { type: 'weekend'; value: WeekendCondition }
  | { type: 'season'; value: SeasonCondition }
  | { type: 'leadtime'; value: LeadTimeCondition }
  | { type: 'occupancy'; value: OccupancyCondition }
  | { type: 'lengthOfStay'; value: LengthOfStayCondition };

/**
 * Convenience alias matching the discriminator literal types. UI code can switch
 * on `rule.condition.type` directly; there is no separate `rule.type` field
 * (that was a dual-source-of-truth bug — removed).
 */
export type PricingRuleType = PricingRuleCondition['type'];

export interface PricingRule {
  id: string;
  condition: PricingRuleCondition;
  /** Multiplier applied to base price when this rule matches (e.g. 1.3 = +30%). */
  multiplier: number;
}

export interface CancellationPolicy {
  id: string;
  /** Cancellations made >= daysBefore days before check-in keep this deposit rate. */
  daysBefore: number;
  /** Fraction of total amount retained as the cancellation fee (0–1). */
  depositRate: number;
}
