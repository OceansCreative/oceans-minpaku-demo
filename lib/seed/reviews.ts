import type { GuestReview } from '@/types';

/**
 * Sample guest reviews for the demo property.
 * Room IDs: room-tsuki, room-hoshi, room-kaze, room-tsuchi
 */
export const seedReviews: GuestReview[] = [
  {
    id: 'review-001',
    reservationId: 'res-seed-001',
    roomId: 'room-tsuki',
    guestName: 'タナカ ケンジ',
    rating: 5,
    comment:
      '檜の半露天風呂が最高でした。庭園の眺めも素晴らしく、朝早く起きて縁側でお茶を楽しみました。また必ず来たいと思います。',
    createdAt: '2025-09-15',
  },
  {
    id: 'review-002',
    reservationId: 'res-seed-002',
    roomId: 'room-hoshi',
    guestName: 'Yuki Sato',
    rating: 5,
    comment:
      '天窓から星空が見えて感動しました。専用テラスでの夕食が忘れられない思い出になりました。スタッフの対応も丁寧で安心して過ごせました。',
    createdAt: '2025-10-22',
  },
  {
    id: 'review-003',
    reservationId: 'res-seed-003',
    roomId: 'room-kaze',
    guestName: 'ヤマモト ユウコ',
    rating: 4,
    comment:
      '海風が心地よく、とても快適なお部屋でした。4名で利用しましたが広々としていてゆったりできました。チェックインの手続きがもう少しスムーズだとさらに良かったです。',
    createdAt: '2025-11-03',
  },
  {
    id: 'review-004',
    reservationId: 'res-seed-004',
    roomId: 'room-tsuchi',
    guestName: 'Hiroshi Nakamura',
    rating: 5,
    comment:
      '家族6人で宿泊しました。土間ダイニングが広くて子供たちも大喜びでした。囲炉裏を囲んで食事する体験は格別で、日本の原風景に触れた気がします。',
    createdAt: '2025-12-28',
  },
  {
    id: 'review-005',
    reservationId: 'res-seed-005',
    roomId: 'room-tsuki',
    guestName: 'スズキ ミホ',
    rating: 4,
    comment:
      '記念日に利用しました。お部屋は清潔感があり、アメニティも充実していました。BBQテラスも楽しめて大満足です。次回は長めに滞在したいです。',
    createdAt: '2026-01-18',
  },
  {
    id: 'review-006',
    reservationId: 'res-seed-006',
    roomId: 'room-hoshi',
    guestName: 'Keiko Watanabe',
    rating: 3,
    comment:
      '星空は綺麗でしたが、近隣の騒音が少し気になりました。設備は整っており、過ごしやすかったです。料金に見合った満足感は得られました。',
    createdAt: '2026-02-10',
  },
  {
    id: 'review-007',
    reservationId: 'res-seed-007',
    roomId: 'room-kaze',
    guestName: 'イトウ ダイスケ',
    rating: 5,
    comment:
      '最高のロケーションです。海風が本当に気持ちよく、夏の時期に訪れて正解でした。電気自動車の充電器があったのも助かりました。ぜひまた利用したいです。',
    createdAt: '2026-03-05',
  },
  {
    id: 'review-008',
    reservationId: 'res-seed-008',
    roomId: 'room-tsuchi',
    guestName: 'Tomoko Ishida',
    rating: 4,
    comment:
      '友人グループ5名で利用しました。広々とした空間で、みんなでワイワイ楽しめました。プロジェクターで映画鑑賞もでき、充実した時間を過ごせました。',
    createdAt: '2026-04-20',
  },
];
