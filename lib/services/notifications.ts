/**
 * Notification service. Pure functions — no store access, no I/O.
 *
 * Derives in-app notifications from the current reservation set so the
 * admin bell always reflects real state without a separate notification log.
 */
import type { IsoDate, Reservation } from '@/types';
import type { AppNotification, NotificationKind } from '@/types/notification';

function makeNotif(
  reservationId: string,
  kind: NotificationKind,
  title: string,
  body: string,
  createdAt: string,
): AppNotification {
  return {
    id: `notif-${reservationId}-${kind}`,
    kind,
    title,
    body,
    reservationId,
    createdAt,
    read: false,
  };
}

/**
 * Build a list of `AppNotification` items derived from the given reservations.
 *
 * Rules (one pass per reservation):
 * - `pending`   → `new_reservation`
 * - `cancelled` → `cancellation`
 * - `approved` + `checkIn === today`  → `checkin_today`
 * - `approved` + `checkOut === today` → `checkout_today`
 *
 * Result is sorted by `createdAt` descending (newest first).
 * Each `id` is `notif-${reservationId}-${kind}` — deterministic so seeding is
 * idempotent.
 */
export function buildNotificationsFromReservations(
  reservations: Reservation[],
  today: IsoDate,
): AppNotification[] {
  const notifs: AppNotification[] = [];

  for (const r of reservations) {
    if (r.status === 'pending') {
      notifs.push(makeNotif(r.id, 'new_reservation', 'new_reservation', r.id, r.createdAt));
    }

    if (r.status === 'cancelled') {
      notifs.push(makeNotif(r.id, 'cancellation', 'cancellation', r.id, r.createdAt));
    }

    if (r.status === 'approved') {
      if (r.checkIn === today) {
        notifs.push(makeNotif(r.id, 'checkin_today', 'checkin_today', r.id, r.createdAt));
      }
      if (r.checkOut === today) {
        notifs.push(makeNotif(r.id, 'checkout_today', 'checkout_today', r.id, r.createdAt));
      }
    }
  }

  // Sort descending by createdAt (ISO string comparison is lexicographically correct).
  notifs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return notifs;
}
