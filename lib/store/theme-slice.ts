import type { SliceCreator } from './types';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeSlice {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const createThemeSlice: SliceCreator<ThemeSlice> = (set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
});
