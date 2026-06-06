import { ArrowRight, Bath, Car, Flame, Wifi } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Reveal } from '@/components/guest/Reveal';
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
          <div className="hero-kenburns absolute inset-0">
            <Image
              src={seedProperty.photos[0] ?? 'https://picsum.photos/seed/waan-hero/1920/1080'}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/40 to-ink/75" />
        </div>

        {/* 縦書き accent — the property name set vertically along the edge. */}
        <span
          aria-hidden
          className="vertical-rl pointer-events-none absolute right-4 top-10 hidden font-serif text-sm tracking-[0.3em] text-sand/55 sm:right-6 lg:block"
        >
          和庵 山陰
        </span>

        <div className="hero-rise mx-auto flex min-h-[64vh] max-w-6xl flex-col justify-end gap-4 px-5 py-12 text-sand sm:min-h-[74vh] sm:gap-6 sm:px-6 sm:py-20">
          <p className="text-[10px] uppercase tracking-[0.4em] text-sand/70 sm:text-xs">
            One-house rental in 山陰 / Sample
          </p>
          <h1 className="max-w-3xl text-balance font-serif text-4xl leading-[1.08] sm:text-5xl md:text-7xl">
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
              className="group inline-flex items-center gap-2 rounded-md bg-sand px-5 py-3 text-sm font-medium text-ink shadow-sm transition-all hover:bg-sand/90 hover:shadow-md"
            >
              お部屋を見る
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

      <section id="concept" className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid gap-12 md:grid-cols-2">
          <Reveal className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-moss">Concept</p>
            <h2 className="font-serif text-3xl text-ink dark:text-gray-100 sm:text-4xl">
              和モダンの一棟貸し、4室
            </h2>
            <p className="text-sm leading-relaxed text-ink/70 dark:text-gray-400">
              旧家を改装した4室の客室と、土間ダイニング、囲炉裏のあるリビング。
              最大10台の駐車場、檜の内風呂、海の見えるテラス。
              一棟貸しなので、ご家族・ご友人だけの時間をお過ごしいただけます。
            </p>
            <p className="text-xs leading-relaxed text-ink/50 dark:text-gray-500">
              住所: {seedProperty.address}（架空）
            </p>
          </Reveal>
          <Reveal delay={120}>
            <ul className="grid grid-cols-2 gap-4">
              {amenityIcons.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-lg border border-ink/10 bg-sand/50 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-moss/30 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-moss/40"
                >
                  <Icon className="h-5 w-5 text-moss" />
                  <span className="text-sm text-ink dark:text-gray-200">{label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-ink/[0.03] px-6 py-12 dark:border-gray-700/60 dark:bg-gray-800/30 sm:py-16">
        <Reveal className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.3em] text-moss">Amenities</p>
          <h2 className="mt-2 font-serif text-2xl text-ink dark:text-gray-100 sm:text-3xl">
            館内設備
          </h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {seedProperty.amenities.map((a) => (
              <li
                key={a}
                className="rounded-full border border-ink/15 bg-sand px-3 py-1 text-xs text-ink/70 transition-colors hover:border-moss/40 hover:text-ink dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-moss/40 dark:hover:text-gray-100"
              >
                {a}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </div>
  );
}
