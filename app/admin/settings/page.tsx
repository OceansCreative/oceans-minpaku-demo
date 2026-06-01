'use client';

import { Database, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';

export default function AdminSettingsPage() {
  const reset = useAppStore((s) => s.resetToSeed);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (
      !confirm(
        'すべてのサンプルデータを初期状態に戻します（予約・パスコード・メッセージ・宿泊者名簿などのデモ中の編集が失われます）。よろしいですか？',
      )
    )
      return;
    setResetting(true);
    await new Promise((r) => setTimeout(r, 300));
    reset();
    setResetting(false);
    toast.success('サンプルデータを初期状態に戻しました');
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl text-ink">サンプルデータ管理</h1>
        <p className="text-sm text-ink/60">デモを最初の状態に戻したいときに利用します。</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-ink/10 bg-sand p-5">
        <header className="flex items-center gap-2 text-sm text-ink/80">
          <Database className="h-4 w-4 text-moss" />
          <span className="font-medium">シードデータをリセット</span>
        </header>
        <p className="text-xs leading-relaxed text-ink/60">
          以下のスライスがシード初期値に戻ります:
        </p>
        <ul className="ml-4 list-disc text-xs text-ink/60">
          <li>予約（重複しかけ予約を含むデモ予約セット）</li>
          <li>料金ルール / キャンセルポリシー / リマインダーテンプレ</li>
          <li>ゲストメッセージスレッド</li>
          <li>宿泊者名簿</li>
        </ul>
        <p className="text-[11px] text-ink/40">管理者の認証状態と言語選択は維持されます。</p>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 rounded-md bg-crimson px-4 py-2 text-xs font-medium text-sand transition-colors hover:bg-crimson/90 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {resetting ? 'リセット中…' : 'リセットを実行'}
        </button>
      </section>
    </div>
  );
}
