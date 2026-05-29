import type { ParkingSlot, Property, Room } from '@/types';

/**
 * Fictional property used throughout the demo.
 * Concept: 1棟貸し, 4室, 駐車10台, 和モダン (per SPEC §9).
 *
 * The name and address are intentionally generic — no real client / facility is depicted.
 */
export const seedProperty: Property = {
  id: 'prop-waan-sanin',
  name: '和庵 山陰',
  address: '山陰地方 架空町 1-2-3',
  description:
    '海風が抜ける旧家を改装した一棟貸しの和モダン宿。檜の内風呂、土間ダイニング、囲炉裏のあるリビング。',
  amenities: [
    '檜風呂',
    '囲炉裏',
    'BBQテラス',
    '高速Wi-Fi',
    '全室空調',
    'プロジェクター',
    '電気自動車充電器',
    'ペット可（一室のみ）',
  ],
  photos: [
    'https://picsum.photos/seed/waan-exterior/1280/720',
    'https://picsum.photos/seed/waan-irori/1280/720',
    'https://picsum.photos/seed/waan-bath/1280/720',
  ],
};

export const seedRooms: Room[] = [
  {
    id: 'room-tsuki',
    propertyId: seedProperty.id,
    name: '月の間',
    capacity: 2,
    basePrice: 24_000,
    description: '庭園を望む和室。檜の半露天風呂付き。',
    photos: [
      'https://picsum.photos/seed/tsuki-1/1280/720',
      'https://picsum.photos/seed/tsuki-2/1280/720',
    ],
  },
  {
    id: 'room-hoshi',
    propertyId: seedProperty.id,
    name: '星の間',
    capacity: 3,
    basePrice: 28_000,
    description: '天窓から星空が見える離れ。専用テラス。',
    photos: [
      'https://picsum.photos/seed/hoshi-1/1280/720',
      'https://picsum.photos/seed/hoshi-2/1280/720',
    ],
  },
  {
    id: 'room-kaze',
    propertyId: seedProperty.id,
    name: '風の間',
    capacity: 4,
    basePrice: 32_000,
    description: '海風が通り抜ける角部屋。最大4名利用可。',
    photos: [
      'https://picsum.photos/seed/kaze-1/1280/720',
      'https://picsum.photos/seed/kaze-2/1280/720',
    ],
  },
  {
    id: 'room-tsuchi',
    propertyId: seedProperty.id,
    name: '土の間',
    capacity: 6,
    basePrice: 42_000,
    description: '土間ダイニング併設のグループ向け広間。最大6名。',
    photos: [
      'https://picsum.photos/seed/tsuchi-1/1280/720',
      'https://picsum.photos/seed/tsuchi-2/1280/720',
    ],
  },
];

export const seedParkingSlots: ParkingSlot[] = Array.from({ length: 10 }, (_, i) => ({
  id: `parking-${String(i + 1).padStart(2, '0')}`,
  propertyId: seedProperty.id,
  label: `P${i + 1}`,
}));
