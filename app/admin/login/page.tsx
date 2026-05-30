'use client';

import { Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { useAppStore } from '@/lib/store';

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[40vh] place-items-center text-sm text-ink/50">読み込み中…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signInAdmin = useAppStore((s) => s.signInAdmin);
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo');
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (username === 'demo' && password === 'demo') {
      signInAdmin();
      const next = searchParams.get('next') ?? '/admin';
      router.push(next);
    } else {
      setError('資格情報が正しくありません（demo / demo）');
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-6 py-20">
      <div className="space-y-2 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink text-sand">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="font-serif text-2xl text-ink">管理画面ログイン</h1>
        <p className="text-xs text-ink/50">
          このサンプルは <code className="rounded bg-ink/5 px-1.5 py-0.5">demo</code> /{' '}
          <code className="rounded bg-ink/5 px-1.5 py-0.5">demo</code> でログインできます。
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mt-8 space-y-4 rounded-2xl border border-ink/10 bg-sand p-6"
      >
        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">ユーザー名</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
          />
        </label>
        {error && (
          <div className="flex items-center gap-1.5 rounded-md bg-crimson/10 px-3 py-2 text-xs text-crimson">
            <ShieldAlert className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-sand transition-colors hover:bg-ink/90"
        >
          <ShieldCheck className="h-4 w-4" />
          ログイン
        </button>
        <p className="border-t border-ink/10 pt-3 text-[11px] text-ink/40">
          ※ デモ用のモック認証です。本番では Auth0 / NextAuth / 自社IDなどに差し替えます。
        </p>
      </form>
    </div>
  );
}
