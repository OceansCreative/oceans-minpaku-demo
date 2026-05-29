/**
 * Dynamic pricing rule. Each rule multiplies the room base price when its condition matches.
 * Multiple matching rules compound (multiplier_1 * multiplier_2 * ...).
 */
export type PricingRuleType = 'weekday' | 'weekend' | 'season' | 'leadtime' | 'occupancy';

export interface WeekdayCondition {
  /** 0 = Sunday … 6 = Saturday. */
  weekdays: number[];
}

export interface WeekendCondition {
  /** Days treated as weekend; defaults to Sat+Sun. */
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

export type PricingRuleCondition =
  | { type: 'weekday'; value: WeekdayCondition }
  | { type: 'weekend'; value: WeekendCondition }
  | { type: 'season'; value: SeasonCondition }
  | { type: 'leadtime'; value: LeadTimeCondition }
  | { type: 'occupancy'; value: OccupancyCondition };

export interface PricingRule {
  id: string;
  type: PricingRuleType;
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
