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
import { use, useState } from 'react';

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

  const [busy, setBusy] = useState<'approve' | 'reject' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!reservation || !room) {
    return <p className="text-sm text-ink/60">予約が見つかりませんでした。</p>;
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
      // Synthesize the captured-side intent from what's stored on the reservation.
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
    } catch (e) {
      setError(e instanceof Error ? e.message : '承認に失敗しました');
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!reservation) return;
    if (
      !confirm(
        'この予約をキャンセルしますか？キャンセルポリシーに基づいてデポジットを差し引き、Stripe からゲストへ返金します。',
      )
    )
      return;
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'キャンセルに失敗しました');
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
    } catch (e) {
      setError(e instanceof Error ? e.message : '却下に失敗しました');
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
        予約一覧へ戻る
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">{room.name} のご予約</h1>
          <p className="text-sm text-ink/50">{guest?.name ?? '— ゲスト不明 —'}</p>
        </div>
        <span className="rounded-full bg-ink/[0.04] px-3 py-1 text-xs text-ink/70">
          {reservation.id}
        </span>
      </header>

      {conflicts.length > 0 && reservation.status === 'pending' && (
        <ConflictWarning conflicts={conflicts} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="日程">
          <Row label="チェックイン">
            {reservation.checkIn} {reservation.checkInTime}
          </Row>
          <Row label="チェックアウト">
            {reservation.checkOut} {reservation.checkOutTime}
          </Row>
          <Row label="経路">{reservation.source}</Row>
        </Card>
        <Card title="決済">
          <Row label="金額">¥{reservation.amount.toLocaleString()}</Row>
          <Row label="状態">{reservation.payment.status}</Row>
          <Row label="Intent">
            <code className="text-[11px]">{reservation.payment.intentId}</code>
          </Row>
        </Card>
        <Card title="ゲスト">
          <Row label="お名前">{guest?.name ?? '—'}</Row>
          <Row label="メール">{guest?.email ?? '—'}</Row>
          <Row label="電話">{guest?.phone ?? '—'}</Row>
        </Card>
        <Card title="ステータス">
          <Row label="現在">{reservation.status}</Row>
        </Card>
        <Card title="スマートロック">
          {reservation.passcode ? (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs text-moss">
                <KeyRound className="h-3.5 w-3.5" />
                RemoteLOCK パスコード発行済み
              </p>
              <p className="rounded-md bg-ink px-3 py-2 text-center font-mono text-xl tracking-[0.3em] text-sand">
                {reservation.passcode.code}
              </p>
              <p className="text-[10px] text-ink/50">
                有効期間: {reservation.passcode.validFrom.slice(0, 16).replace('T', ' ')} 〜{' '}
                {reservation.passcode.validUntil.slice(0, 16).replace('T', ' ')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink/50">
              承認時に RemoteLOCK へパスコード発行リクエストを送ります。
            </p>
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
          onCancel={handleCancel}
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
            承認する（Stripe capture）
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
            却下（Stripe cancel）
          </button>
          <p className="ml-auto self-center text-[11px] text-ink/50">
            承認で与信を捕捉、却下で与信を解除します。
          </p>
        </div>
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
