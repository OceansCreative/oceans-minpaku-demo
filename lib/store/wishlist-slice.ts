import type { SliceCreator } from './types';

export interface WishlistSlice {
  wishlist: string[];
  toggleWishlist: (roomId: string) => void;
  isWishlisted: (roomId: string) => boolean;
  clearWishlist: () => void;
}

export const createWishlistSlice: SliceCreator<WishlistSlice> = (set, get) => ({
  wishlist: [],

  toggleWishlist: (roomId) =>
    set((state) => ({
      wishlist: state.wishlist.includes(roomId)
        ? state.wishlist.filter((id) => id !== roomId)
        : [...state.wishlist, roomId],
    })),

  isWishlisted: (roomId) => get().wishlist.includes(roomId),

  clearWishlist: () => set({ wishlist: [] }),
});
