# Changelog

All notable changes to this project will be documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows
[SemVer](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
