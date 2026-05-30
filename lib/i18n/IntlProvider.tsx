'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { useMemo, type ReactNode } from 'react';

import en from '@/lib/i18n/messages/en.json';
import ja from '@/lib/i18n/messages/ja.json';
import { useAppStore } from '@/lib/store';

import type { LanguageCode } from '@/types';

/**
 * Bundle of compile-time-bundled translations. Loaded synchronously so the demo
 * works offline; a production deploy would lazy-load via `next-intl` static imports.
 */
const MESSAGES: Record<LanguageCode, AbstractIntlMessages> = {
  ja: ja as AbstractIntlMessages,
  en: en as AbstractIntlMessages,
  // zh / ko populated in a later commit; fall back to ja until then.
  zh: ja as AbstractIntlMessages,
  ko: ja as AbstractIntlMessages,
};

interface IntlProviderProps {
  children: ReactNode;
}

export function IntlProvider({ children }: IntlProviderProps) {
  const language = useAppStore((s) => s.language);
  const messages = useMemo(() => MESSAGES[language] ?? MESSAGES.ja, [language]);

  return (
    <NextIntlClientProvider
      locale={language}
      messages={messages}
      timeZone="Asia/Tokyo"
      now={new Date()}
    >
      {children}
    </NextIntlClientProvider>
  );
}
