import { describe, expect, it } from 'vitest';

import { averageRating, reviewsForRoom } from '@/lib/services/review';

import type { GuestReview } from '@/types';

const makeReview = (overrides: Partial<GuestReview> & { id: string }): GuestReview => ({
  reservationId: 'res-test',
  roomId: 'room-tsuki',
  guestName: 'Test Guest',
  rating: 5,
  comment: 'Great stay!',
  createdAt: '2025-01-01',
  ...overrides,
});

describe('averageRating', () => {
  it('returns 0 for an empty array', () => {
    expect(averageRating([])).toBe(0);
  });

  it('returns the rating for a single review', () => {
    expect(averageRating([makeReview({ id: 'r1', rating: 4 })])).toBe(4.0);
  });

  it('computes the correct 1-decimal average for three reviews', () => {
    const reviews: GuestReview[] = [
      makeReview({ id: 'r1', rating: 5 }),
      makeReview({ id: 'r2', rating: 4 }),
      makeReview({ id: 'r3', rating: 3 }),
    ];
    // (5 + 4 + 3) / 3 = 4.0
    expect(averageRating(reviews)).toBe(4.0);
  });

  it('rounds to 1 decimal place', () => {
    const reviews: GuestReview[] = [
      makeReview({ id: 'r1', rating: 5 }),
      makeReview({ id: 'r2', rating: 4 }),
      makeReview({ id: 'r3', rating: 4 }),
    ];
    // (5 + 4 + 4) / 3 = 4.333... → rounds to 4.3
    expect(averageRating(reviews)).toBe(4.3);
  });
});

describe('reviewsForRoom', () => {
  const allReviews: GuestReview[] = [
    makeReview({ id: 'r1', roomId: 'room-tsuki', createdAt: '2025-06-01' }),
    makeReview({ id: 'r2', roomId: 'room-hoshi', createdAt: '2025-07-01' }),
    makeReview({ id: 'r3', roomId: 'room-tsuki', createdAt: '2025-08-01' }),
    makeReview({ id: 'r4', roomId: 'room-tsuki', createdAt: '2025-05-01' }),
  ];

  it('filters to the correct room only', () => {
    const result = reviewsForRoom(allReviews, 'room-tsuki');
    expect(result.every((r) => r.roomId === 'room-tsuki')).toBe(true);
    expect(result).toHaveLength(3);
  });

  it('excludes reviews for other rooms', () => {
    const result = reviewsForRoom(allReviews, 'room-hoshi');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('r2');
  });

  it('sorts newest-first (descending createdAt)', () => {
    const result = reviewsForRoom(allReviews, 'room-tsuki');
    expect(result.map((r) => r.createdAt)).toEqual(['2025-08-01', '2025-06-01', '2025-05-01']);
  });

  it('returns empty array when no reviews match', () => {
    const result = reviewsForRoom(allReviews, 'room-kaze');
    expect(result).toEqual([]);
  });
});
