'use client';

import { useTranslations } from 'next-intl';

import { averageRating, reviewsForRoom } from '@/lib/services/review';
import { useAppStore } from '@/lib/store';

import { StarRating } from './StarRating';

interface RoomRatingBadgeProps {
  roomId: string;
}

export function RoomRatingBadge({ roomId }: RoomRatingBadgeProps) {
  const t = useTranslations('review');
  const reviews = useAppStore((s) => s.reviews);
  const roomReviews = reviewsForRoom(reviews, roomId);

  if (roomReviews.length === 0) return null;

  const avg = averageRating(roomReviews);

  return (
    <span className="inline-flex items-center gap-1">
      <StarRating rating={avg} size="sm" />
      <span className="text-xs font-medium text-ink">{avg.toFixed(1)}</span>
      <span className="text-xs text-ink/50">{t('count', { count: roomReviews.length })}</span>
    </span>
  );
}
