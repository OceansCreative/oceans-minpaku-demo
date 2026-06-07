import type { SliceCreator } from './types';
import type { AppNotification } from '@/types/notification';

export interface NotificationSlice {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  seedNotifications: (notifs: AppNotification[]) => void;
}

export const createNotificationSlice: SliceCreator<NotificationSlice> = (set) => ({
  notifications: [],
  unreadCount: 0,

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  markRead: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    }),

  seedNotifications: (notifs) =>
    set({
      notifications: notifs,
      unreadCount: notifs.filter((n) => !n.read).length,
    }),
});
