import type { SliceCreator } from './types';
import type { Message } from '@/types';

export interface MessagesSlice {
  messages: Message[];
  appendMessage: (message: Message) => void;
  clearMessagesForReservation: (reservationId: string) => void;
  resetMessagesSlice: () => void;
}

export const createMessagesSlice: SliceCreator<MessagesSlice> = (set) => ({
  messages: [],

  appendMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  clearMessagesForReservation: (reservationId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.reservationId !== reservationId),
    })),

  resetMessagesSlice: () => set({ messages: [] }),
});
