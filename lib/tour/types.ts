/**
 * Self-tour step. Real step content is registered in Phase 10 by the pages
 * involved; this framework just owns the state machine.
 */
export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** Optional CTA label — clicking advances to the next step. Defaults to「次へ」. */
  ctaLabel?: string;
  /**
   * Optional href to navigate to before showing this step. Used to walk the user
   * across pages (guest → admin → calendar).
   */
  navigateTo?: string;
}

export interface TourState {
  steps: TourStep[];
  activeStepIndex: number | null;
  isActive: boolean;
}
