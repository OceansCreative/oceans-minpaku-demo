import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BookingFlow } from '@/components/guest/BookingFlow';
import { seedRooms } from '@/lib/seed';

interface BookPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { roomId } = await params;
  const room = seedRooms.find((r) => r.id === roomId);
  if (!room) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href={`/rooms/${room.id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        お部屋の詳細へ戻る
      </Link>
      <div className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-moss">Booking</p>
        <h1 className="font-serif text-3xl text-ink">{room.name} のご予約</h1>
        <p className="text-sm text-ink/60">
          チェックイン日とチェックアウト日をカレンダーからお選びください。
        </p>
      </div>
      <BookingFlow room={room} />
    </div>
  );
}
