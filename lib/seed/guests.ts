import type { Guest } from '@/types';

/**
 * Seed guests, intentionally varied across nationalities so the i18n surface
 * (ja / en / zh / ko) shows up in admin tables and message threads.
 */
export const seedGuests: Guest[] = [
  {
    id: 'guest-yamada',
    name: '山田 太郎',
    email: 'yamada@example.test',
    phone: '+81-90-0000-0001',
    nationality: 'JP',
    language: 'ja',
  },
  {
    id: 'guest-smith',
    name: 'Anna Smith',
    email: 'anna.smith@example.test',
    phone: '+1-415-555-0102',
    nationality: 'US',
    language: 'en',
  },
  {
    id: 'guest-chen',
    name: '陳 美玲',
    email: 'chen.meiling@example.test',
    phone: '+886-988-555-0103',
    nationality: 'TW',
    language: 'zh',
  },
  {
    id: 'guest-park',
    name: '박 지훈',
    email: 'park.jihoon@example.test',
    phone: '+82-10-5555-0104',
    nationality: 'KR',
    language: 'ko',
  },
  {
    id: 'guest-suzuki',
    name: '鈴木 花子',
    email: 'suzuki@example.test',
    phone: '+81-90-0000-0005',
    nationality: 'JP',
    language: 'ja',
  },
  {
    id: 'guest-wong',
    name: 'David Wong',
    email: 'david.wong@example.test',
    phone: '+852-9555-0106',
    nationality: 'HK',
    language: 'en',
  },
];
