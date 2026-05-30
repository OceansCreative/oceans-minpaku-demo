import type { SliceCreator } from './types';
import type { GuestRegister } from '@/types';

export interface GuestRegisterSlice {
  guestRegister: GuestRegister[];
  upsertGuestRegister: (entry: GuestRegister) => void;
  removeGuestRegister: (id: string) => void;
  resetGuestRegisterSlice: () => void;
}

export const createGuestRegisterSlice: SliceCreator<GuestRegisterSlice> = (set) => ({
  guestRegister: [],

  upsertGuestRegister: (entry) =>
    set((state) => {
      const exists = state.guestRegister.some((g) => g.id === entry.id);
      return {
        guestRegister: exists
          ? state.guestRegister.map((g) => (g.id === entry.id ? entry : g))
          : [...state.guestRegister, entry],
      };
    }),

  removeGuestRegister: (id) =>
    set((state) => ({ guestRegister: state.guestRegister.filter((g) => g.id !== id) })),

  resetGuestRegisterSlice: () => set({ guestRegister: [] }),
});
