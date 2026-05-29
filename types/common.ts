/**
 * ISO 8601 date string in `YYYY-MM-DD` form (no time component).
 * Used for stay-day boundaries (check-in / check-out, policy windows).
 */
export type IsoDate = string;

/**
 * ISO 8601 datetime string with timezone offset.
 * Used for created-at / issued-at / sync-at timestamps.
 */
export type IsoDateTime = string;

/** HH:mm 24-hour clock time. Used for check-in / check-out time of day. */
export type HHmm = string;

/** Two-letter ISO 639-1 language code. */
export type LanguageCode = 'ja' | 'en' | 'zh' | 'ko';

/** Discriminator for the booking origin — drives calendar coloring and OTA-lag warnings. */
export type ReservationSource = 'direct' | 'airbnb';
