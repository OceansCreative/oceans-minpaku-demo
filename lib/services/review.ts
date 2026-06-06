/**
 * Review service. Pure functions — no store access, no I/O.
 */
import type { GuestReview } from '@/types';

/**
 * Compute the average rating for a set of reviews.
 *
 * Returns 0 when the array is empty; otherwise returns the mean rounded to
 * 1 decimal place.
 */
export function averageRating(reviews: GuestReview[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Return reviews for a given room, sorted newest-first (descending `createdAt`).
 */
export function reviewsForRoom(reviews: GuestReview[], roomId: string): GuestReview[] {
  return reviews
    .filter((r) => r.roomId === roomId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
