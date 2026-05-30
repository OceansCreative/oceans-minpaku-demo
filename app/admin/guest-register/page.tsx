'use client';

import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ScanLine,
  Upload,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { useAppStore } from '@/lib/store';

import type { GuestRegister } from '@/types';

export default function AdminGuestRegisterPage() {
  const reservations = useAppStore((s) => s.reservations);
  const guests = useAppStore((s) => s.guests);
  const register = useAppStore((s) => s.guestRegister);
  const upsert = useAppStore((s) => s.upsertGuestRegister);

  const eligible = useMemo(
    () =>
      reservations
        .filter((r) => r.status === 'approved' || r.status === 'pending')
        .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1)),
    [reservations],
  );

  const [drafts, setDrafts] = useState<Record<string, Partial<GuestRegister>>>({});

  function updateDraft(reservationId: string, patch: Partial<GuestRegister>) {
    setDrafts((d) => ({
      ...d,
      [reservationId]: { ...(d[reservationId] ?? {}), ...patch },
    }));
  }

  function commit(reservationId: string) {
    const reservation = reservations.find((r) => r.id === reservationId);
    const guest = guests.find((g) => g.id === reservation?.guestId);
    const existing = register.find((r) => r.reservationId === reservationId);
    const draft = drafts[reservationId] ?? {};
    upsert({
      id: existing?.id ?? `reg-${Math.random().toString(36).slice(2, 8)}`,
      reservationId,
      name: draft.name ?? existing?.name ?? guest?.name ?? '',
      nationality: draft.nationality ?? existing?.nationality ?? guest?.nationality ?? '',
      passportNumber: draft.passportNumber ?? existing?.passportNumber,
      profession: draft.profession ?? existing?.profession ?? '',
      idImageUrl: draft.idImageUrl ?? existing?.idImageUrl,
    });
    setDrafts((d) => {
      const next = { ...d };
      delete next[reservationId];
      return next;
    });
  }

  function exportCsv() {
    const header = [
      '予約ID',
      '氏名',
      '国籍',
      '職業',
      '旅券番号',
      'チェックイン',
      'チェックアウト',
      '身分証',
    ];
    const rows = register.map((entry) => {
      const reservation = reservations.find((r) => r.id === entry.reservationId);
      return [
        entry.reservationId,
        entry.name,
        entry.nationality,
        entry.profession,
        entry.passportNumber ?? '',
        reservation?.checkIn ?? '',
        reservation?.checkOut ?? '',
        entry.idImageUrl ? '取得済み' : '未取得',
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guest-register-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <ComplianceNotes />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">宿泊者名簿</h1>
          <p className="text-sm text-ink/60">
            住宅宿泊事業法 §8 に基づく宿泊者の記録。氏名・国籍・連絡先・職業を記載し、3
            年間保存します。
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={register.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 bg-sand px-3 py-1.5 text-xs text-ink/80 hover:bg-ink/[0.04] disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          CSV エクスポート
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-3 py-2.5 text-left">予約</th>
              <th className="px-3 py-2.5 text-left">氏名</th>
              <th className="px-3 py-2.5 text-left">国籍</th>
              <th className="px-3 py-2.5 text-left">職業</th>
              <th className="px-3 py-2.5 text-left">旅券番号</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {eligible.map((r) => {
              const guest = guests.find((g) => g.id === r.guestId);
              const existing = register.find((re) => re.reservationId === r.id);
              const draft = drafts[r.id] ?? {};
              const merged = { ...existing, ...draft };
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink/60">{r.id}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.name ?? guest?.name ?? ''}
                      onChange={(e) => updateDraft(r.id, { name: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.nationality ?? guest?.nationality ?? ''}
                      onChange={(e) => updateDraft(r.id, { nationality: e.target.value })}
                      className={`${inputClass} w-20`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.profession ?? ''}
                      onChange={(e) => updateDraft(r.id, { profession: e.target.value })}
                      className={inputClass}
                      placeholder="例: 会社員"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.passportNumber ?? ''}
                      onChange={(e) => updateDraft(r.id, { passportNumber: e.target.value })}
                      className={`${inputClass} w-28 font-mono text-xs`}
                      placeholder="（外国籍のみ）"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <IdUploadButton
                        uploaded={Boolean(merged.idImageUrl)}
                        onUpload={() =>
                          updateDraft(r.id, {
                            idImageUrl: `https://picsum.photos/seed/id-${r.id}/400/250`,
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => commit(r.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1 text-[11px] text-sand hover:bg-ink/90"
                      >
                        <ClipboardCheck className="h-3 w-3" />
                        記録
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {eligible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-ink/40">
                  <Users className="mx-auto mb-1 h-5 w-5 opacity-50" />
                  記録対象の予約はまだありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceNotes() {
  return (
    <section className="rounded-2xl border border-moss/30 bg-moss/[0.06] p-5 text-xs leading-relaxed text-ink/70">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-moss">
        <BookOpen className="h-4 w-4" />
        住宅宿泊事業法 (民泊新法) 対応メモ
      </h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>§8 宿泊者名簿の備付義務</strong>: 氏名・住所・職業・宿泊日を記録し、3
          年間保存。外国籍の宿泊者は旅券番号も必須。
        </li>
        <li>
          <strong>§6 本人確認義務</strong>:
          対面または「ICTを用いた方法」で本人確認を行う。ICT方式の場合、宿泊者が映像で旅券を提示する／顔写真を撮影するなどの方法が認められている。
        </li>
        <li>
          <strong>§2-3 年間180日上限</strong>:
          1年間（4月〜翌3月）で180日まで。ダッシュボードの稼働カウンタを参照。
        </li>
        <li>
          <strong>都道府県への定期報告</strong>:
          2ヶ月に1回、宿泊日数・宿泊者数・国籍別内訳を報告。本サンプルではCSVエクスポート機能で代替。
        </li>
      </ul>
      <p className="mt-3 text-[11px] text-ink/40">
        ※
        本番運用前に管轄保健所への届出・標識掲示・苦情対応窓口の整備など、追加の運用要件があります。詳細は専門家にご相談ください。
      </p>
    </section>
  );
}

function IdUploadButton({ uploaded, onUpload }: { uploaded: boolean; onUpload: () => void }) {
  if (uploaded) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700"
        title="ICT本人確認: 身分証画像 + 顔写真 を取得済み"
      >
        <CheckCircle2 className="h-3 w-3" />
        ICT本人確認 OK
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onUpload}
      title="ICT本人確認のための身分証画像をアップロード（モック）"
      className="inline-flex items-center gap-1 rounded-md border border-ink/15 px-2 py-1 text-[10px] text-ink/60 hover:bg-ink/[0.04]"
    >
      <Upload className="h-3 w-3" />
      <ScanLine className="h-3 w-3" />
      身分証 UP
    </button>
  );
}

const inputClass =
  'w-full rounded-md border border-ink/15 bg-sand px-2 py-1 text-xs focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';
