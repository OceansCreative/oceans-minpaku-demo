'use client';

import { ArrowLeft, CheckCircle2, Clock3, KeyRound, ShieldCheck, XCircle } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { Reservation, ReservationStatus } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReservationStatusPage({ params }: PageProps) {
  const { id } = use(params);
  const reservation = useAppStore((s) => s.reservations.find((r) => r.id === id));
  const room = useAppStore((s) =>
    reservation ? s.rooms.find((r) => r.id === reservation.roomId) : undefined,
  );
  const guest = useAppStore((s) =>
    reservation ? s.guests.find((g) => g.id === reservation.guestId) : undefined,
  );

  if (!reservation || !room) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm text-ink/60">予約が見つかりませんでした。</p>
        <Link href="/" className="mt-4 inline-flex text-sm text-moss underline">
          トップへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        トップへ戻る
      </Link>

      <StatusBadge status={reservation.status} />

      <h1 className="mt-3 font-serif text-3xl text-ink">{room.name} のご予約</h1>
      <p className="mt-1 text-sm text-ink/60">予約番号: {reservation.id}</p>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <Card title="日程">
          <Row label="チェックイン">
            {reservation.checkIn} {reservation.checkInTime}
          </Row>
          <Row label="チェックアウト">
            {reservation.checkOut} {reservation.checkOutTime}
          </Row>
        </Card>
        <Card title="ゲスト情報">
          <Row label="お名前">{guest?.name ?? '—'}</Row>
          <Row label="メール">{guest?.email ?? '—'}</Row>
          <Row label="電話">{guest?.phone ?? '—'}</Row>
        </Card>
        <Card title="お支払い">
          <Row label="合計">¥{reservation.amount.toLocaleString()}</Row>
          <Row label="ステータス">{paymentLabel(reservation.payment.status)}</Row>
          <Row label="Intent">
            <code className="text-xs">{reservation.payment.intentId}</code>
          </Row>
          {reservation.payment.status === 'captured' && (
            <Link
              href={`/reservations/${reservation.id}/receipt`}
              className="mt-1 inline-flex items-center gap-1 text-xs text-moss hover:text-ink"
            >
              領収書を発行 →
            </Link>
          )}
        </Card>
        <Card title="スマートロック">
          {reservation.passcode ? (
            <PasscodeReveal code={reservation.passcode.code} />
          ) : (
            <p className="text-sm text-ink/50">ホストの承認後にパスコードが発行されます。</p>
          )}
        </Card>
      </section>

      <NextStepsForStatus reservation={reservation} />

      <div className="mt-12 rounded-lg border border-ink/10 bg-ink/[0.02] px-5 py-4 text-xs text-ink/60">
        ※ これは OceansBase の制作サンプルです。
        実際の決済・スマートロック発行・通知は行われません。承認の流れは管理画面（demo /
        demo）から体験できます。
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5">
      <h2 className="font-serif text-sm uppercase tracking-widest text-ink/50">{title}</h2>
      <dl className="space-y-2 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink/50">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

function PasscodeReveal({ code }: { code: string }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs text-moss">
        <KeyRound className="h-3.5 w-3.5" />
        スマートロック用パスコード
      </p>
      <p className="rounded-lg bg-ink px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-sand">
        {code}
      </p>
      <p className="text-[11px] text-ink/40">
        チェックイン15分前から有効になります。チェックアウト後は自動的に失効します。
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  const map: Record<ReservationStatus, { label: string; tone: string; Icon: typeof CheckCircle2 }> =
    {
      pending: { label: '承認待ち', tone: 'text-moss bg-moss/10', Icon: Clock3 },
      approved: { label: '予約確定', tone: 'text-emerald-700 bg-emerald-50', Icon: ShieldCheck },
      rejected: { label: '却下', tone: 'text-crimson bg-crimson/10', Icon: XCircle },
      cancelled: { label: 'キャンセル済み', tone: 'text-ink/50 bg-ink/5', Icon: XCircle },
    };
  const { label, tone, Icon } = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        tone,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function NextStepsForStatus({ reservation }: { reservation: Reservation }) {
  if (reservation.status === 'pending') {
    return (
      <div className="mt-8 rounded-2xl border border-moss/30 bg-moss/5 px-5 py-4 text-sm text-ink">
        <p className="font-medium">ホストの承認をお待ちください</p>
        <p className="mt-1 text-xs text-ink/60">
          お支払いは現在「与信のみ」確保されています。承認時に正式に決済され、
          スマートロックのパスコードが発行されます。
        </p>
      </div>
    );
  }
  if (reservation.status === 'approved') {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
        <p className="font-medium">ご予約が確定しました。お会いできるのを楽しみにしています。</p>
        <p className="mt-1 text-xs text-emerald-700">
          パスコードはチェックイン当日にもメッセージでお送りします。
        </p>
      </div>
    );
  }
  return null;
}

function paymentLabel(status: Reservation['payment']['status']): string {
  switch (status) {
    case 'authorized':
      return '与信確保中';
    case 'captured':
      return '決済完了';
    case 'released':
      return '与信解除';
    case 'refunded':
      return '返金済み';
  }
}
