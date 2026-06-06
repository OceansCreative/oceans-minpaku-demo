'use client';

import { useTranslations } from 'next-intl';

import { StarRating } from '@/components/guest/StarRating';
import { useAppStore } from '@/lib/store';

const MAX_COMMENT_LENGTH = 80;

export default function AdminReviewsPage() {
  const t = useTranslations('review');
  const reviews = useAppStore((s) => s.reviews);
  const rooms = useAppStore((s) => s.rooms);

  const sorted = [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function roomName(roomId: string): string {
    return rooms.find((r) => r.id === roomId)?.name ?? roomId;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">{t('admin_title')}</h1>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-ink/50">{t('no_reviews')}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink/10">
          <table className="min-w-full text-sm">
            <thead className="bg-ink/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                  {t('col_room')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                  {t('col_guest')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                  {t('col_date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                  {t('col_rating')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink/50">
                  {t('col_comment')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {sorted.map((review) => (
                <tr key={review.id} className="hover:bg-ink/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 text-ink">
                    {roomName(review.roomId)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink">{review.guestName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/60">{review.createdAt}</td>
                  <td className="px-4 py-3">
                    <StarRating rating={review.rating} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-ink/70">
                    {review.comment.length > MAX_COMMENT_LENGTH
                      ? `${review.comment.slice(0, MAX_COMMENT_LENGTH)}…`
                      : review.comment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
