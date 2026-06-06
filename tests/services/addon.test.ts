import { describe, expect, it } from 'vitest';

import { seedAddons } from '@/lib/seed/addons';
import { calculateAddonTotal, getSelectedAddonDetails } from '@/lib/services/addon';

import type { BookingAddon, SelectedAddon } from '@/types/addon';

const allAddons: BookingAddon[] = [
  { id: 'addon-bbq', name: 'addons.bbq', pricePerStay: 3000, icon: '🔥', available: true },
  { id: 'addon-sauna', name: 'addons.sauna', pricePerStay: 5000, icon: '🧖', available: true },
  {
    id: 'addon-bicycle',
    name: 'addons.bicycle',
    pricePerStay: 1500,
    icon: '🚲',
    available: true,
  },
];

describe('calculateAddonTotal', () => {
  it('returns 0 for empty selection', () => {
    expect(calculateAddonTotal([], allAddons)).toBe(0);
  });

  it('returns correct sum for 2 addons', () => {
    const selected: SelectedAddon[] = [
      { addonId: 'addon-bbq', quantity: 1 },
      { addonId: 'addon-sauna', quantity: 1 },
    ];
    // 3000 + 5000 = 8000
    expect(calculateAddonTotal(selected, allAddons)).toBe(8000);
  });

  it('accounts for quantity > 1', () => {
    const selected: SelectedAddon[] = [{ addonId: 'addon-bicycle', quantity: 2 }];
    // 1500 * 2 = 3000
    expect(calculateAddonTotal(selected, allAddons)).toBe(3000);
  });

  it('ignores unknown addonIds', () => {
    const selected: SelectedAddon[] = [
      { addonId: 'addon-bbq', quantity: 1 },
      { addonId: 'addon-unknown', quantity: 1 },
    ];
    expect(calculateAddonTotal(selected, allAddons)).toBe(3000);
  });

  it('returns 0 when all addonIds are unknown', () => {
    const selected: SelectedAddon[] = [{ addonId: 'addon-does-not-exist', quantity: 1 }];
    expect(calculateAddonTotal(selected, allAddons)).toBe(0);
  });
});

describe('getSelectedAddonDetails', () => {
  it('returns correct enriched list', () => {
    const selected: SelectedAddon[] = [
      { addonId: 'addon-bbq', quantity: 1 },
      { addonId: 'addon-bicycle', quantity: 2 },
    ];
    const details = getSelectedAddonDetails(selected, allAddons);
    expect(details).toHaveLength(2);

    const bbq = details.find((d) => d.addon.id === 'addon-bbq');
    expect(bbq).toBeDefined();
    expect(bbq?.quantity).toBe(1);
    expect(bbq?.subtotal).toBe(3000);

    const bicycle = details.find((d) => d.addon.id === 'addon-bicycle');
    expect(bicycle).toBeDefined();
    expect(bicycle?.quantity).toBe(2);
    expect(bicycle?.subtotal).toBe(3000);
  });

  it('skips unknown addonIds', () => {
    const selected: SelectedAddon[] = [
      { addonId: 'addon-bbq', quantity: 1 },
      { addonId: 'addon-nonexistent', quantity: 1 },
    ];
    const details = getSelectedAddonDetails(selected, allAddons);
    expect(details).toHaveLength(1);
    expect(details[0]?.addon.id).toBe('addon-bbq');
  });

  it('returns empty array for empty selection', () => {
    expect(getSelectedAddonDetails([], allAddons)).toHaveLength(0);
  });

  it('returns empty array when all addonIds are unknown', () => {
    const selected: SelectedAddon[] = [{ addonId: 'nope', quantity: 1 }];
    expect(getSelectedAddonDetails(selected, allAddons)).toHaveLength(0);
  });
});

describe('seedAddons', () => {
  it('contains 5 addons', () => {
    expect(seedAddons).toHaveLength(5);
  });

  it('all addons have positive pricePerStay', () => {
    for (const addon of seedAddons) {
      expect(addon.pricePerStay).toBeGreaterThan(0);
    }
  });

  it('all addons are available', () => {
    for (const addon of seedAddons) {
      expect(addon.available).toBe(true);
    }
  });
});
