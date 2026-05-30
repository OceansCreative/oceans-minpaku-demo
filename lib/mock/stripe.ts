// ===== MOCK: 本番では実API（Stripe PaymentIntents）に差し替え =====
//
// Approval-based flow: authorize on guest request → capture on host approval
// (manual capture). Decline path releases the authorization; cancellation issues
// a refund (capture/cancel/refund are added in the next commit).

import type { PaymentStatus } from '@/types';

const LATENCY_MIN_MS = 300;
const LATENCY_MAX_MS = 800;

async function simulateLatency(): Promise<void> {
  const ms = LATENCY_MIN_MS + Math.random() * (LATENCY_MAX_MS - LATENCY_MIN_MS);
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mockIntentId(): string {
  return `pi_mock_${Math.random().toString(36).slice(2, 10)}`;
}

export interface CreatePaymentIntentInput {
  /** JPY, integer. */
  amount: number;
  /** Optional security deposit held alongside the room amount (JPY). */
  depositHeld?: number;
  metadata?: Record<string, string>;
}

export interface MockPaymentIntent {
  id: string;
  status: PaymentStatus;
  amount: number;
  depositHeld?: number;
  metadata: Record<string, string>;
  createdAt: string;
}

/**
 * Authorize a payment for `amount` JPY without capturing.
 * Resolves to a `MockPaymentIntent` in `authorized` state after a simulated network hop.
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<MockPaymentIntent> {
  await simulateLatency();
  return {
    id: mockIntentId(),
    status: 'authorized',
    amount: input.amount,
    depositHeld: input.depositHeld,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  };
}

export interface CapturePaymentIntentInput {
  intent: MockPaymentIntent;
}

/** Capture a previously-authorized intent (host approved the reservation). */
export async function capturePaymentIntent({
  intent,
}: CapturePaymentIntentInput): Promise<MockPaymentIntent> {
  if (intent.status !== 'authorized') {
    throw new Error(
      `capturePaymentIntent: expected status 'authorized', got '${intent.status}' for ${intent.id}`,
    );
  }
  await simulateLatency();
  return { ...intent, status: 'captured' };
}

/** Cancel (release) an authorization without capturing — host rejected the reservation. */
export async function cancelPaymentIntent({
  intent,
}: CapturePaymentIntentInput): Promise<MockPaymentIntent> {
  if (intent.status !== 'authorized') {
    throw new Error(
      `cancelPaymentIntent: expected status 'authorized', got '${intent.status}' for ${intent.id}`,
    );
  }
  await simulateLatency();
  return { ...intent, status: 'released' };
}

export interface RefundPaymentIntentInput {
  intent: MockPaymentIntent;
  /**
   * JPY to refund. Defaults to the full amount.
   * Pass less than `intent.amount` for a partial refund (e.g. cancellation policy keeps a deposit).
   */
  amount?: number;
}

export interface MockRefund {
  id: string;
  intentId: string;
  amount: number;
  /** Portion retained as a cancellation fee (intent.amount − refund.amount). */
  retained: number;
  createdAt: string;
}

/**
 * Refund a captured intent. Supports partial refunds so the cancellation flow can
 * retain a deposit per `CancellationPolicy.depositRate`.
 */
export async function refundPaymentIntent({
  intent,
  amount,
}: RefundPaymentIntentInput): Promise<{ intent: MockPaymentIntent; refund: MockRefund }> {
  if (intent.status !== 'captured') {
    throw new Error(
      `refundPaymentIntent: expected status 'captured', got '${intent.status}' for ${intent.id}`,
    );
  }
  const refundAmount = amount ?? intent.amount;
  if (refundAmount < 0 || refundAmount > intent.amount) {
    throw new Error(
      `refundPaymentIntent: amount ${refundAmount} out of range for intent ${intent.id} (max ${intent.amount})`,
    );
  }
  await simulateLatency();
  const refund: MockRefund = {
    id: `re_mock_${Math.random().toString(36).slice(2, 10)}`,
    intentId: intent.id,
    amount: refundAmount,
    retained: intent.amount - refundAmount,
    createdAt: new Date().toISOString(),
  };
  return {
    intent: { ...intent, status: 'refunded' },
    refund,
  };
}
