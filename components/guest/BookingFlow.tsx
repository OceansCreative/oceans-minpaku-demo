'use client';

import 'react-day-picker/style.css';

import { ja } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Lock,
  Receipt,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';

import { calculateStayTotal } from '@/lib/services/pricing';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';
import { nightsBetween, toIsoDate } from '@/lib/utils/dates';

import type { HHmm, LanguageCode, Reservation, Room } from '@/types';

interface BookingFlowProps {
  room: Room;
}

export type BookingStep = 'dates' | 'time' | 'parking' | 'review' | 'info' | 'payment' | 'done';

const STEPS: { id: BookingStep; label: string }[] = [
  { id: 'dates', label: '日程' },
  { id: 'time', label: '時刻' },
  { id: 'parking', label: '駐車場' },
  { id: 'review', label: '料金確認' },
  { id: 'info', label: 'ゲスト情報' },
  { id: 'payment', label: '決済' },
];

const CHECK_IN_OPTIONS: HHmm[] = ['14:00', '15:00', '16:00', '17:00', '18:00'];
const CHECK_OUT_OPTIONS: HHmm[] = ['09:00', '10:00', '11:00'];

export function BookingFlow({ room }: BookingFlowProps) {
  const reservations = useAppStore((s) => s.reservations);
  const parkingSlots = useAppStore((s) => s.parkingSlots);
  const pricingRules = useAppStore((s) => s.pricingRules);
  const [step, setStep] = useState<BookingStep>('dates');
  const [range, setRange] = useState<DateRange | undefined>();
  const [checkInTime, setCheckInTime] = useState<HHmm>('15:00');
  const [checkOutTime, setCheckOutTime] = useState<HHmm>('10:00');
  const [parkingId, setParkingId] = useState<string | undefined>();
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    nationality: 'JP',
    language: 'ja' as LanguageCode,
  });

  const guestInfoComplete =
    guestInfo.name.trim().length > 0 &&
    /.+@.+\..+/.test(guestInfo.email) &&
    guestInfo.phone.trim().length >= 6;

  const [card, setCard] = useState({ number: '4242 4242 4242 4242', expiry: '12/29', cvc: '123' });
  const cardLooksValid =
    card.number.replaceAll(' ', '').length >= 12 &&
    /^\d{2}\/\d{2}$/.test(card.expiry) &&
    card.cvc.length >= 3;

  const bookedDays = useMemo(
    () => collectBookedDays(reservations, room.id),
    [reservations, room.id],
  );

  const nights =
    range?.from && range.to ? nightsBetween(toIsoDate(range.from), toIsoDate(range.to)) : 0;

  const quote = useMemo(() => {
    if (!range?.from || !range.to) return null;
    return calculateStayTotal({
      basePrice: room.basePrice,
      checkIn: toIsoDate(range.from),
      checkOut: toIsoDate(range.to),
      rules: pricingRules,
    });
  }, [range?.from, range?.to, room.basePrice, pricingRules]);

  const canAdvanceFromDates = nights > 0;
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  }
  function goPrev() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1.5fr,1fr]">
      <section className="space-y-6">
        <StepIndicator current={step} />

        {step === 'dates' && (
          <div className="space-y-4">
            <header className="flex items-center gap-2 text-sm text-ink/70">
              <CalendarIcon className="h-4 w-4 text-moss" />
              <span>チェックイン / アウトを選択してください</span>
            </header>
            <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-sand p-4">
              <DayPicker
                mode="range"
                numberOfMonths={2}
                locale={ja}
                disabled={[{ before: new Date() }, ...bookedDays.map((d) => new Date(d))]}
                selected={range}
                onSelect={setRange}
                classNames={{
                  today: 'text-moss font-semibold',
                  selected: 'bg-ink text-sand',
                  range_start: 'bg-ink text-sand rounded-l-md',
                  range_end: 'bg-ink text-sand rounded-r-md',
                  range_middle: 'bg-ink/10 text-ink',
                  disabled: 'text-ink/20 line-through',
                }}
              />
            </div>
            <ul className="flex flex-wrap gap-3 text-[11px] text-ink/60">
              <li className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-ink" /> 選択中
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-ink/10" /> 滞在期間
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border border-ink/30 bg-sand line-through" />
                予約済み
              </li>
            </ul>
          </div>
        )}

        {step === 'time' && (
          <div className="space-y-5">
            <header className="flex items-center gap-2 text-sm text-ink/70">
              <Clock className="h-4 w-4 text-moss" />
              <span>チェックイン / アウトの時刻をお選びください</span>
            </header>
            <TimeChoice
              label="チェックイン"
              value={checkInTime}
              onChange={setCheckInTime}
              options={CHECK_IN_OPTIONS}
            />
            <TimeChoice
              label="チェックアウト"
              value={checkOutTime}
              onChange={setCheckOutTime}
              options={CHECK_OUT_OPTIONS}
            />
            <p className="text-[11px] leading-relaxed text-ink/40">
              鍵のパスコードはチェックイン15分前から、チェックアウト時刻まで有効です。
            </p>
          </div>
        )}

        {step === 'info' && (
          <div className="space-y-5">
            <header className="flex items-center gap-2 text-sm text-ink/70">
              <UserRound className="h-4 w-4 text-moss" />
              <span>ご宿泊代表者の情報をご入力ください</span>
            </header>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="お名前 / Name" required>
                <input
                  type="text"
                  value={guestInfo.name}
                  onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                  className={inputClass}
                  placeholder="山田 太郎"
                  autoComplete="name"
                />
              </Field>
              <Field label="メールアドレス / Email" required>
                <input
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                  className={inputClass}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="電話番号 / Phone" required>
                <input
                  type="tel"
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+81-90-1234-5678"
                  autoComplete="tel"
                />
              </Field>
              <Field label="国籍 / Nationality">
                <input
                  type="text"
                  value={guestInfo.nationality}
                  onChange={(e) => setGuestInfo({ ...guestInfo, nationality: e.target.value })}
                  className={inputClass}
                  placeholder="JP"
                />
              </Field>
              <Field label="連絡言語 / Language">
                <select
                  value={guestInfo.language}
                  onChange={(e) =>
                    setGuestInfo({ ...guestInfo, language: e.target.value as LanguageCode })
                  }
                  className={inputClass}
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="ko">한국어</option>
                </select>
              </Field>
            </div>
            <p className="text-[11px] text-ink/40">
              ご入力いただいた情報は宿泊者名簿（民泊新法対応）として記録されます。
              チェックイン時に身分証のご提示をお願いする場合があります。
            </p>
          </div>
        )}

        {step === 'payment' && quote && (
          <div className="space-y-5">
            <header className="flex items-center gap-2 text-sm text-ink/70">
              <CreditCard className="h-4 w-4 text-moss" />
              <span>お支払い方法（モック）</span>
            </header>
            <div className="rounded-2xl border border-ink/10 bg-sand p-5">
              <div className="mb-4 flex items-center gap-2 rounded-md bg-moss/10 px-3 py-2 text-[11px] text-moss">
                <Lock className="h-3.5 w-3.5" />
                これはデモ用のフォームです。実際のカード情報は送信されません。
              </div>
              <div className="space-y-4">
                <Field label="カード番号" required>
                  <input
                    type="text"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value })}
                    className={inputClass}
                    placeholder="4242 4242 4242 4242"
                    autoComplete="cc-number"
                    inputMode="numeric"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="有効期限 (MM/YY)" required>
                    <input
                      type="text"
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                      className={inputClass}
                      placeholder="12/29"
                      autoComplete="cc-exp"
                    />
                  </Field>
                  <Field label="CVC" required>
                    <input
                      type="text"
                      value={card.cvc}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                      className={inputClass}
                      placeholder="123"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
              </div>
              <p className="mt-4 border-t border-ink/10 pt-3 text-[11px] text-ink/50">
                ご予約のリクエスト時点では <strong className="text-ink">与信のみ</strong>{' '}
                を確保します（authorized）。ホストが承認した時点で正式に決済（captured）
                となります。承認されなかった場合は決済されません。
              </p>
            </div>
          </div>
        )}

        {step === 'review' && quote && (
          <div className="space-y-4">
            <header className="flex items-center gap-2 text-sm text-ink/70">
              <Receipt className="h-4 w-4 text-moss" />
              <span>料金の内訳をご確認ください</span>
            </header>
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
              <ul className="divide-y divide-ink/5 text-sm">
                {quote.rates.map((rate) => {
                  const isPremium = rate.price !== room.basePrice;
                  return (
                    <li key={rate.date} className="flex items-center justify-between px-4 py-2.5">
                      <div>
                        <p className="text-ink">{rate.date}</p>
                        {rate.appliedRules.length > 0 && (
                          <p className="text-[11px] text-ink/40">
                            適用ルール: {rate.appliedRules.join(', ')}
                          </p>
                        )}
                      </div>
                      <p className={cn('font-medium', isPremium ? 'text-moss' : 'text-ink')}>
                        ¥{rate.price.toLocaleString()}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between border-t border-ink/10 bg-ink/[0.02] px-4 py-3">
                <span className="text-sm text-ink/70">合計（{quote.nights} 泊）</span>
                <span className="font-serif text-xl text-ink">¥{quote.total.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-ink/40">
              週末・季節・直前予約などのルールが適用されると基本料金から変動します。
              お支払いはご予約のリクエスト時に与信のみ確保し、ホストの承認をもって正式に決済されます。
            </p>
          </div>
        )}

        {step === 'parking' && (
          <div className="space-y-4">
            <header className="flex items-center gap-2 text-sm text-ink/70">
              <Car className="h-4 w-4 text-moss" />
              <span>駐車場のご利用予定はありますか？</span>
            </header>
            <p className="text-[11px] text-ink/40">
              当宿は最大10台まで駐車可能です。お一台あたり1区画をご予約いただきます（追加料金なし）。
            </p>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
              <button
                type="button"
                onClick={() => setParkingId(undefined)}
                className={cn(
                  'col-span-5 rounded-md border px-3 py-2 text-xs sm:col-span-10',
                  parkingId === undefined
                    ? 'border-ink bg-ink text-sand'
                    : 'border-ink/15 bg-sand text-ink/70 hover:border-ink/30',
                )}
              >
                利用しない
              </button>
              {parkingSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setParkingId(slot.id)}
                  className={cn(
                    'rounded-md border py-2 text-xs',
                    parkingId === slot.id
                      ? 'border-ink bg-ink text-sand'
                      : 'border-ink/15 bg-sand text-ink/70 hover:border-ink/30',
                  )}
                  aria-label={`駐車場区画 ${slot.label}`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <StepNav
          current={step}
          onPrev={stepIndex > 0 ? goPrev : undefined}
          onNext={
            step === 'dates'
              ? canAdvanceFromDates
                ? goNext
                : undefined
              : step === 'info'
                ? guestInfoComplete
                  ? goNext
                  : undefined
                : step === 'payment'
                  ? cardLooksValid
                    ? goNext
                    : undefined
                  : goNext
          }
        />
      </section>

      <aside className="h-fit space-y-3 rounded-2xl border border-ink/10 bg-sand/60 p-5 text-sm">
        <p className="font-serif text-base text-ink">{room.name}</p>
        <dl className="space-y-2 text-xs text-ink/70">
          <Row label="チェックイン">
            {range?.from ? `${toIsoDate(range.from)} ${checkInTime}` : '— 未選択 —'}
          </Row>
          <Row label="チェックアウト">
            {range?.to ? `${toIsoDate(range.to)} ${checkOutTime}` : '— 未選択 —'}
          </Row>
          <Row label="泊数">{nights > 0 ? `${nights} 泊` : '—'}</Row>
          <Row label="駐車場">
            {parkingId ? (parkingSlots.find((p) => p.id === parkingId)?.label ?? '—') : 'なし'}
          </Row>
          {quote && (
            <Row label="合計">
              <span className="font-serif text-base text-ink">¥{quote.total.toLocaleString()}</span>
            </Row>
          )}
        </dl>
        <p className="text-[11px] text-ink/40">
          駐車場・料金・ゲスト情報・決済は後続のステップで選択します。
        </p>
      </aside>
    </div>
  );
}

function StepIndicator({ current }: { current: BookingStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="flex flex-wrap items-center gap-2 text-[11px] text-ink/50">
      {STEPS.map((s, i) => {
        const reached = i <= currentIdx;
        const active = s.id === current;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px]',
                reached ? 'border-ink bg-ink text-sand' : 'border-ink/30 text-ink/40',
                active && 'ring-2 ring-moss/40',
              )}
            >
              {i + 1}
            </span>
            <span className={cn(reached ? 'text-ink' : 'text-ink/40')}>{s.label}</span>
            {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-ink/20" />}
          </li>
        );
      })}
    </ol>
  );
}

function StepNav({
  current,
  onPrev,
  onNext,
}: {
  current: BookingStep;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-ink/10 pt-4">
      {onPrev ? (
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-ink"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          ひとつ前へ
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!onNext}
        className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-xs font-medium text-sand transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-30"
      >
        次へ
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
  // The `current` arg keeps the signature stable as later commits gate Next per step.
  void current;
}

function TimeChoice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: HHmm;
  onChange: (v: HHmm) => void;
  options: HHmm[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs text-ink/60">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm transition-colors',
              value === opt
                ? 'border-ink bg-ink text-sand'
                : 'border-ink/15 bg-sand text-ink/70 hover:border-ink/30',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const inputClass =
  'w-full rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-ink/60">
        {label}
        {required && <span className="ml-1 text-crimson">*</span>}
      </span>
      {children}
    </label>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

function collectBookedDays(reservations: Reservation[], roomId: string): string[] {
  const out: string[] = [];
  for (const r of reservations) {
    if (r.roomId !== roomId) continue;
    if (r.status === 'cancelled' || r.status === 'rejected') continue;
    const start = new Date(`${r.checkIn}T00:00:00.000Z`);
    const end = new Date(`${r.checkOut}T00:00:00.000Z`);
    const cursor = new Date(start);
    while (cursor < end) {
      out.push(toIsoDate(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return out;
}
