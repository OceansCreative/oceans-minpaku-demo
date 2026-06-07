import {
  createOverlapDemoReservations,
  createSeedReservations,
  seedGuests,
  seedParkingSlots,
  seedProperty,
  seedRooms,
} from '@/lib/seed';
import { buildNotificationsFromReservations } from '@/lib/services/notifications';
import { toIsoDate } from '@/lib/utils/dates';

import type { SliceCreator } from './types';
import type {
  Guest,
  ParkingSlot,
  Passcode,
  Property,
  Reservation,
  ReservationPayment,
  ReservationStatus,
  Room,
} from '@/types';

export interface ReservationSlice {
  property: Property;
  rooms: Room[];
  parkingSlots: ParkingSlot[];
  guests: Guest[];
  reservations: Reservation[];

  upsertGuest: (guest: Guest) => void;
  upsertReservation: (reservation: Reservation) => void;
  setReservationStatus: (id: string, status: ReservationStatus) => void;
  setReservationPayment: (id: string, payment: ReservationPayment) => void;
  setReservationPasscode: (id: string, passcode: Passcode | undefined) => void;
  removeReservation: (id: string) => void;
  resetReservationSlice: () => void;
}

/** Build the initial reservation set anchored at `anchorIso` (string for persist roundtrip). */
export function buildInitialReservations(anchorIso: string): Reservation[] {
  const anchor = new Date(anchorIso);
  return [...createSeedReservations(anchor), ...createOverlapDemoReservations(anchor)];
}

export const createReservationSlice: SliceCreator<ReservationSlice> = (set, get) => ({
  property: seedProperty,
  rooms: seedRooms,
  parkingSlots: seedParkingSlots,
  guests: seedGuests,
  reservations: buildInitialReservations(new Date().toISOString()),

  upsertGuest: (guest) =>
    set((state) => {
      const exists = state.guests.some((g) => g.id === guest.id);
      return {
        guests: exists
          ? state.guests.map((g) => (g.id === guest.id ? guest : g))
          : [...state.guests, guest],
      };
    }),

  upsertReservation: (reservation) =>
    set((state) => {
      const exists = state.reservations.some((r) => r.id === reservation.id);
      const nextReservations = exists
        ? state.reservations.map((r) => (r.id === reservation.id ? reservation : r))
        : [...state.reservations, reservation];
      const today = toIsoDate(new Date());
      const notifs = buildNotificationsFromReservations(nextReservations, today);
      return {
        reservations: nextReservations,
        notifications: notifs,
        unreadCount: notifs.filter((n) => !n.read).length,
      };
    }),

  setReservationStatus: (id, status) =>
    set((state) => ({
      reservations: state.reservations.map((r) => (r.id === id ? { ...r, status } : r)),
    })),

  setReservationPayment: (id, payment) =>
    set((state) => ({
      reservations: state.reservations.map((r) => (r.id === id ? { ...r, payment } : r)),
    })),

  setReservationPasscode: (id, passcode) =>
    set((state) => ({
      reservations: state.reservations.map((r) => (r.id === id ? { ...r, passcode } : r)),
    })),

  removeReservation: (id) =>
    set((state) => ({
      reservations: state.reservations.filter((r) => r.id !== id),
    })),

  resetReservationSlice: () => {
    const anchorIso = get().seedAnchorIso ?? new Date().toISOString();
    set({
      property: seedProperty,
      rooms: seedRooms,
      parkingSlots: seedParkingSlots,
      guests: seedGuests,
      reservations: buildInitialReservations(anchorIso),
    });
  },
});
