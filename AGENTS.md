# Portfolio deployment context

## Production source of truth

- `https://charlieconner.com` and `https://www.charlieconner.com` are served by
  the Cloudflare Worker `charles-conner-portfolio`, configured in `wrangler.jsonc`.
- The app is React + Vite. `npm run build` builds `dist/` and prerenders the
  page with `scripts/prerender.mjs`; React hydrates interactive controls.
- `worker/index.ts` serves those built assets through `env.ASSETS`, applies
  security/cache headers, and serves Markdown for `/index.md` or homepage
  requests that prefer `Accept: text/markdown`.
- The contribution graph refreshes through the Worker's 15-minute Cron Trigger.
  `CONTRIBUTIONS` KV holds the last valid snapshot without expiry; the Worker
  inserts it into page HTML and serves `/api/contributions` for browser refreshes.
  Keep the build-time fallback for storage outages and the GitHub Pages host.
- The Worker was introduced on July 27, 2026 in commit `8a0729b` for
  agent-readable delivery and security headers. Commit `446b533` attached the
  custom domains. This is a static portfolio with a delivery layer, not an
  application backend requiring a database.

## Why GitHub Actions also deploys

`.github/workflows/deploy.yml` still builds and deploys to **GitHub Pages** on
pushes to `main`. It does **not** deploy the Cloudflare Worker. This older
deployment path remains alongside the active Worker setup.

A successful GitHub Actions run does not mean the canonical live site has
updated. Pushing or merging to `main` and deploying the Worker are separate
steps. Do not infer the production host from `public/CNAME`, the Pages workflow,
or older comments in `vite.config.js`. Do not switch hosts, change domain routing,
or remove either deployment path as incidental cleanup.

## Publishing changes

1. Compare the final change with current `origin/main` and preserve merged work.
2. For application or delivery changes, run `npm run lint`,
   `npm run check:worker`, and `npm run deploy:cloudflare:dry`
   (includes the production build). Documentation-only changes need no deployment.
3. Push the approved changes to the repository. When publishing to production,
   run `npm run deploy:cloudflare` from the verified revision.
4. Verify both custom domains, relevant interactions, and response headers.
   Check the live result rather than relying only on deployment success.

Use the existing Cloudflare account containing this Worker. Multiple accounts
are available; confirm authentication with `npx wrangler whoami` and the existing
Worker before deployment. Never create a replacement Worker in another account
to work around account selection or authentication errors.

Keep visible copy, `public/index.md`, `public/llms-full.txt`, and `public/llms.txt`
consistent. Changes to inline JSON-LD in `index.html` require updating its SHA-256
allowance in the Worker's CSP. Preserve narrow analytics allowlists, including
Cloudflare's versioned `/beacon.min.js/` script paths. Cache fingerprinted assets
immutably while allowing HTML to refresh.

Local Vite and Wrangler previews are separate processes. Stop the processes
started for this project when asked to shut down localhost; do not stop unrelated
development servers.
