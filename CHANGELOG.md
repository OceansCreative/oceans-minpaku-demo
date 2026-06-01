# Changelog

All notable changes to this project will be documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows
[SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] — Post-review fixes

External review caught a class of regressions in v1.0.0 that CI missed because
it ran in a single timezone. This release closes them.

### Fixed

- **Pricing date math was TZ-dependent.** `calculateNightlyRates` used
  `getDay()` and `new Date(yyyymmdd)`, so on a runtime with `TZ=America/New_York`
  the weekend matcher saw Thursday for Friday and the existing test fell over.
  Switched the whole service to `getUTCDay` + `parseIsoDate` + `setUTCDate`.
  CI grew a `TZ` matrix (UTC + Asia/Tokyo + America/New_York) so this class of
  bug cannot regress unseen again.
- **RemoteLOCK passcode `validFrom` / `validUntil` were 9 hours late.** The
  approve flow and the overlap-demo seed joined the date and time literally
  then appended `Z`, treating JST wall-clock as UTC. New
  `joinPropertyDateTime()` in `lib/utils/dates.ts` writes the JST offset
  (`+09:00`) explicitly and is used everywhere wall-clock meets ISO. Regression
  tests added in `tests/utils/dates.test.ts`.

### Changed

- Drop the unused `'weekday'` pricing rule type. It was a copy-paste of
  `'weekend'` that no seed, test, or UI ever used.
- Remove the duplicate `PricingRule.type` field; UI now derives the label from
  `condition.type` via a new `PricingRuleType` alias.
- `nightsBetween` jsdoc said "Inclusive" but the implementation has always been
  half-open. Fix the comment, not the maths.

### Performance

- `/admin/sales` First Load JS: **211 kB → 111 kB**. `recharts` is now
  `next/dynamic`-loaded (`ssr: false`).

### Docs

- README no longer references screenshot files that aren't checked in (they
  rendered as broken images on GitHub).
- README is honest about zh/ko coverage (~34%, scaffolding).
- `package.json` version bumped 0.1.0 → 1.0.1; v1.0.0 → 1.0.1 was the audit gap.

## [1.0.0] — Phases 2–10: Full app

### Added

- **Phase 2 — Branding shell**: OceansBase floating badge, footer with contact CTA,
  demo disclaimer banner, welcome modal for first-time visitors, self-tour
  framework (`lib/tour/`).
- **Phase 3 — Guest flow**: property landing, room listing, room detail,
  multi-step booking flow (date range picker with availability colours, time,
  parking slot, dynamic pricing review, guest info form, mock Stripe payment,
  request submission), reservation status page with passcode reveal.
- **Phase 4 — Admin core**: mock authentication (demo / demo) + login screen,
  admin shell with sidebar, reservation list with status/source filters,
  reservation detail with approve / reject actions, RemoteLOCK passcode
  display on approval, pending-count badge in the sidebar.
- **Phase 5 — Calendar & anti-double-booking**: full month calendar with
  source-based colouring, conflicts panel, enhanced red warning UI listing the
  specific conflicting reservations, approval-side guard test (4 cases), iCal
  lag tooltip explaining the approval-gate strategy.
- **Phase 6 — Dashboard & sales**: today's check-in/out widget, last-30-day
  occupancy widget, monthly sales widget, 180-day-cap counter, sales
  aggregation page with day/month/year + range filter (Recharts stacked bars).
- **Phase 7 — Operations**: pricing-rule CRUD, cancellation policy CRUD,
  cancellation flow with deposit deduction + refund preview, reminder template
  CRUD, guest message thread UI, passcode management (reissue / revoke), OTA
  settings page with Airbnb iCal URL config, Booking.com & Agoda expansion
  placeholders.
- **Phase 8 — Compliance mock**: guest register page with the §8 required
  fields, ICT identity verification upload mock, CSV export for the register,
  inline compliance notes covering §6 / §8 / §2-3 obligations.
- **Phase 9 — i18n & responsive**: next-intl provider with ja / en /
  partial zh / ko translation bundles, language switcher in the guest header,
  mobile drawer for the admin sidebar, responsive guest header + hero.
- **Phase 10 — Tour & polish**: self-tour steps wired to the welcome modal,
  sample-data reset page, Noto Sans JP + Cormorant Garamond fonts via
  `next/font`, README screenshots + mermaid architecture diagram + demo
  scenario + design decisions, Japanese README, `docs/portfolio/case-study.md`
  for the OceansBase Sanity feed.

### Changed

- 27 unit tests → 31 unit tests (added approval-overlap guard suite in Phase 5).
- Zustand store grew from 4 slices to 6 (`messages`, `guestRegister` added).

## [0.1.0] — Phase 1: Domain & mock infrastructure

### Added

- **Domain types** (`types/`): `Property`, `Room`, `ParkingSlot`, `Reservation`, `Guest`,
  `GuestRegister`, `PricingRule`, `CancellationPolicy`, `ReminderTemplate`, `Message`.
- **Seed data** (`lib/seed/`): fictional property 和庵 山陰 with 4 rooms and 10 parking
  slots, ±42 days of direct/airbnb-mixed reservations, an intentional overlap pair for
  the anti-double-booking demo, pricing rules (weekend / seasonal / lead-time /
  occupancy), stepped cancellation policy, reminder templates.
- **Zustand store** (`lib/store/`) with `persist` middleware, shared guest⇄admin state
  via `localStorage`. Slices: app, reservation, pricing, policy. `skipHydration: true`
  so SSR doesn't observe `localStorage`.
- **Mock external services** (`lib/mock/`):
  - `stripe.ts` — `createPaymentIntent` (manual capture), `capture`, `cancel`, `refund`
    (partial supported).
  - `remotelock.ts` — `issueCode` / `reissueCode` / `revokeCode`, stay-scoped 6-digit
    codes.
  - `airbnb-ical.ts` — `fetchAirbnbCalendar` with the 2–4h upstream lag exposed in the
    result for UI surfacing.
- **Service layer** (`lib/services/`):
  - `reservation.ts` — `detectOverlap` (pure), `requestReservation`,
    `approveReservation`, `rejectReservation`, `cancelReservation`. Approval re-checks
    for overlap to guard against the iCal race.
  - `pricing.ts` — `calculateNightlyRates`, `calculateStayTotal` (compounding rules,
    season ranges incl. year boundary wrap), `calculateCancellationFee` (stepped
    policy with fall-through to strictest).
- **Vitest** harness with jsdom + Testing Library, 27 unit tests covering pricing,
  overlap detection, and cancellation fee. CI now runs `npm test` before build.

### Changed

- `lint-staged` now runs Prettier after ESLint so its import-order rule can't leave
  un-formatted blank lines behind.

## [0.0.0] — Phase 0: Repository foundation

### Added

- Next.js 15 + TypeScript scaffold with strict mode.
- Tailwind CSS with a Wa-modern colour seed (`ink`, `sumi`, `sand`, `moss`, `crimson`).
- ESLint (Next + import-order) + Prettier + husky + lint-staged.
- GitHub Actions CI: format check → lint → typecheck → build.
- Apache 2.0 LICENSE + NOTICE with mock-integration disclaimer.
- Initial English-first README with sections deferred to Phase 10 marked `TODO`.
