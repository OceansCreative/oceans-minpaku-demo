'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { useMemo, type ReactNode } from 'react';

import en from '@/lib/i18n/messages/en.json';
import ja from '@/lib/i18n/messages/ja.json';
import ko from '@/lib/i18n/messages/ko.json';
import zh from '@/lib/i18n/messages/zh.json';
import { useAppStore } from '@/lib/store';

import type { LanguageCode } from '@/types';

type MessageTree = { [key: string]: string | MessageTree };

/**
 * Recursively overlay `overrides` onto `base`, key by key. Used so a partially
 * translated locale (zh/ko) falls back to the `ja` reference for any key it
 * omits — at every nesting level, not just the top. A shallow `{...ja, ...zh}`
 * would let a present namespace (e.g. `Admin`) shadow ja's entire namespace,
 * dropping fallback for every sibling key the locale hasn't translated yet.
 */
function deepMergeMessages(base: MessageTree, overrides: MessageTree): MessageTree {
  const out: MessageTree = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const baseValue = out[key];
    out[key] =
      typeof value === 'object' && typeof baseValue === 'object'
        ? deepMergeMessages(baseValue, value)
        : value;
  }
  return out;
}

/**
 * Bundle of compile-time-bundled translations. Loaded synchronously so the demo
 * works offline; a production deploy would lazy-load via `next-intl` static imports.
 */
const MESSAGES: Record<LanguageCode, AbstractIntlMessages> = {
  ja: ja as AbstractIntlMessages,
  en: en as AbstractIntlMessages,
  // zh / ko are partially translated; deep-merge over ja so any untranslated
  // key (at any depth) gracefully falls back to the ja reference string.
  zh: deepMergeMessages(ja as MessageTree, zh as MessageTree) as AbstractIntlMessages,
  ko: deepMergeMessages(ja as MessageTree, ko as MessageTree) as AbstractIntlMessages,
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
