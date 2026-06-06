import { seedReviews } from '@/lib/seed/reviews';
import { toIsoDate } from '@/lib/utils/dates';

import type { SliceCreator } from './types';
import type { GuestReview } from '@/types';

export interface ReviewSlice {
  reviews: GuestReview[];
  submitReview: (review: Omit<GuestReview, 'id' | 'createdAt'>) => void;
  resetReviewSlice: () => void;
}

export const createReviewSlice: SliceCreator<ReviewSlice> = (set) => ({
  reviews: seedReviews,

  submitReview: (review) =>
    set((state) => ({
      reviews: [
        ...state.reviews,
        {
          ...review,
          id: crypto.randomUUID(),
          createdAt: toIsoDate(new Date()),
        },
      ],
    })),

  resetReviewSlice: () => set({ reviews: seedReviews }),
});
