'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

interface ReviewFormProps {
  reservationId: string;
  roomId: string;
  guestName: string;
  onSubmitted: () => void;
}

export function ReviewForm({ reservationId, roomId, guestName, onSubmitted }: ReviewFormProps) {
  const t = useTranslations('review');
  const submitReview = useAppStore((s) => s.submitReview);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  function validate(): boolean {
    const next: { rating?: string; comment?: string } = {};
    if (rating === 0) next.rating = t('validation_rating');
    if (comment.length < 10) next.comment = t('validation_comment');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    submitReview({ reservationId, roomId, guestName, rating, comment });
    onSubmitted();
  }

  const displayRating = hovered > 0 ? hovered : rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-ink">{t('rating_label')}</label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} stars`}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(value)}
                className={cn(
                  'text-2xl transition-colors',
                  value <= displayRating ? 'text-yellow-400' : 'text-gray-300',
                )}
              >
                ★
              </button>
            );
          })}
        </div>
        {errors.rating && <p className="text-xs text-red-500">{errors.rating}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="review-comment" className="text-sm font-medium text-ink">
          {t('comment_label')}
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('comment_placeholder')}
          rows={4}
          className="w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
        />
        {errors.comment && <p className="text-xs text-red-500">{errors.comment}</p>}
      </div>

      <button
        type="submit"
        className="rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-sand transition-colors hover:bg-ink/90"
      >
        {t('submit')}
      </button>
    </form>
  );
}
