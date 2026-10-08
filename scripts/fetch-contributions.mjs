// Build-time fallback for offline operation and the older GitHub Pages host.
// Cloudflare production refreshes independently through its scheduled handler.
import { readFile, writeFile } from 'node:fs/promises';
import { GITHUB_USER, parseContributions } from '../src/lib/contributions.js';

try {
  const response = await fetch(`https://github.com/users/${GITHUB_USER}/contributions`, {
    signal: AbortSignal.timeout(10000),
    headers: { 'User-Agent': 'charles-conner-portfolio', Accept: 'text/html' },
  });
  if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
  const data = parseContributions(await response.text());
  const output = new URL('../src/data/contributions.json', import.meta.url);
  const previous = JSON.parse(await readFile(output, 'utf8'));
  // Keep identical builds reproducible; Cron records each live refresh separately.
  if (previous.user !== data.user || previous.total !== data.total || JSON.stringify(previous.days) !== JSON.stringify(data.days)) {
    await writeFile(output, `${JSON.stringify(data, null, 2)}\n`);
  }
  console.log(`Wrote ${data.days.length} days, ${data.total} contributions`);
} catch (error) {
  console.warn(`Keeping existing contributions snapshot: ${error.message}`);
}
