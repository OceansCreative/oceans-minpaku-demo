'use client';

import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { use } from 'react';

import { seedAddons } from '@/lib/seed/addons';
import { getSelectedAddonDetails } from '@/lib/services/addon';
import { buildReceipt } from '@/lib/services/receipt';
import { useAppStore } from '@/lib/store';
import { toIsoDate } from '@/lib/utils/dates';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReceiptPage({ params }: PageProps) {
  const { id } = use(params);
  const t = useTranslations('Receipt');

  const reservation = useAppStore((s) => s.reservations.find((r) => r.id === id));
  const room = useAppStore((s) =>
    reservation ? s.rooms.find((r) => r.id === reservation.roomId) : undefined,
  );
  const guest = useAppStore((s) =>
    reservation ? s.guests.find((g) => g.id === reservation.guestId) : undefined,
  );
  const property = useAppStore((s) => s.property);

  if (!reservation || !room) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-sm text-ink/60">{t('notFound')}</p>
        <Link href="/" className="mt-4 inline-flex text-sm text-moss underline">
          {t('back')}
        </Link>
      </div>
    );
  }

  const backHref = `/reservations/${reservation.id}`;

  if (reservation.payment.status !== 'captured') {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-serif text-2xl text-ink">{t('notCapturedTitle')}</h1>
        <p className="mt-2 text-sm text-ink/60">{t('notCapturedBody')}</p>
        <Link
          href={backHref}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-moss hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('back')}
        </Link>
      </div>
    );
  }

  const receipt = buildReceipt(reservation, {
    roomName: room.name,
    guestName: guest?.name ?? '—',
    issuedOn: toIsoDate(new Date()),
  });
  const taxRatePct = Math.round(receipt.taxRate * 100);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('back')}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-xs text-sand transition-colors hover:bg-ink/90"
        >
          <Printer className="h-3.5 w-3.5" />
          {t('print')}
        </button>
      </div>

      <article className="space-y-6 rounded-2xl border border-ink/15 bg-white p-8 print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between border-b border-ink/10 pb-5">
          <div>
            <h1 className="font-serif text-3xl tracking-wide text-ink">{t('title')}</h1>
            <p className="mt-2 text-xs text-ink/50">
              {t('documentNo')}: <span className="font-mono">{receipt.receiptNo}</span>
            </p>
            <p className="text-xs text-ink/50">
              {t('issuedOn')}: {receipt.issuedOn}
            </p>
          </div>
          <div className="text-right text-xs text-ink/60">
            <p className="text-[10px] uppercase tracking-widest text-ink/40">{t('issuer')}</p>
            <p className="mt-1 font-serif text-base text-ink">{property.name}</p>
            <p>{property.address}</p>
          </div>
        </header>

        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-ink/40">{t('issuedTo')}</p>
          <p className="font-serif text-lg text-ink">{receipt.guestName}</p>
        </div>

        <dl className="grid gap-2 rounded-xl bg-ink/[0.03] p-4 text-sm print:bg-transparent print:p-0">
          <Row label={t('room')}>{receipt.roomName}</Row>
          <Row label={t('stayPeriod')}>
            {receipt.checkIn} → {receipt.checkOut}
          </Row>
          <Row label={t('description')}>{t('nights', { nights: receipt.nights })}</Row>
        </dl>

        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-ink/10">
              <td className="py-2.5 text-ink/70">
                {t('description')}
                <span className="ml-2 text-xs text-ink/40">
                  {t('unitNote', { amount: receipt.nightlyAverage.toLocaleString() })}
                </span>
              </td>
              <td className="py-2.5 text-right tabular-nums text-ink">
                ¥{receipt.net.toLocaleString()}
              </td>
            </tr>
            {reservation.promoDiscount !== undefined && reservation.promoDiscount > 0 && (
              <tr className="border-b border-ink/10">
                <td className="py-2.5 text-moss">
                  {t('promoDiscount')}
                  {reservation.promoCode && (
                    <span className="ml-2 font-mono text-xs text-moss/70">
                      {reservation.promoCode}
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-right tabular-nums text-moss">
                  -¥{reservation.promoDiscount.toLocaleString()}
                </td>
              </tr>
            )}
            {reservation.addons &&
              reservation.addons.length > 0 &&
              getSelectedAddonDetails(reservation.addons, seedAddons).map(({ addon, subtotal }) => (
                <tr key={addon.id} className="border-b border-ink/10">
                  <td className="py-2.5 text-ink/70">
                    {addon.icon} {t('addonLine')}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-ink">
                    +¥{subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            {reservation.addonTotal !== undefined && reservation.addonTotal > 0 && (
              <tr className="border-b border-ink/10">
                <td className="py-2.5 font-medium text-ink/70">{t('addonTotal')}</td>
                <td className="py-2.5 text-right tabular-nums text-ink">
                  ¥{reservation.addonTotal.toLocaleString()}
                </td>
              </tr>
            )}
            <tr className="border-b border-ink/10">
              <td className="py-2.5 text-ink/70">{t('tax', { rate: taxRatePct })}</td>
              <td className="py-2.5 text-right tabular-nums text-ink">
                ¥{receipt.tax.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td className="py-3 font-medium text-ink">{t('total')}</td>
              <td className="py-3 text-right text-lg font-medium tabular-nums text-ink">
                ¥{receipt.total.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        {receipt.deposit > 0 && (
          <p className="flex items-center justify-between border-t border-dashed border-ink/15 pt-3 text-xs text-ink/55">
            <span>{t('deposit')}</span>
            <span className="tabular-nums">¥{receipt.deposit.toLocaleString()}</span>
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-ink/55">
          <span>{t('paymentMethod')}</span>
          <span>{t('paymentCard')}</span>
        </div>

        <p className="pt-2 text-center text-sm text-ink/70">{t('thanks')}</p>

        <p className="border-t border-ink/10 pt-4 text-[11px] text-ink/40">{t('demoNote')}</p>
      </article>
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
