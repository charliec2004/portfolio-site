# Charles Conner — Portfolio

Personal site for Charles Conner, live at [charlieconner.com](https://charlieconner.com).

A single-page React app: hero, selected work, about, contact. Light and dark
themes, a WebGL dot field in the hero, and a small custom cursor on
fine-pointer devices. The Cloudflare Worker in `worker/` serves the built
assets, adds security headers, and returns a Markdown representation of the
page to clients that ask for `text/markdown`.

## Develop

```bash
npm install
npm run dev
```

## Check and build

```bash
npm run lint          # ESLint over src/
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
│   ├── Cursor.jsx              # Custom pointer
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
