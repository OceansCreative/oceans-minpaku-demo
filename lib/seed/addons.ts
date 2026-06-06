import type { BookingAddon } from '@/types/addon';

export const seedAddons: BookingAddon[] = [
  { id: 'addon-bbq', name: 'addons.bbq', pricePerStay: 3000, icon: '🔥', available: true },
  {
    id: 'addon-breakfast',
    name: 'addons.breakfast',
    pricePerStay: 2000,
    icon: '🍳',
    available: true,
  },
  { id: 'addon-sauna', name: 'addons.sauna', pricePerStay: 5000, icon: '🧖', available: true },
  {
    id: 'addon-bicycle',
    name: 'addons.bicycle',
    pricePerStay: 1500,
    icon: '🚲',
    available: true,
  },
  {
    id: 'addon-late-checkout',
    name: 'addons.lateCheckout',
    pricePerStay: 2500,
    icon: '🕐',
    available: true,
  },
];
