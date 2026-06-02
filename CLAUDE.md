# CLAUDE.md

Guidance for Claude Code (and any contributor) working in this repo.

## What this is

`oceans-minpaku-demo` — a 民泊 (vacation-rental) booking & operations sample built
as an OceansBase portfolio piece. It is a **front-end demo**: all state is local
and all "external" services (payments, smart-lock, OTA sync) are mocked. There is
no real backend, no database, and **no real keys** — never add any.

## Commands (package manager: pnpm)

```bash
pnpm install              # install (per-worktree too)
pnpm dev                  # next dev
pnpm build                # production build
pnpm lint                 # next lint
pnpm typecheck            # tsc --noEmit (strict)
pnpm format:check         # prettier --check .   (CI gate)
pnpm format               # prettier --write .
pnpm test                 # vitest run
```

This project uses **pnpm** (pinned via `packageManager` in package.json); do not
reintroduce `npm`/`yarn` or a `package-lock.json`. CI runs on Node 22.

### Tests run under three timezones

CI runs the suite under `TZ=UTC`, `TZ=Asia/Tokyo`, and `TZ=America/New_York`. Any
date-touching change MUST pass all three locally before you push:

```bash
TZ=UTC pnpm test && TZ=Asia/Tokyo pnpm test && TZ=America/New_York pnpm test
```

## Architecture

- **Next.js 15 App Router + TypeScript strict.** `app/` holds routes; `(guest)`
  group is the public site, `admin/` is the console. Server components by default;
  add `'use client'` only where hooks/state are needed.
- **State: one sliced Zustand store** in `lib/store/`. Slices: `app`,
  `reservation`, `pricing`, `policy`, `messages`, `guest-register`, composed into
  the `AppStore` intersection in `store-type.ts`. The store is `persist`ed to
  `localStorage` (`skipHydration: true`) so the guest flow and admin console share
  one demo state. New slice → wire it into `store-type.ts` **and** into
  `resetToSeed` in `lib/store/index.ts`. Never touch `localStorage` during the
  server render; rehydrate via `hydrateAppStore()` from a client provider.
- **Domain logic is PURE and lives in `lib/services/`** (reservation overlap,
  pricing, cancellation). UI/store call into it — never inline a domain rule in a
  component.
- **External integrations are mocked in `lib/mock/`** (Stripe manual-capture,
  RemoteLOCK passcodes, Airbnb iCal), each behind the shape a real SDK exposes.
- Seed data: `lib/seed/`. Shared types: `types/`. UI: `components/`
  (`admin`, `guest`, `i18n`, `oceans-base`, `onboarding`, `providers`).

## Critical conventions (the landmines)

1. **Dates/times go through `lib/utils/dates.ts`. Never hand-roll.** All date math
   is **UTC** (`parseIsoDate`, `nightsBetween`, `toIsoDate` use UTC slices). Never
   use local getters (`getDay`/`getMonth`/`getHours`/`getDate`) — use the `getUTC*`
   forms or the helpers. Any **wall-clock** time (check-in/out, passcode windows)
   must be serialized with `joinPropertyDateTime()`, which anchors to the property
   zone `+09:00` (JST) — **never** write `` `${date}T${time}Z` ``. This repo has
   shipped both a TZ-dependent pricing bug and a 9-hour passcode offset; the 3-TZ
   test matrix exists to keep them dead.
2. **No secrets, ever.** Don't print, log, hardcode, or commit `.env*` contents,
   keys, or tokens. Mocks stay offline — no real network calls.
3. **TypeScript strict.** No `any`, no unused exports.

## i18n (next-intl)

Catalogs: `lib/i18n/messages/{ja,en,zh,ko}.json`, wired via
`lib/i18n/IntlProvider.tsx`. **`ja` is the source/reference locale.** `ja`/`en`
are full; `zh`/`ko` are intentionally partial. User-facing copy belongs in the
catalog (`t()` keys), not hardcoded in components. Keep ICU placeholders
(`{name}`, plurals, rich tags) identical across every locale or formatting throws.

## Commit hygiene

English **Conventional Commits**, **one logical change per commit**. Keep the diff
focused; don't mix a refactor with a feature. Don't commit unless asked.

## Parallel execution

This repo is set up for `git worktree` parallel agents:

- `.worktreeinclude` lists env files copied into each worktree; `.claude/settings.json`
  pins `worktree.baseRef=fresh`; `.claude/worktrees/` is gitignored.
- `/ship <goal>` decomposes a goal into worktree-isolated workstreams.
- Subagents in `.claude/agents/`: `feature-implementer` & `test-author` (write,
  `isolation: worktree`); `code-reviewer` & `i18n-auditor` (read-only).

## Definition of done

Before reporting a change complete: `pnpm typecheck` · `pnpm lint` ·
`pnpm format:check` · `pnpm test` (3 TZs if dates are involved) · `pnpm build`
(if anything renders) must all pass.
