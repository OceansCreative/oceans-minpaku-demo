import type { HHmm, IsoDate, IsoDateTime, ReservationSource } from './common';

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/**
 * Stripe-side payment intent state, mirrored locally for UI without a backend round-trip.
 * `authorized` → `captured` on host approval; `released` on rejection; `refunded` on cancellation.
 */
export type PaymentStatus = 'authorized' | 'captured' | 'released' | 'refunded';

export interface ReservationPayment {
  intentId: string;
  status: PaymentStatus;
  /** Yen held as a security deposit, separate from the room amount. */
  depositHeld?: number;
}

/**
 * Stay-scoped numeric passcode for the smart lock.
 * Issued on approval (RemoteLOCK mock), expires at check-out.
 */
export interface Passcode {
  code: string;
  validFrom: IsoDateTime;
  validUntil: IsoDateTime;
  issuedAt: IsoDateTime;
}

export interface Reservation {
  id: string;
  roomId: string;
  parkingSlotId?: string;
  guestId: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  checkInTime: HHmm;
  checkOutTime: HHmm;
  status: ReservationStatus;
  source: ReservationSource;
  /** Total amount in JPY (room amount; deposit lives in payment.depositHeld). */
  amount: number;
  payment: ReservationPayment;
  passcode?: Passcode;
  createdAt: IsoDateTime;
}
