# Deploy

This repository is a portfolio sample. The recommended deploy target is Vercel.
Two paths are documented below — **path A is the one you want unless you have
a specific reason to avoid the Vercel-GitHub integration**.

## Path A — Vercel UI (recommended, ~5 minutes)

The standard Vercel-GitHub integration handles preview deploys for every PR,
production deploys for every push to `main`, and the live demo at
`minpaku-demo.oceans-base.com`. No secrets in this repo, no extra workflow,
nothing to maintain.

1. Sign in to <https://vercel.com> with the GitHub account that owns
   `OceansCreative/oceans-minpaku-demo`.
2. **Add New… → Project**, pick the repo, accept the defaults (Next.js is
   auto-detected).
3. **Deploy**. The first build takes 1–2 minutes.
4. Project Settings → **Domains**:
   - Add `minpaku-demo.oceans-base.com`.
   - Vercel prints a CNAME target (e.g. `cname.vercel-dns.com`).
   - In whatever DNS provider serves `oceans-base.com`, create a CNAME
     `minpaku-demo` → that target. SSL is provisioned automatically once DNS
     propagates.
5. Project Settings → **Git → Production Branch**: confirm it's `main`.
6. (Optional) Project Settings → **Functions → Region**: pick **Tokyo (hnd1)**
   for lower latency from JP visitors.

That's it. Every push to `main` deploys to production; every PR gets its own
preview URL automatically.

### Verifying

After the first production deploy, sanity-check:

- `curl -sI https://minpaku-demo.oceans-base.com | head -1` → `HTTP/2 200`.
- Open the home page — the `DemoBanner` should render at the top and the
  `FloatingBadge` bottom-right.
- Sign in to `/admin` with `demo` / `demo`.
- `https://minpaku-demo.oceans-base.com/opengraph-image` should return a
  176 kB PNG.

## Path B — GitHub Actions (explicit deploy workflow)

Use this if you want deploys to be gated by CI, or you want a record of every
deploy in the Actions tab. Costs: a tiny bit more setup, an extra ~30 s on
every push.

1. In Vercel: Project Settings → **Tokens** → create a token with `Full Account`
   scope. Copy it.
2. Find your `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`:
   ```bash
   pnpm dlx vercel link          # follow the prompts to link to the project
   cat .vercel/project.json      # prints orgId + projectId
   rm -rf .vercel                # don't commit this
   ```
3. In the GitHub repo settings, add three Actions secrets:
   - `VERCEL_TOKEN` — the token from step 1
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
4. The workflow `.github/workflows/deploy.yml` (committed alongside this doc)
   does the rest. It runs on every push to `main` and on every PR; production
   only triggers on `main`.

### Disabling Vercel's auto-deploy when using Path B

If you want **only** the Actions workflow to deploy and not the Vercel-GitHub
integration's auto-deploy, in Vercel Project Settings → **Git** turn off
_Automatically push commits to deployments_. Otherwise both paths will deploy
the same commit and you'll waste a build.

## Local production preview

You don't need Vercel to verify the production build:

```bash
pnpm build
pnpm start
# Open http://localhost:3000
```

## Other targets

The app is a stock Next.js 15 App Router project with no Vercel-specific
features beyond `next/og`. It will run on:

- **Cloudflare Pages** with the Next-on-Pages adapter (the OG route runs on
  Workers).
- **Netlify** with the Next.js runtime.
- **Self-hosted Node** behind any reverse proxy (`pnpm build && pnpm
start` on a Node 22+ box).

These are all out of scope for the OceansBase sample, but documented here so
the path forward is obvious if a real client needs to deploy somewhere
specific.
