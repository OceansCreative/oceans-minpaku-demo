import type { LanguageCode } from './common';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  language: LanguageCode;
}

/**
 * 宿泊者名簿 (housing accommodation business act, art. 8) record.
 * One per stayer, not per reservation — group bookings produce multiple entries.
 */
export interface GuestRegister {
  id: string;
  reservationId: string;
  name: string;
  nationality: string;
  passportNumber?: string;
  profession: string;
  idImageUrl?: string;
}
