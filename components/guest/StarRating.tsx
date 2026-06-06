interface StarRatingProps {
  rating: number; // 0-5
  size?: 'sm' | 'md';
}

export function StarRating({ rating, size = 'md' }: StarRatingProps) {
  const filled = Math.floor(rating);
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <span
      aria-label={`${rating} out of 5 stars`}
      className={`inline-flex items-center gap-0.5 ${sizeClass}`}
      role="img"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < filled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
        >
          ★
        </span>
      ))}
    </span>
  );
}
