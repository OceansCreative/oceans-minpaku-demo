import type { ReminderTemplate } from '@/types';

/**
 * Default reminder templates. `offset` is an ISO 8601 duration relative to check-in
 * (`-P3D` = three days before, `PT0S` = at check-in). Channel `message` posts to the
 * in-app guest thread; `email` would route via the SendGrid mock (Phase 7+).
 */
export const seedReminderTemplates: ReminderTemplate[] = [
  {
    id: 'rem-confirm',
    name: '予約確定通知',
    offset: 'PT0S',
    channel: 'email',
    subject: 'ご予約を承りました — 和庵 山陰',
    body: 'この度はご予約いただきありがとうございます。チェックイン当日はご案内のパスコードでご入室ください。',
    enabled: true,
  },
  {
    id: 'rem-3day',
    name: '3日前リマインド',
    offset: '-P3D',
    channel: 'email',
    subject: '【3日前】チェックインのご案内',
    body: '3日後のご宿泊に向けて、アクセス方法と当日の流れをご案内いたします。',
    enabled: true,
  },
  {
    id: 'rem-day-before',
    name: '前日リマインド + パスコード',
    offset: '-P1D',
    channel: 'message',
    subject: '【前日】パスコードをお送りします',
    body: '明日のチェックインに向けて、玄関のパスコードをお送りします。詳細はマイページよりご確認ください。',
    enabled: true,
  },
  {
    id: 'rem-checkout',
    name: 'チェックアウト時のご案内',
    offset: 'PT10H',
    channel: 'message',
    subject: 'チェックアウトのご案内',
    body: 'チェックアウトのお時間です。ご利用ありがとうございました。',
    enabled: false,
  },
];
