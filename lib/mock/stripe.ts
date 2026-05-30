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
