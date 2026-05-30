// ===== MOCK: 本番では実API（RemoteLOCK Connect API）に差し替え =====
//
// Stay-scoped numeric passcodes that auto-expire at check-out. Issued on host
// approval, reissued on guest request, revoked on cancellation.
// The real API also tracks lock IDs, schedules, and unlock events — we only model
// what the demo UI needs.

import type { IsoDateTime, Passcode } from '@/types';

const LATENCY_MIN_MS = 300;
const LATENCY_MAX_MS = 800;
const CODE_LENGTH = 6;

async function simulateLatency(): Promise<void> {
  const ms = LATENCY_MIN_MS + Math.random() * (LATENCY_MAX_MS - LATENCY_MIN_MS);
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export interface IssueCodeInput {
  /** ISO datetime when the passcode starts being valid (usually check-in time). */
  validFrom: IsoDateTime;
  /** ISO datetime when the passcode expires (usually check-out time). */
  validUntil: IsoDateTime;
}

export interface RevokeCodeInput {
  passcode: Passcode;
  /** ISO datetime when the revoke takes effect. Defaults to now. */
  revokedAt?: IsoDateTime;
}

/**
 * Issue a new passcode for the given stay window.
 * The real API would push the code to the physical lock; here we just generate
 * a 6-digit random code and stamp the validity window.
 */
export async function issueCode({ validFrom, validUntil }: IssueCodeInput): Promise<Passcode> {
  if (new Date(validUntil) <= new Date(validFrom)) {
    throw new Error('issueCode: validUntil must be after validFrom');
  }
  await simulateLatency();
  return {
    code: generateCode(),
    validFrom,
    validUntil,
    issuedAt: new Date().toISOString(),
  };
}

/**
 * Reissue (rotate) a passcode for the same stay window.
 * Use case: the guest forgot their code or we suspect a leak.
 */
export async function reissueCode({ validFrom, validUntil }: IssueCodeInput): Promise<Passcode> {
  return issueCode({ validFrom, validUntil });
}

export interface RevokedPasscode extends Passcode {
  revokedAt: IsoDateTime;
}

/**
 * Revoke a passcode immediately. Used when a reservation is cancelled before the
 * stay window. The returned object carries a `revokedAt` for the audit trail.
 */
export async function revokeCode({
  passcode,
  revokedAt,
}: RevokeCodeInput): Promise<RevokedPasscode> {
  await simulateLatency();
  return {
    ...passcode,
    revokedAt: revokedAt ?? new Date().toISOString(),
  };
}
