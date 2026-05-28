# Oceans Minpaku Demo

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![CI](https://github.com/OceansCreative/oceans-minpaku-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/OceansCreative/oceans-minpaku-demo/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000?logo=vercel)](https://minpaku-demo.oceans-base.com)

> Sample vacation rental (minpaku) booking & operations system. Demo of approval-based flow,
> anti-double-booking, smart lock & OTA integration patterns. Built by
> [OceansBase](https://oceans-base.com).

<!-- TODO(phase-10): hero screenshot -->

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

<!-- TODO(phase-10): mermaid diagram of client / mock layer / store / external integrations -->

## Screenshots

<!-- TODO(phase-10): guest landing, booking calendar, admin dashboard, double-booking warning, mobile -->

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

<!-- TODO(phase-10): click-path for prospective clients and visitors -->

## Design decisions

<!-- TODO(phase-10): 3–5 paragraphs on double-booking prevention, Stripe manual capture rationale, RemoteLOCK choice -->

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
