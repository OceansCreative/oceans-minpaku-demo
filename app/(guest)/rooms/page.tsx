import { ArrowRight, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Reveal } from '@/components/guest/Reveal';
import { RoomRatingBadge } from '@/components/guest/RoomRatingBadge';
import { WishlistButton } from '@/components/guest/WishlistButton';
import { seedRooms } from '@/lib/seed';

export default function RoomsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Reveal className="mb-10 space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-moss">Rooms</p>
        <h1 className="font-serif text-3xl text-ink dark:text-gray-100">お部屋一覧</h1>
        <p className="max-w-xl text-sm text-ink/60 dark:text-gray-400">
          4室それぞれに異なる眺望と設えをご用意しています。ご利用人数や雰囲気に合わせてお選びください。
        </p>
      </Reveal>
      <ul className="grid gap-6 sm:grid-cols-2">
        {seedRooms.map((room, index) => {
          const cover = room.photos[0];
          return (
            <li key={room.id}>
              <Reveal
                delay={index * 80}
                className="group relative overflow-hidden rounded-2xl border border-ink/10 bg-sand transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <WishlistButton roomId={room.id} className="absolute right-3 top-3 z-10" />
                <Link href={`/rooms/${room.id}`} className="block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-ink/10 dark:bg-gray-700">
                    {cover && (
                      <Image
                        src={cover}
                        alt={room.name}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="space-y-3 px-5 py-4">
                    <div className="flex items-baseline justify-between">
                      <h2 className="font-serif text-xl text-ink dark:text-gray-100">
                        {room.name}
                      </h2>
                      <p className="text-sm text-ink/50 dark:text-gray-400">
                        ¥{room.basePrice.toLocaleString()}{' '}
                        <span className="text-xs text-ink/40 dark:text-gray-500">/ 泊</span>
                      </p>
                    </div>
                    <RoomRatingBadge roomId={room.id} />
                    <p className="text-sm text-ink/70 dark:text-gray-400">{room.description}</p>
                    <div className="flex items-center justify-between pt-2 text-xs text-ink/50 dark:text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        最大 {room.capacity} 名
                      </span>
                      <span className="inline-flex items-center gap-1 text-moss group-hover:gap-2">
                        詳細を見る
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
