import { ArrowRight, Bath, Car, Flame, Wifi } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { seedProperty } from '@/lib/seed';

const amenityIcons = [
  { icon: Bath, label: '檜風呂' },
  { icon: Flame, label: '囲炉裏' },
  { icon: Car, label: '駐車10台' },
  { icon: Wifi, label: '高速Wi-Fi' },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={seedProperty.photos[0] ?? 'https://picsum.photos/seed/waan-hero/1920/1080'}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/40 to-ink/70" />
        </div>
        <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-end gap-4 px-5 py-12 text-sand sm:min-h-[68vh] sm:gap-6 sm:px-6 sm:py-16">
          <p className="text-[10px] uppercase tracking-[0.4em] text-sand/70 sm:text-xs">
            One-house rental in 山陰 / Sample
          </p>
          <h1 className="max-w-2xl font-serif text-3xl leading-tight sm:text-4xl md:text-6xl">
            海風の通る旧家で、
            <br />
            ひと組のための時間を。
          </h1>
          <p className="max-w-xl text-[13px] leading-relaxed text-sand/80 sm:text-sm md:text-base">
            {seedProperty.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 rounded-md bg-sand px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-sand/90"
            >
              お部屋を見る
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#concept"
              className="rounded-md border border-sand/40 px-5 py-3 text-sm text-sand transition-colors hover:bg-sand/10"
            >
              施設の特徴
            </Link>
          </div>
        </div>
      </section>

      <section id="concept" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-moss">Concept</p>
            <h2 className="font-serif text-3xl text-ink">和モダンの一棟貸し、4室</h2>
            <p className="text-sm leading-relaxed text-ink/70">
              旧家を改装した4室の客室と、土間ダイニング、囲炉裏のあるリビング。
              最大10台の駐車場、檜の内風呂、海の見えるテラス。
              一棟貸しなので、ご家族・ご友人だけの時間をお過ごしいただけます。
            </p>
            <p className="text-xs leading-relaxed text-ink/50">
              住所: {seedProperty.address}（架空）
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-4">
            {amenityIcons.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 rounded-lg border border-ink/10 bg-sand/50 px-4 py-3"
              >
                <Icon className="h-5 w-5 text-moss" />
                <span className="text-sm text-ink">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-ink/[0.03] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.3em] text-moss">Amenities</p>
          <h2 className="mt-2 font-serif text-2xl text-ink">館内設備</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {seedProperty.amenities.map((a) => (
              <li
                key={a}
                className="rounded-full border border-ink/15 bg-sand px-3 py-1 text-xs text-ink/70"
              >
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
