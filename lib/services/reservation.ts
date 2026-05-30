/**
 * Reservation service. Wraps the mock external APIs (Stripe + RemoteLOCK) so the
 * UI never imports them directly. Functions are pure where possible — the only
 * side effects are the simulated network calls inside the mocks.
 *
 * Callers are expected to write the returned `Reservation` (and intent/passcode)
 * back to the Zustand store themselves; this keeps the service stateless and
 * trivially testable.
 */

import { issueCode, revokeCode, type RevokedPasscode } from '@/lib/mock/remotelock';
import {
  cancelPaymentIntent,
  capturePaymentIntent,
  createPaymentIntent,
  refundPaymentIntent,
  type MockPaymentIntent,
  type MockRefund,
} from '@/lib/mock/stripe';

import type { HHmm, IsoDate, IsoDateTime, Passcode, Reservation, ReservationSource } from '@/types';

// ---------- Pure helpers ----------

export interface OverlapCandidate {
  roomId: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  /** When verifying an EXISTING reservation, pass its id so we don't flag self-overlap. */
  ignoreId?: string;
}

/**
 * Return reservations from `existing` that conflict with `candidate` on the same room.
 *
 * - Cancelled and rejected reservations never conflict (they free the slot).
 * - The interval is `[checkIn, checkOut)` — checkout day is free for the next guest.
 */
export function detectOverlap(existing: Reservation[], candidate: OverlapCandidate): Reservation[] {
  const candidateStart = candidate.checkIn;
  const candidateEnd = candidate.checkOut;
  if (candidateEnd <= candidateStart) {
    throw new Error('detectOverlap: candidate.checkOut must be after candidate.checkIn');
  }

  return existing.filter((r) => {
    if (r.id === candidate.ignoreId) return false;
    if (r.roomId !== candidate.roomId) return false;
    if (r.status === 'cancelled' || r.status === 'rejected') return false;
    // Overlap iff intervals share any inner day.
    return r.checkIn < candidateEnd && candidateStart < r.checkOut;
  });
}

// ---------- Orchestration ----------

export interface RequestReservationInput {
  roomId: string;
  guestId: string;
  parkingSlotId?: string;
  checkIn: IsoDate;
  checkOut: IsoDate;
  checkInTime: HHmm;
  checkOutTime: HHmm;
  amount: number;
  depositHeld?: number;
  source: ReservationSource;
}

function reservationId(): string {
  return `res-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Authorize payment and build a `pending` reservation. The caller writes the result
 * to the store. Throws if an existing reservation already covers the requested window.
 */
export async function requestReservation(
  input: RequestReservationInput,
  existing: Reservation[],
): Promise<Reservation> {
  const conflicts = detectOverlap(existing, {
    roomId: input.roomId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });
  if (conflicts.length > 0) {
    throw new Error(
      `requestReservation: room ${input.roomId} already booked for ${input.checkIn}..${input.checkOut}`,
    );
  }
  const intent = await createPaymentIntent({
    amount: input.amount,
    depositHeld: input.depositHeld,
    metadata: { roomId: input.roomId, source: input.source },
  });

  const now: IsoDateTime = new Date().toISOString();
  return {
    id: reservationId(),
    roomId: input.roomId,
    parkingSlotId: input.parkingSlotId,
    guestId: input.guestId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    checkInTime: input.checkInTime,
    checkOutTime: input.checkOutTime,
    status: 'pending',
    source: input.source,
    amount: input.amount,
    payment: {
      intentId: intent.id,
      status: intent.status,
      depositHeld: intent.depositHeld,
    },
    createdAt: now,
  };
}

export interface ApproveReservationResult {
  reservation: Reservation;
  intent: MockPaymentIntent;
  passcode: Passcode;
}

/**
 * Approve a pending reservation: capture the payment, issue a RemoteLOCK code,
 * and return the updated reservation. Re-checks for overlap to guard against the
 * Airbnb iCal race window (SPEC §13).
 */
export async function approveReservation(
  reservation: Reservation,
  existing: Reservation[],
  /** Echoes back the original mock intent so we can transition `authorized` → `captured`. */
  intent: MockPaymentIntent,
): Promise<ApproveReservationResult> {
  if (reservation.status !== 'pending') {
    throw new Error(`approveReservation: expected status 'pending', got '${reservation.status}'`);
  }
  const conflicts = detectOverlap(existing, {
    roomId: reservation.roomId,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    ignoreId: reservation.id,
  });
  if (conflicts.length > 0) {
    throw new Error(
      `approveReservation: cannot approve — ${conflicts.length} conflict(s) on room ${reservation.roomId}`,
    );
  }

  const captured = await capturePaymentIntent({ intent });
  const passcode = await issueCode({
    validFrom: `${reservation.checkIn}T${reservation.checkInTime}:00.000Z`,
    validUntil: `${reservation.checkOut}T${reservation.checkOutTime}:00.000Z`,
  });

  return {
    reservation: {
      ...reservation,
      status: 'approved',
      payment: {
        ...reservation.payment,
        status: captured.status,
      },
      passcode,
    },
    intent: captured,
    passcode,
  };
}

export interface RejectReservationResult {
  reservation: Reservation;
  intent: MockPaymentIntent;
}

export async function rejectReservation(
  reservation: Reservation,
  intent: MockPaymentIntent,
): Promise<RejectReservationResult> {
  if (reservation.status !== 'pending') {
    throw new Error(`rejectReservation: expected status 'pending', got '${reservation.status}'`);
  }
  const released = await cancelPaymentIntent({ intent });
  return {
    reservation: {
      ...reservation,
      status: 'rejected',
      payment: { ...reservation.payment, status: released.status },
    },
    intent: released,
  };
}

export interface CancelReservationInput {
  reservation: Reservation;
  intent: MockPaymentIntent;
  /** Pre-computed cancellation fee in JPY (use pricing service). */
  cancellationFee: number;
}

export interface CancelReservationResult {
  reservation: Reservation;
  intent: MockPaymentIntent;
  refund: MockRefund;
  revokedPasscode?: RevokedPasscode;
}

/**
 * Cancel an approved reservation: refund the captured amount minus the cancellation
 * fee, revoke the smart-lock passcode if one was issued.
 */
export async function cancelReservation(
  input: CancelReservationInput,
): Promise<CancelReservationResult> {
  if (input.reservation.status !== 'approved') {
    throw new Error(
      `cancelReservation: expected status 'approved', got '${input.reservation.status}'`,
    );
  }
  if (input.intent.status !== 'captured') {
    throw new Error(
      `cancelReservation: payment intent must be captured before refund (got '${input.intent.status}')`,
    );
  }
  const refundAmount = Math.max(0, input.reservation.amount - input.cancellationFee);
  const { intent: refundedIntent, refund } = await refundPaymentIntent({
    intent: input.intent,
    amount: refundAmount,
  });

  let revokedPasscode: RevokedPasscode | undefined;
  if (input.reservation.passcode) {
    revokedPasscode = await revokeCode({ passcode: input.reservation.passcode });
  }

  return {
    reservation: {
      ...input.reservation,
      status: 'cancelled',
      payment: { ...input.reservation.payment, status: refundedIntent.status },
      passcode: undefined,
    },
    intent: refundedIntent,
    refund,
    revokedPasscode,
  };
}
