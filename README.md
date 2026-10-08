# Charles Conner — Portfolio

Personal site for Charles Conner, live at [charlieconner.com](https://charlieconner.com).

A single-page React app: hero, selected work, about, contact. Light and dark
themes, a custom cursor on pointer devices, and a WebGL dot field in the hero. The build prerenders the page into
HTML; React hydrates the interactive controls. The Cloudflare Worker in
`worker/` serves the built assets, adds security and cache headers, and returns
a Markdown representation of the page to clients that ask for `text/markdown`.

The GitHub contribution graph refreshes independently of deployments. A Worker
Cron Trigger fetches the public GitHub calendar every 15 minutes and stores the
validated snapshot in the `CONTRIBUTIONS` KV namespace without an expiry. The
Worker inserts it into page HTML and serves the same graph at
`/api/contributions`; visible browser tabs refresh that island every five minutes
and when returning to the tab. GitHub's own contribution processing can add delay.
Failed fetches or invalid calendars preserve the last successful snapshot. If
KV is unavailable or empty, the bundled build-time snapshot remains available.

Inspect `X-Contributions-Source` and `X-Contributions-Updated` on the homepage or
API to verify storage and freshness; inspect Cron runs in Cloudflare observability
for refresh failures. The public API is read-only and cannot trigger GitHub fetches.
Local Worker verification uses `npx wrangler dev --test-scheduled`; invoke its
scheduled handler with `curl 'http://localhost:8787/__scheduled?cron=*/15+*+*+*+*'`.
Local KV is isolated from production. GitHub Pages retains the build-time graph.

## Develop

```bash
npm install
npm run dev
```

## Check and build

```bash
npm run lint          # ESLint over src/
npm test              # Calendar and Worker runtime regression tests
npm run check:worker  # TypeScript check for worker/
npm run build         # Production build to dist/
```

## Deploy

```bash
npm run deploy:cloudflare:dry   # Build and validate the Worker config
npm run deploy:cloudflare       # Build and deploy with Wrangler
```

## Structure

```text
src/
├── App.jsx                     # Page layout and copy
├── app.css                     # Theme tokens and all styles
├── components/
│   ├── Cursor.jsx              # Animated custom pointer
│   ├── ExternalLink.jsx        # New-tab link with outward arrow
│   ├── PointWaveField.jsx      # WebGL hero background
│   └── ProjectVisual.jsx       # Illustrations for each project
├── data/projects.js            # Project list
└── hooks/useTheme.js           # Light/dark theme with persistence
public/                         # Static assets, llms.txt, index.md, sitemap
worker/index.ts                 # Cloudflare Worker
```

The pre-2026 design is preserved under the `legacy/pre-redesign` tag; see
`LEGACY.md`.
