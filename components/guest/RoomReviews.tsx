'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { averageRating, reviewsForRoom } from '@/lib/services/review';
import { useAppStore } from '@/lib/store';

import { StarRating } from './StarRating';

const MAX_SHOWN = 5;

interface RoomReviewsProps {
  roomId: string;
}

export function RoomReviews({ roomId }: RoomReviewsProps) {
  const t = useTranslations('review');
  const reviews = useAppStore((s) => s.reviews);
  const roomReviews = reviewsForRoom(reviews, roomId);
  const avg = averageRating(roomReviews);

  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? roomReviews : roomReviews.slice(0, MAX_SHOWN);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-lg text-ink">{t('title')}</h2>
        {roomReviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={avg} size="sm" />
            <span className="text-sm font-medium text-ink">{avg.toFixed(1)}</span>
            <span className="text-sm text-ink/50">{t('count', { count: roomReviews.length })}</span>
          </div>
        )}
      </div>

      {roomReviews.length === 0 ? (
        <p className="text-sm text-ink/50">{t('no_reviews')}</p>
      ) : (
        <>
          <ul className="space-y-4">
            {displayed.map((review) => (
              <li key={review.id} className="rounded-xl border border-ink/10 bg-sand/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-ink">{review.guestName}</p>
                    <p className="text-xs text-ink/40">{review.createdAt}</p>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink/80">{review.comment}</p>
              </li>
            ))}
          </ul>

          {roomReviews.length > MAX_SHOWN && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-sm text-moss underline hover:text-ink"
            >
              {t('show_more')}
            </button>
          )}
        </>
      )}
    </section>
  );
}
