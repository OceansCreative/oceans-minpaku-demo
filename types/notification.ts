import type { IsoDateTime } from './common';

export type NotificationKind =
  | 'new_reservation'
  | 'cancellation'
  | 'checkin_today'
  | 'checkout_today'
  | 'review_posted';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  reservationId?: string;
  createdAt: IsoDateTime;
  read: boolean;
}
