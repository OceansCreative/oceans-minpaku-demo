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
  Menu,
  Network,
  Settings,
  Star,
  Tag,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { ThemeToggle } from '@/components/guest/ThemeToggle';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
}

const NAV: NavItem[] = [
  { href: '/admin', labelKey: 'navDashboard', icon: LayoutDashboard },
  { href: '/admin/reservations', labelKey: 'navReservations', icon: ClipboardList },
  { href: '/admin/calendar', labelKey: 'navCalendar', icon: Calendar },
  { href: '/admin/messages', labelKey: 'navMessages', icon: MessageSquare },
  { href: '/admin/reminders', labelKey: 'navReminders', icon: BookOpenCheck },
  { href: '/admin/sales', labelKey: 'navSales', icon: BarChart3 },
  { href: '/admin/passcodes', labelKey: 'navPasscodes', icon: KeyRound },
  { href: '/admin/pricing', labelKey: 'navPricing', icon: Tag },
  { href: '/admin/cancellation', labelKey: 'navCancellation', icon: CreditCard },
  { href: '/admin/ota', labelKey: 'navOta', icon: Network },
  { href: '/admin/guest-register', labelKey: 'navGuestRegister', icon: Users },
  { href: '/admin/reviews', labelKey: 'navReviews', icon: Star },
  { href: '/admin/settings', labelKey: 'navSettings', icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('Admin');
  const tNav = useTranslations('Nav');
  const authed = useAppStore((s) => s.isAdminAuthenticated);
  const signOut = useAppStore((s) => s.signOutAdmin);
  const reservations = useAppStore((s) => s.reservations);
  const isLoginRoute = pathname === '/admin/login';
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingCount = useMemo(
    () => reservations.filter((r) => r.status === 'pending').length,
    [reservations],
  );

  useEffect(() => {
    if (!authed && !isLoginRoute) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [authed, isLoginRoute, pathname, router]);

  // Close mobile drawer on route change.
  useEffect(() => setMobileOpen(false), [pathname]);

  if (isLoginRoute) return <div className="min-h-[60vh]">{children}</div>;

  if (!authed) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-ink/50">
        {t('redirectingToLogin')}
      </div>
    );
  }

  const sidebar = (
    <div className="sticky top-4 space-y-1 rounded-2xl border border-ink/10 bg-sand p-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between px-3 py-3">
        <div>
          <p className="font-serif text-base text-ink dark:text-gray-100">{tNav('admin')}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink/40 dark:text-gray-500">
            {t('brandSubtitle')}
          </p>
        </div>
        <ThemeToggle />
      </div>
      <nav className="space-y-0.5 text-sm">
        {NAV.map((item) => {
          const active =
            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 transition-colors',
                active
                  ? 'bg-ink text-sand dark:bg-gray-700 dark:text-gray-100'
                  : 'text-ink/70 hover:bg-ink/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 truncate">{t(item.labelKey)}</span>
              {item.href === '/admin/reservations' && pendingCount > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                    active
                      ? 'bg-sand text-ink dark:bg-gray-800 dark:text-gray-100'
                      : 'bg-crimson text-sand',
                  )}
                  aria-label={t('pendingBadgeLabel', { count: pendingCount })}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ink/10 px-3 py-3 text-[11px] text-ink/50 dark:border-gray-700 dark:text-gray-500">
        <p>{t('credit')}</p>
        <Link
          href="https://oceans-base.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="text-moss underline"
        >
          {t('creditLink')}
        </Link>
      </div>
      <button
        type="button"
        onClick={() => {
          signOut();
          router.push('/admin/login');
        }}
        className="mx-3 mb-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-ink/60 hover:bg-ink/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
      >
        <LogOut className="h-3.5 w-3.5" />
        {t('signOut')}
      </button>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside className="hidden w-56 shrink-0 md:block">{sidebar}</aside>

      {/* Mobile: trigger button + slide-out drawer */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label={t('openMenu')}
          /* Below the DemoBanner (~30px) + 16px gap; z-25 so the demo banner /
             welcome modal still sit above. */
          className="fixed left-3 top-[68px] z-[25] rounded-full bg-ink p-2.5 text-sand shadow-lg ring-1 ring-sand/20 dark:bg-gray-700 dark:ring-gray-600"
        >
          <Menu className="h-4 w-4" />
        </button>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-sand p-3 dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={t('closeMenu')}
                className="mb-2 ml-auto block rounded-full p-1.5 text-ink/40 hover:bg-ink/5 dark:text-gray-500 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </div>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
