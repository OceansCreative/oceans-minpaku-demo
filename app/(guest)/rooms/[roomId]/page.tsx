import { ArrowLeft, ArrowRight, Bath, Calendar, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AvailabilityCalendar } from '@/components/guest/AvailabilityCalendar';
import { RoomReviews } from '@/components/guest/RoomReviews';
import { seedProperty, seedRooms } from '@/lib/seed';

interface RoomDetailPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { roomId } = await params;
  const room = seedRooms.find((r) => r.id === roomId);
  if (!room) notFound();

  const cover = room.photos[0];
  const gallery = room.photos.slice(1);

  return (
    <article className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/rooms"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink dark:text-gray-500 dark:hover:text-gray-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        お部屋一覧へ戻る
      </Link>

      <header className="mb-8 grid gap-6 md:grid-cols-[1.6fr,1fr]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ink/10 dark:bg-gray-700">
          {cover && <Image src={cover} alt={room.name} fill className="object-cover" priority />}
        </div>
        <div className="grid gap-3">
          {gallery.map((src, i) => (
            <div
              key={src}
              className="relative aspect-[16/10] overflow-hidden rounded-xl bg-ink/10 dark:bg-gray-700"
            >
              <Image src={src} alt={`${room.name} ${i + 2}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      </header>

      <div className="grid gap-12 md:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-moss">
              {seedProperty.name} / Room
            </p>
            <h1 className="font-serif text-3xl text-ink dark:text-gray-100">{room.name}</h1>
            <p className="text-sm leading-relaxed text-ink/70 dark:text-gray-400">
              {room.description}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 border-y border-ink/10 py-5 text-sm dark:border-gray-700">
            <div className="space-y-1">
              <dt className="text-xs text-ink/40 dark:text-gray-500">最大宿泊人数</dt>
              <dd className="inline-flex items-center gap-1 text-ink dark:text-gray-200">
                <Users className="h-4 w-4 text-moss" />
                {room.capacity} 名
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-ink/40 dark:text-gray-500">基本料金</dt>
              <dd className="text-ink dark:text-gray-200">
                ¥{room.basePrice.toLocaleString()} / 泊
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-ink/40 dark:text-gray-500">設備</dt>
              <dd className="inline-flex items-center gap-1 text-ink dark:text-gray-200">
                <Bath className="h-4 w-4 text-moss" />
                内風呂付き
              </dd>
            </div>
          </dl>
          <div className="space-y-2">
            <h2 className="font-serif text-lg text-ink dark:text-gray-100">館内設備</h2>
            <ul className="flex flex-wrap gap-2">
              {seedProperty.amenities.map((a) => (
                <li
                  key={a}
                  className="rounded-full border border-ink/15 bg-ink/[0.02] px-3 py-1 text-xs text-ink/70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <AvailabilityCalendar roomId={room.id} basePrice={room.basePrice} />

          <RoomReviews roomId={room.id} />
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-ink/10 bg-sand/60 p-6 dark:border-gray-700 dark:bg-gray-800/60">
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-ink/50 dark:text-gray-400">基本料金</p>
            <p className="font-serif text-2xl text-ink dark:text-gray-100">
              ¥{room.basePrice.toLocaleString()}
              <span className="ml-1 text-xs text-ink/40 dark:text-gray-500">/ 泊</span>
            </p>
          </div>
          <p className="text-[11px] leading-relaxed text-ink/50 dark:text-gray-400">
            週末・季節・予約タイミングにより料金が変動します。次の画面で内訳を確認できます。
          </p>
          <Link
            href={`/rooms/${room.id}/book`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-medium text-sand transition-colors hover:bg-ink/90 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            <Calendar className="h-4 w-4" />
            このお部屋を予約する
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="border-t border-ink/10 pt-3 text-[11px] text-ink/40 dark:border-gray-700 dark:text-gray-500">
            予約は申し込み後、ホストの承認をもって確定します。承認後にスマートロックのパスコードを発行します。
          </p>
        </aside>
      </div>
    </article>
  );
}
