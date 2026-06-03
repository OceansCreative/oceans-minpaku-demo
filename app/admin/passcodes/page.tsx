'use client';

import { KeyRound, Loader2, RefreshCw, ShieldOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { issueCode, revokeCode } from '@/lib/mock/remotelock';
import { useAppStore } from '@/lib/store';
import { joinPropertyDateTime } from '@/lib/utils/dates';

export default function AdminPasscodesPage() {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const guests = useAppStore((s) => s.guests);
  const setReservationPasscode = useAppStore((s) => s.setReservationPasscode);
  const t = useTranslations('Admin');
  const [busyId, setBusyId] = useState<string | null>(null);

  const issued = useMemo(
    () =>
      reservations
        .filter((r) => r.status === 'approved' && r.passcode)
        .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1)),
    [reservations],
  );

  async function reissue(reservationId: string) {
    const r = reservations.find((x) => x.id === reservationId);
    if (!r) return;
    setBusyId(reservationId);
    try {
      const fresh = await issueCode({
        validFrom: joinPropertyDateTime(r.checkIn, r.checkInTime),
        validUntil: joinPropertyDateTime(r.checkOut, r.checkOutTime),
      });
      setReservationPasscode(reservationId, fresh);
      toast.success(t('reissueSuccess'), {
        description: t('reissueSuccessDesc', { code: fresh.code }),
      });
    } catch (e) {
      toast.error(t('reissueError'), {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function revoke(reservationId: string) {
    const r = reservations.find((x) => x.id === reservationId);
    if (!r?.passcode) return;
    if (!confirm(t('confirmRevoke'))) return;
    setBusyId(reservationId);
    try {
      await revokeCode({ passcode: r.passcode });
      setReservationPasscode(reservationId, undefined);
      toast.success(t('revokeSuccess'));
    } catch (e) {
      toast.error(t('revokeError'), {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-serif text-2xl text-ink">{t('navPasscodes')}</h1>
        <p className="text-sm text-ink/60">{t('passcodesSubtitle')}</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-2.5 text-left">{t('colReservation')}</th>
              <th className="px-4 py-2.5 text-left">{t('colGuest')}</th>
              <th className="px-4 py-2.5 text-left">{t('colRoom')}</th>
              <th className="px-4 py-2.5 text-left">{t('colCode')}</th>
              <th className="px-4 py-2.5 text-left">{t('colValidRange')}</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {issued.map((r) => {
              const guest = guests.find((g) => g.id === r.guestId);
              const room = rooms.find((rm) => rm.id === r.roomId);
              return (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.id}</td>
                  <td className="px-4 py-3 text-ink">{guest?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink/80">{room?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded bg-ink px-2 py-1 font-mono text-xs tracking-widest text-sand">
                      <KeyRound className="h-3 w-3" />
                      {r.passcode?.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-ink/60">
                    {r.passcode?.validFrom.slice(0, 16).replace('T', ' ')} →{' '}
                    {r.passcode?.validUntil.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => reissue(r.id)}
                        disabled={busyId === r.id}
                        title={t('reissue')}
                        className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink disabled:opacity-50"
                      >
                        {busyId === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => revoke(r.id)}
                        disabled={busyId === r.id}
                        title={t('revoke')}
                        className="rounded-md p-1.5 text-crimson/60 hover:bg-crimson/10 hover:text-crimson disabled:opacity-50"
                      >
                        <ShieldOff className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {issued.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink/40">
                  {t('passcodesEmpty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
