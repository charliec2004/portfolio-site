// Renders scripts/og/og.html to public/og.png with a local Chromium.
// Run manually after changing the card: `node scripts/render-og.mjs`.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const template = new URL('./og/og.html', import.meta.url);
const out = fileURLToPath(new URL('../public/og.png', import.meta.url));
const browser = process.env.CHROME_BIN ?? 'chromium';

execFileSync(browser, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  `--screenshot=${out}`,
  template.href,
], { stdio: 'ignore' });
console.log(`Wrote ${out}`);
