# Screenshots

Binary screenshots are intentionally not committed (kept out of `git`) so the
repository stays text-only. Generate them locally before posting to a portfolio
surface.

## One-shot

```bash
# First time only — downloads ~130 MB of headless Chromium
npm run screenshots:install

# Build the app, start it, capture, stop the server
npm run screenshots:build
```

Outputs to `docs/portfolio/screenshots/`:

- `hero-landing.png`
- `guest-landing.png`
- `booking-calendar.png`
- `admin-dashboard.png`
- `double-booking-warning.png`
- `mobile.png`

## Against an already-running build

```bash
npm run build && npm run start &
npx wait-on http://localhost:3000
npm run screenshots
```

Or point at a remote (e.g. Vercel preview):

```bash
SCREENSHOT_BASE_URL=https://minpaku-demo.oceans-base.com npm run screenshots
```

## Customizing

The capture list and viewports are declared at the top of
[`scripts/capture-screenshots.mjs`](../../../scripts/capture-screenshots.mjs).
Each entry can override viewport, run as a specific Playwright device profile,
and pre-seed `localStorage` via a `setup` hook (used to skip the admin login
redirect, for example).
