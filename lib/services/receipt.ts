import { nightsBetween } from '@/lib/utils/dates';

import type { Reservation } from '@/types';
import type { IsoDate } from '@/types/common';

/** Japanese consumption-tax rate the stay total is treated as inclusive of. */
export const DEFAULT_TAX_RATE = 0.1;

export interface ReceiptInput {
  roomName: string;
  guestName: string;
  /** Date the receipt is issued (the day it is printed), `YYYY-MM-DD`. */
  issuedOn: IsoDate;
  /** Override the inclusive consumption-tax rate (defaults to {@link DEFAULT_TAX_RATE}). */
  taxRate?: number;
}

export interface Receipt {
  /** Stable, human-readable document number derived from the issue date + id. */
  receiptNo: string;
  issuedOn: IsoDate;
  guestName: string;
  roomName: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  nights: number;
  /** Total ÷ nights, rounded. Falls back to the total for same-day stays. */
  nightlyAverage: number;
  /** Tax-exclusive portion of the total. */
  net: number;
  /** Consumption tax already baked into the total. */
  tax: number;
  taxRate: number;
  /** Grand total charged for the stay (equals `reservation.amount`). */
  total: number;
  /** Refundable security deposit held separately from the stay charge, if any. */
  deposit: number;
  paymentStatus: Reservation['payment']['status'];
}

type ReceiptReservation = Pick<Reservation, 'id' | 'checkIn' | 'checkOut' | 'amount' | 'payment'>;

/**
 * Derive a tax-inclusive payment receipt for a stay. Pure: the issue date and
 * the display names are passed in rather than read from the clock or the store,
 * so the same reservation always renders the same document for a given day.
 *
 * The stay total is treated as **tax-inclusive** (Japanese 税込 convention):
 * `tax = round(total × rate / (1 + rate))`, `net = total − tax`.
 */
export function buildReceipt(reservation: ReceiptReservation, input: ReceiptInput): Receipt {
  const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
  const total = reservation.amount;
  const tax = Math.round((total * taxRate) / (1 + taxRate));
  const net = total - tax;
  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
  const nightlyAverage = nights > 0 ? Math.round(total / nights) : total;
  const ref = reservation.id.slice(-6).toUpperCase();

  return {
    receiptNo: `R-${input.issuedOn.replace(/-/g, '')}-${ref}`,
    issuedOn: input.issuedOn,
    guestName: input.guestName,
    roomName: input.roomName,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    nights,
    nightlyAverage,
    net,
    tax,
    taxRate,
    total,
    deposit: reservation.payment.depositHeld ?? 0,
    paymentStatus: reservation.payment.status,
  };
}
