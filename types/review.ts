export interface GuestReview {
  id: string;
  reservationId: string;
  roomId: string;
  guestName: string;
  rating: number; // 1-5 integer
  comment: string;
  createdAt: string; // ISO date string (YYYY-MM-DD)
}
