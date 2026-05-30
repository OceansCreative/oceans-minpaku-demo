# Oceans Minpaku Demo

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![CI](https://github.com/OceansCreative/oceans-minpaku-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/OceansCreative/oceans-minpaku-demo/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?logo=vercel)](https://minpaku-demo.oceans-base.com)

> Sample vacation rental (minpaku) booking & operations system. Demo of approval-based flow,
> anti-double-booking, smart lock & OTA integration patterns. Built by
> [OceansBase](https://oceans-base.com).

![和庵 山陰 — landing screenshot](./docs/portfolio/screenshots/hero-landing.png)

> Screenshot placeholders live under `docs/portfolio/screenshots/`. Run the app
> locally and replace them with real captures before posting to Pin.

## Live demo

**[minpaku-demo.oceans-base.com](https://minpaku-demo.oceans-base.com)**

No credentials required for the guest flow. For the admin side, sign in with `demo` / `demo`.

## Highlights

- **Approval-based booking flow** with Stripe manual capture — authorize on request, capture only
  after the host approves.
- **Anti-double-booking enforcement** at admin approval — the calendar refuses overlapping confirms
  even when an OTA channel races us.
- **Smart lock (RemoteLOCK) passcode** auto-issuance — stay-scoped numeric codes generated on
  approval, revoked on cancellation.
- **OTA (Airbnb iCal) sync** pattern with explicit lag disclosure — the approval gate is the final
  guard against the 2–4 hour iCal delay.
- **住宅宿泊事業法 (Japanese vacation rental law) compliance UI** — guest register, ID upload,
  180-day cap counter.
- **i18n** — full ja/en, partial zh/ko.

## Tech stack

- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS for styling
- Zustand for state (`persist` middleware, shared guest ⇄ admin store)
- Recharts for analytics
- next-intl for i18n
- Vitest + Testing Library for unit tests
- ESLint + Prettier + husky + lint-staged
- GitHub Actions CI (typecheck / lint / format / build)

## Architecture

```mermaid
flowchart LR
  subgraph Client[Next.js 15 App Router]
    Guest[Guest pages\n/app/(guest)/]
    Admin[Admin pages\n/app/admin/]
  end
  Store[(Zustand store\npersist → localStorage)]
  subgraph Services[lib/services]
    Resv[reservation service\ndetectOverlap + orchestration]
    Pricing[pricing service\ndynamic rates + cancellation fee]
  end
  subgraph Mocks[lib/mock]
    Stripe[stripe.ts]
    RL[remotelock.ts]
    Airbnb[airbnb-ical.ts]
  end
  External[(Stripe API\nRemoteLOCK\nAirbnb iCal)]

  Guest -->|hooks| Store
  Admin -->|hooks| Store
  Guest --> Resv
  Admin --> Resv
  Admin --> Pricing
  Resv --> Stripe
  Resv --> RL
  Admin --> Airbnb
  Stripe -. swap in prod .-> External
  RL -. swap in prod .-> External
  Airbnb -. swap in prod .-> External
```

The mock layer (`lib/mock/`) is the only place that touches external services in
this demo. Each file starts with a `// ===== MOCK: 本番では実API（◯◯）に差し替え =====`
banner so production replacement is a search-and-swap.

## Screenshots

| Guest landing                                       | Booking calendar                                       | Admin dashboard                                       |
| --------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| ![](./docs/portfolio/screenshots/guest-landing.png) | ![](./docs/portfolio/screenshots/booking-calendar.png) | ![](./docs/portfolio/screenshots/admin-dashboard.png) |

| Double-booking warning                                       | Mobile                                       |
| ------------------------------------------------------------ | -------------------------------------------- |
| ![](./docs/portfolio/screenshots/double-booking-warning.png) | ![](./docs/portfolio/screenshots/mobile.png) |

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the guest site and
[http://localhost:3000/admin](http://localhost:3000/admin) for the admin console.

## Demo credentials

```
admin: demo / demo
```

## Demo scenario

1. **Browse rooms** at `/rooms`, open 月の間, and click "このお部屋を予約する".
2. **Pick a date range** the calendar lets you book — past + already-booked nights
   are greyed out automatically.
3. Step through **time → parking → 料金確認 → ゲスト情報 → 決済 (mock card)** and
   submit. You'll land on the reservation status page with a `pending` badge.
4. **Sign in** at `/admin/login` with `demo` / `demo`. The sidebar shows a red
   "1" badge on 予約管理.
5. Open your new reservation and click **承認する** — Stripe captures, RemoteLOCK
   issues a 6-digit passcode, and the guest-side status page flips to `approved`
   with the code revealed.
6. Now open the deliberately-conflicting demo pair: navigate to カレンダー and
   click into `res-overlap-direct`. The approve button is disabled and a red
   warning lists the existing Airbnb-sourced reservation it would collide with.
7. Cancel an approved reservation to see the cancellation policy compute the
   deposit retention and refund the difference.
8. Try the **語切替え** (header globe icon) and watch the landing page swap into
   English / 中文 / 한국어 (partial).
9. Hit **サンプルデータ → リセット** in the admin sidebar to start over.

## Design decisions

**Anti-double-booking is a defence-in-depth, not a single check.**
Direct bookings claim inventory atomically at submit time via `requestReservation`.
But Airbnb's iCal export updates every 2–4 hours, so an instant-book on Airbnb
_can_ race our system. The approval gate is the final guard: `approveReservation`
re-runs `detectOverlap` against the latest store snapshot, refuses to capture if
anything new has landed, and surfaces a red warning to the host so they choose
which booking to keep. The pure `detectOverlap` function lives in
`lib/services/reservation.ts` and is covered by 12 unit tests including the
adjacent-stay edge case (checkout day is free for the next guest).

**Stripe manual capture matches the host's emotional model.**
The host wants to vet the guest before committing the room. Auto-capture would
either hold the inventory while the money sits in limbo or commit the money
before the host says yes — both bad. Manual capture (`createPaymentIntent`
without auto-capture) holds the authorization, lets the host approve or reject,
and only takes the money on the host's explicit click. Cancellation routes
through `refundPaymentIntent` with partial-refund support so the cancellation
policy can retain a deposit.

**RemoteLOCK over a custom key handoff.**
Codes are stay-scoped (valid only from check-in time to check-out time), rotatable
on guest request, and revoked on cancellation. The `lib/mock/remotelock.ts`
surface mirrors the three operations we actually need — `issueCode`,
`reissueCode`, `revokeCode` — so swapping in the real RemoteLOCK Connect API in
production is a one-file change.

**Zustand + persist, single store across guest and admin.**
Because the demo lives entirely in the browser, approving on the admin side
needs to be visible on the guest's status page immediately. A single Zustand
store persisted to `localStorage` is the simplest thing that works. SSR safety
is handled by `skipHydration: true` plus a client-side `hydrateAppStore()` in
`AppProviders`.

**Mock layer is the _only_ place external services are touched.**
Every file under `lib/mock/` opens with `// ===== MOCK: 本番では実API（◯◯）に
差し替え =====`. Replacing the demo with a real Stripe + RemoteLOCK + Airbnb
deployment is a search-and-swap on those three files, not a refactor of the UI
or the service layer.

## Disclaimer

This is a portfolio sample published by OceansBase. External integrations (Stripe, RemoteLOCK,
Airbnb) are **mocked** — no real payments, no real lock provisioning, no real OTA traffic. The
codebase is not production-ready as-is; commercial deployment requires additional implementation,
contracts, and legal/regulatory work.

## About OceansBase

[OceansBase](https://oceans-base.com) builds custom booking and operations systems for the
hospitality industry in Japan. If you are evaluating a build like this for your own property or
brand, [get in touch](https://oceans-base.com/contact).

## License

Released under the [Apache License 2.0](./LICENSE). See [NOTICE](./NOTICE) for attribution and the
mock-integration disclaimer.

## 日本語版

日本語の README は [README_ja.md](./README_ja.md) を参照してください。（Phase 10 で整備）
