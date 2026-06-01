#!/usr/bin/env node
// @ts-check
/**
 * Capture the six screenshots referenced by README.md against a running build.
 *
 * Usage (assumes `npm run build` already ran):
 *
 *   npm run start &        # in another terminal, or use the wrapper script
 *   npm run screenshots
 *
 * The wrapper `npm run screenshots:build` does the build → start → capture →
 * stop dance for you in one shot.
 *
 * Outputs to `docs/portfolio/screenshots/`. The files are intentionally NOT
 * committed (see `docs/portfolio/screenshots/README.md`); run this locally
 * before posting to a portfolio surface.
 */

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const outDir = path.join(repoRoot, 'docs/portfolio/screenshots');
const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3000';

/** @type {Array<{ name: string; url: string; viewport?: { width: number; height: number }; device?: string; setup?: (page: import('playwright').Page) => Promise<void> }>} */
const shots = [
  {
    name: 'hero-landing',
    url: '/',
    viewport: { width: 1600, height: 1000 },
  },
  {
    name: 'guest-landing',
    url: '/',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'booking-calendar',
    url: '/rooms/room-tsuki/book',
    viewport: { width: 1440, height: 1100 },
  },
  {
    name: 'admin-dashboard',
    url: '/admin',
    viewport: { width: 1600, height: 1000 },
    setup: signInAsAdmin,
  },
  {
    name: 'double-booking-warning',
    url: '/admin/reservations/res-overlap-direct',
    viewport: { width: 1440, height: 1100 },
    setup: signInAsAdmin,
  },
  {
    name: 'mobile',
    url: '/',
    device: 'iPhone 14 Pro',
  },
];

/**
 * Set localStorage so the admin shell skips the login redirect and the welcome
 * modal doesn't steal the viewport.
 *
 * @param {import('playwright').Page} page
 */
async function signInAsAdmin(page) {
  await page.addInitScript(() => {
    const state = {
      state: {
        language: 'ja',
        seedAnchorIso: new Date().toISOString(),
        hasSeenOnboarding: true,
        isAdminAuthenticated: true,
      },
      version: 1,
    };
    window.localStorage.setItem('oceans-minpaku-store', JSON.stringify(state));
  });
}

/**
 * Dismiss the first-visit welcome modal everywhere by default.
 *
 * @param {import('playwright').Page} page
 */
async function dismissOnboarding(page) {
  await page.addInitScript(() => {
    const existing = window.localStorage.getItem('oceans-minpaku-store');
    if (existing) return;
    window.localStorage.setItem(
      'oceans-minpaku-store',
      JSON.stringify({
        state: {
          language: 'ja',
          seedAnchorIso: new Date().toISOString(),
          hasSeenOnboarding: true,
          isAdminAuthenticated: false,
        },
        version: 1,
      }),
    );
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const shot of shots) {
      const contextOptions = shot.device
        ? { ...devices[shot.device] }
        : { viewport: shot.viewport };
      const context = await browser.newContext(contextOptions);
      const page = await context.newPage();
      await dismissOnboarding(page);
      if (shot.setup) await shot.setup(page);

      const target = new URL(shot.url, baseUrl).toString();
      console.log(`→ ${shot.name}: ${target}`);
      await page.goto(target, { waitUntil: 'networkidle', timeout: 30_000 });
      // Give fonts a beat to settle.
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(outDir, `${shot.name}.png`),
        fullPage: shot.name === 'hero-landing' ? false : !shot.device,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\nDone. Captures saved under ${path.relative(repoRoot, outDir)}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
