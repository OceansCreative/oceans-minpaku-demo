import type { IsoDateTime } from './common';

export type MessageSender = 'admin' | 'guest';

export interface Message {
  id: string;
  reservationId: string;
  from: MessageSender;
  text: string;
  createdAt: IsoDateTime;
}

export type ReminderChannel = 'email' | 'message';

/**
 * Reminder template. `offset` is a signed ISO 8601 duration relative to check-in
 * (e.g. `-P1D` = one day before check-in, `PT0S` = at check-in time).
 */
export interface ReminderTemplate {
  id: string;
  name: string;
  offset: string;
  channel: ReminderChannel;
  subject: string;
  body: string;
  enabled: boolean;
}
