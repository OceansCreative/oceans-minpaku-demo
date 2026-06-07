'use client';

import { useTranslations } from 'next-intl';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

interface WishlistButtonProps {
  roomId: string;
  className?: string;
}

/**
 * Heart toggle button that saves/removes a room from the wishlist.
 * Works inside a `<Link>` — clicks are stopped from propagating.
 */
export function WishlistButton({ roomId, className }: WishlistButtonProps) {
  const isWishlisted = useAppStore((s) => s.isWishlisted(roomId));
  const toggleWishlist = useAppStore((s) => s.toggleWishlist);
  const t = useTranslations('wishlist');

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(roomId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isWishlisted ? t('remove') : t('add')}
      title={isWishlisted ? t('remove') : t('add')}
      className={cn(
        'flex items-center justify-center rounded-full bg-white/80 p-1.5 shadow-sm backdrop-blur-sm transition-transform duration-150 hover:bg-white active:scale-90 dark:bg-gray-800/80 dark:hover:bg-gray-800',
        className,
      )}
    >
      {isWishlisted ? (
        <span aria-hidden className="text-lg leading-none text-red-500">
          ♥
        </span>
      ) : (
        <span aria-hidden className="text-lg leading-none text-ink/40 dark:text-gray-500">
          ♡
        </span>
      )}
    </button>
  );
}
