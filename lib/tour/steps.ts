import type { TourStep } from './types';

/**
 * The default self-tour. Walks a visitor from the public site through a booking
 * request, then over to the admin side to demonstrate the approval and the
 * anti-double-booking guard.
 */
export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'tour-1-rooms',
    title: 'まずはお部屋をご覧ください',
    body: '4室それぞれに眺望と設えが異なります。気になるお部屋から予約に進めます。',
    navigateTo: '/rooms',
    ctaLabel: '次へ',
  },
  {
    id: 'tour-2-pricing',
    title: '料金は週末・季節で変動します',
    body: 'ご予約フローのカレンダーで日付を選ぶと、ルール適用後の内訳が確認できます。料金確認画面まで進んでみてください。',
    ctaLabel: '管理側へ',
  },
  {
    id: 'tour-3-admin',
    title: '管理画面に切り替えます',
    body: 'demo / demo でログインできます。承認待ちの予約に対して、承認 / 却下が選べます。',
    navigateTo: '/admin/reservations',
    ctaLabel: '次へ',
  },
  {
    id: 'tour-4-conflict',
    title: 'ダブルブッキング防止デモ',
    body: '一覧から「res-overlap-direct」を開いてみてください。Airbnb 経路の既存予約と重なるため、承認ボタンは赤い警告でブロックされます。',
    navigateTo: '/admin/calendar',
    ctaLabel: '次へ',
  },
  {
    id: 'tour-5-cta',
    title: 'OceansBase へご相談ください',
    body: 'このような業務システムの設計・開発を承っています。フッターの「OceansBase に相談する」からどうぞ。',
    ctaLabel: 'ツアー完了',
  },
];
