'use client';

import {
  BarChart3,
  BookOpenCheck,
  Calendar,
  ClipboardList,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Network,
  Settings,
  Tag,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/admin/reservations', label: '予約管理', icon: ClipboardList },
  { href: '/admin/calendar', label: 'カレンダー', icon: Calendar },
  { href: '/admin/messages', label: 'ゲストメッセージ', icon: MessageSquare },
  { href: '/admin/reminders', label: 'リマインダー', icon: BookOpenCheck },
  { href: '/admin/sales', label: '売上集計', icon: BarChart3 },
  { href: '/admin/passcodes', label: 'パスコード管理', icon: KeyRound },
  { href: '/admin/pricing', label: '料金設定', icon: Tag },
  { href: '/admin/cancellation', label: 'キャンセル設定', icon: CreditCard },
  { href: '/admin/ota', label: 'OTA連携', icon: Network },
  { href: '/admin/guest-register', label: '宿泊者名簿', icon: Users },
  { href: '/admin/settings', label: 'サンプルデータ', icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const authed = useAppStore((s) => s.isAdminAuthenticated);
  const signOut = useAppStore((s) => s.signOutAdmin);
  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (!authed && !isLoginRoute) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [authed, isLoginRoute, pathname, router]);

  if (isLoginRoute) return <div className="min-h-[60vh]">{children}</div>;

  if (!authed) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-ink/50">
        ログイン画面へ移動中…
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-4 space-y-1 rounded-2xl border border-ink/10 bg-sand p-3">
          <div className="px-3 py-3">
            <p className="font-serif text-base text-ink">管理画面</p>
            <p className="text-[10px] uppercase tracking-widest text-ink/40">和庵 山陰 / Admin</p>
          </div>
          <nav className="space-y-0.5 text-sm">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
                    active ? 'bg-ink text-sand' : 'text-ink/70 hover:bg-ink/5 hover:text-ink',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-ink/10 px-3 py-3 text-[11px] text-ink/50">
            <p>OceansBase 制作サンプル</p>
            <Link
              href="https://oceans-base.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-moss underline"
            >
              開発のご相談はこちら
            </Link>
          </div>
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push('/admin/login');
            }}
            className="mx-3 mb-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-ink/60 hover:bg-ink/5 hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" />
            ログアウト
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
