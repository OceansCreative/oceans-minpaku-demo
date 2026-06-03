'use client';

import { Database, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';

export default function AdminSettingsPage() {
  const reset = useAppStore((s) => s.resetToSeed);
  const t = useTranslations('Admin');
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm(t('settingsConfirmReset'))) return;
    setResetting(true);
    await new Promise((r) => setTimeout(r, 300));
    reset();
    setResetting(false);
    toast.success(t('settingsResetSuccess'));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl text-ink">{t('settingsTitle')}</h1>
        <p className="text-sm text-ink/60">{t('settingsSubtitle')}</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-ink/10 bg-sand p-5">
        <header className="flex items-center gap-2 text-sm text-ink/80">
          <Database className="h-4 w-4 text-moss" />
          <span className="font-medium">{t('settingsResetHeading')}</span>
        </header>
        <p className="text-xs leading-relaxed text-ink/60">{t('settingsResetIntro')}</p>
        <ul className="ml-4 list-disc text-xs text-ink/60">
          <li>{t('settingsResetItemReservations')}</li>
          <li>{t('settingsResetItemPolicies')}</li>
          <li>{t('settingsResetItemMessages')}</li>
          <li>{t('settingsResetItemRegister')}</li>
        </ul>
        <p className="text-[11px] text-ink/40">{t('settingsResetPreserved')}</p>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="inline-flex items-center gap-1.5 rounded-md bg-crimson px-4 py-2 text-xs font-medium text-sand transition-colors hover:bg-crimson/90 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {resetting ? t('settingsResetting') : t('settingsRunReset')}
        </button>
      </section>
    </div>
  );
}
