import type { SliceCreator } from './types';
import type { SelectedAddon } from '@/types/addon';

export interface AddonSlice {
  selectedAddons: SelectedAddon[];
  /** Toggle an add-on on/off (quantity = 1). */
  toggleAddon: (addonId: string) => void;
  clearAddons: () => void;
}

export const createAddonSlice: SliceCreator<AddonSlice> = (set) => ({
  selectedAddons: [],

  toggleAddon: (addonId) =>
    set((state) => {
      const exists = state.selectedAddons.some((a) => a.addonId === addonId);
      return {
        selectedAddons: exists
          ? state.selectedAddons.filter((a) => a.addonId !== addonId)
          : [...state.selectedAddons, { addonId, quantity: 1 }],
      };
    }),

  clearAddons: () => set({ selectedAddons: [] }),
});
