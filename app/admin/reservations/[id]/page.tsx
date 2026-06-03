'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { calculateCancellationFee } from '@/lib/services/pricing';
import {
  approveReservation,
  cancelReservation,
  detectOverlap,
  rejectReservation,
} from '@/lib/services/reservation';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { MockPaymentIntent } from '@/lib/mock/stripe';
import type { CancellationPolicy, Reservation } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminReservationDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const reservation = useAppStore((s) => s.reservations.find((r) => r.id === id));
  const room = useAppStore((s) =>
    reservation ? s.rooms.find((rm) => rm.id === reservation.roomId) : undefined,
  );
  const guest = useAppStore((s) =>
    reservation ? s.guests.find((g) => g.id === reservation.guestId) : undefined,
  );
  const allReservations = useAppStore((s) => s.reservations);
  const upsertReservation = useAppStore((s) => s.upsertReservation);
  const cancellationPolicy = useAppStore((s) => s.cancellationPolicy);
  const t = useTranslations('Admin');

  const [busy, setBusy] = useState<'approve' | 'reject' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!reservation || !room) {
    return <p className="text-sm text-ink/60">{t('reservationNotFound')}</p>;
  }

  const conflicts = detectOverlap(allReservations, {
    roomId: reservation.roomId,
    checkIn: reservation.checkIn,
    checkOut: reservation.checkOut,
    ignoreId: reservation.id,
  });

  async function handleApprove() {
    if (!reservation) return;
    setBusy('approve');
    setError(null);
    try {
      const intent: MockPaymentIntent = {
        id: reservation.payment.intentId,
        status: reservation.payment.status,
        amount: reservation.amount,
        depositHeld: reservation.payment.depositHeld,
        metadata: {},
        createdAt: reservation.createdAt,
      };
      const result = await approveReservation(reservation, allReservations, intent);
      upsertReservation(result.reservation);
      toast.success(t('approveSuccess'), {
        description: t('approveSuccessDesc', {
          amount: reservation.amount.toLocaleString(),
          code: result.passcode.code,
        }),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : t('approveError');
      setError(message);
      toast.error(t('approveError'), { description: message });
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!reservation) return;
    setShowCancelConfirm(false);
    setBusy('cancel');
    setError(null);
    try {
      const fee = calculateCancellationFee({
        amount: reservation.amount,
        checkInDate: reservation.checkIn,
        cancelledAt: new Date(),
        policy: cancellationPolicy,
      });
      const intent: MockPaymentIntent = {
        id: reservation.payment.intentId,
        status: 'captured',
        amount: reservation.amount,
        depositHeld: reservation.payment.depositHeld,
        metadata: {},
        createdAt: reservation.createdAt,
      };
      const result = await cancelReservation({
        reservation,
        intent,
        cancellationFee: fee.feeAmount,
      });
      upsertReservation(result.reservation);
      toast.success(t('cancelSuccess'), {
        description: t('cancelSuccessDesc', {
          refund: result.refund.amount.toLocaleString(),
          fee: fee.feeAmount.toLocaleString(),
        }),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : t('cancelError');
      setError(message);
      toast.error(t('cancelError'), { description: message });
    } finally {
      setBusy(null);
    }
  }

  async function handleReject() {
    if (!reservation) return;
    setBusy('reject');
    setError(null);
    try {
      const intent: MockPaymentIntent = {
        id: reservation.payment.intentId,
        status: reservation.payment.status,
        amount: reservation.amount,
        depositHeld: reservation.payment.depositHeld,
        metadata: {},
        createdAt: reservation.createdAt,
      };
      const result = await rejectReservation(reservation, intent);
      upsertReservation(result.reservation);
      toast.success(t('rejectSuccess'), {
        description: t('rejectSuccessDesc'),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : t('rejectError');
      setError(message);
      toast.error(t('rejectError'), { description: message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/reservations"
        className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t('backToReservations')}
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">
            {t('reservationOf', { room: room.name })}
          </h1>
          <p className="text-sm text-ink/50">{guest?.name ?? t('guestUnknown')}</p>
        </div>
        <span className="rounded-full bg-ink/[0.04] px-3 py-1 text-xs text-ink/70">
          {reservation.id}
        </span>
      </header>

      {conflicts.length > 0 && reservation.status === 'pending' && (
        <ConflictWarning conflicts={conflicts} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card title={t('cardSchedule')}>
          <Row label={t('rowCheckIn')}>
            {reservation.checkIn} {reservation.checkInTime}
          </Row>
          <Row label={t('rowCheckOut')}>
            {reservation.checkOut} {reservation.checkOutTime}
          </Row>
          <Row label={t('rowSource')}>{reservation.source}</Row>
        </Card>
        <Card title={t('cardPayment')}>
          <Row label={t('rowAmount')}>¥{reservation.amount.toLocaleString()}</Row>
          <Row label={t('rowPaymentStatus')}>{reservation.payment.status}</Row>
          <Row label={t('rowIntent')}>
            <code className="text-[11px]">{reservation.payment.intentId}</code>
          </Row>
        </Card>
        <Card title={t('cardGuest')}>
          <Row label={t('rowName')}>{guest?.name ?? '—'}</Row>
          <Row label={t('rowEmail')}>{guest?.email ?? '—'}</Row>
          <Row label={t('rowPhone')}>{guest?.phone ?? '—'}</Row>
        </Card>
        <Card title={t('cardStatus')}>
          <Row label={t('rowCurrent')}>{reservation.status}</Row>
        </Card>
        <Card title={t('cardSmartLock')}>
          {reservation.passcode ? (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs text-moss">
                <KeyRound className="h-3.5 w-3.5" />
                {t('passcodeIssued')}
              </p>
              <p className="rounded-md bg-ink px-3 py-2 text-center font-mono text-xl tracking-[0.3em] text-sand">
                {reservation.passcode.code}
              </p>
              <p className="text-[10px] text-ink/50">
                {t('passcodeValidRange', {
                  from: reservation.passcode.validFrom.slice(0, 16).replace('T', ' '),
                  until: reservation.passcode.validUntil.slice(0, 16).replace('T', ' '),
                })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink/50">{t('passcodeIssueOnApproval')}</p>
          )}
        </Card>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-crimson/30 bg-crimson/5 px-3 py-2 text-xs text-crimson">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {reservation.status === 'approved' && (
        <CancellationPreview
          reservation={reservation}
          policy={cancellationPolicy}
          onCancel={() => setShowCancelConfirm(true)}
          busy={busy === 'cancel'}
        />
      )}

      {reservation.status === 'pending' && (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-ink/10 bg-sand p-5">
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy !== null || conflicts.length > 0}
            className={cn(
              'inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-sand',
              'transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {busy === 'approve' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {t('approve')}
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={busy !== null}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border border-crimson/40 px-4 py-2 text-sm font-medium text-crimson',
              'transition-colors hover:bg-crimson/10 disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            {busy === 'reject' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {t('reject')}
          </button>
          <p className="ml-auto self-center text-[11px] text-ink/50">{t('approveCaptureHint')}</p>
        </div>
      )}

      {showCancelConfirm && (
        <CancelConfirmDialog
          reservation={reservation}
          policy={cancellationPolicy}
          onConfirm={handleCancel}
          onDismiss={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5">
      <h2 className="font-serif text-xs uppercase tracking-widest text-ink/50">{title}</h2>
      <dl className="space-y-1.5 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink/50">{label}</dt>
      <dd className="truncate text-right text-ink">{children}</dd>
    </div>
  );
}

function CancellationPreview({
  reservation,
  policy,
  onCancel,
  busy,
}: {
  reservation: Reservation;
  policy: CancellationPolicy[];
  onCancel: () => void;
  busy: boolean;
}) {
  const fee = calculateCancellationFee({
    amount: reservation.amount,
    checkInDate: reservation.checkIn,
    cancelledAt: new Date(),
    policy,
  });
  return (
    <div className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5 text-sm">
      <header className="flex items-center gap-2 font-serif text-base text-ink/80">
        <RotateCcw className="h-4 w-4 text-moss" />
        キャンセル・返金プレビュー
      </header>
      <dl className="grid gap-1.5 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-ink/50">チェックインまで</dt>
          <dd className="text-ink">{fee.daysRemaining} 日</dd>
        </div>
        <div>
          <dt className="text-ink/50">適用ステップ</dt>
          <dd className="text-ink">
            {fee.appliedStep
              ? `${fee.appliedStep.id} (${Math.round(fee.appliedStep.depositRate * 100)}%)`
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-ink/50">予定返金額</dt>
          <dd className="text-ink">
            ¥{fee.refundAmount.toLocaleString()}{' '}
            <span className="text-[10px] text-ink/40">
              （差引: ¥{fee.feeAmount.toLocaleString()}）
            </span>
          </dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-md border border-crimson/40 px-4 py-2 text-xs font-medium text-crimson hover:bg-crimson/10 disabled:opacity-40"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        この予約をキャンセル
      </button>
    </div>
  );
}

function CancelConfirmDialog({
  reservation,
  policy,
  onConfirm,
  onDismiss,
}: {
  reservation: Reservation;
  policy: CancellationPolicy[];
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const fee = calculateCancellationFee({
    amount: reservation.amount,
    checkInDate: reservation.checkIn,
    cancelledAt: new Date(),
    policy,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="cancel-dialog-title"
      onClick={onDismiss}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-2xl bg-sand p-6 shadow-2xl"
      >
        <div>
          <h2 id="cancel-dialog-title" className="font-serif text-xl text-ink">
            この予約をキャンセルしますか？
          </h2>
          <p className="mt-1 text-xs text-ink/60">キャンセル後の取り消しはできません。</p>
        </div>
        <dl className="space-y-1.5 rounded-md bg-ink/[0.03] px-4 py-3 text-xs">
          <div className="flex justify-between">
            <dt className="text-ink/50">合計</dt>
            <dd className="text-ink">¥{reservation.amount.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/50">キャンセル料</dt>
            <dd className="text-crimson">- ¥{fee.feeAmount.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-1.5 font-medium">
            <dt className="text-ink">返金</dt>
            <dd className="text-ink">¥{fee.refundAmount.toLocaleString()}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-ink/50">
          Stripe で {fee.refundAmount > 0 ? 'partial refund' : 'no-refund cancel'} を発行し、
          RemoteLOCK のパスコードを失効させます。
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-md px-4 py-2 text-sm text-ink/70 hover:bg-ink/5"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-md bg-crimson px-4 py-2 text-sm font-medium text-sand hover:bg-crimson/90"
          >
            <XCircle className="h-4 w-4" />
            キャンセルを確定
          </button>
        </div>
      </div>
    </div>
  );
}

function ConflictWarning({ conflicts }: { conflicts: Reservation[] }) {
  return (
    <div className="space-y-3 rounded-2xl border-2 border-crimson bg-crimson/5 px-5 py-4 text-sm text-crimson">
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" />
        ダブルブッキングの恐れがあります — 承認は無効化されています
      </p>
      <p className="text-xs">
        この期間には他に <strong>{conflicts.length}</strong> 件の予約があります。
        いずれかをキャンセル / 却下してから再度ご確認ください。
      </p>
      <ul className="space-y-1 text-xs">
        {conflicts.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded bg-sand/70 px-2 py-1.5 text-ink"
          >
            <span>
              <code className="text-[11px] text-crimson">{c.id}</code> · {c.checkIn} → {c.checkOut}{' '}
              · <span className="rounded bg-ink/[0.05] px-1.5 py-0.5 text-[10px]">{c.source}</span>{' '}
              <span className="text-[10px] text-ink/40">/{c.status}</span>
            </span>
            <Link
              href={`/admin/reservations/${c.id}`}
              className="text-[11px] text-crimson hover:text-crimson/80"
            >
              開く →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
