// Snapshots the public GitHub contribution calendar into src/data at build time,
// so the graph prerenders without a runtime API call or a token.
import { writeFile } from 'node:fs/promises';

const USER = 'charliec2004';
const OUT = new URL('../src/data/contributions.json', import.meta.url);

// A failed fetch keeps the committed snapshot rather than breaking the build.
let html;
try {
  const response = await fetch(`https://github.com/users/${USER}/contributions`);
  if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
  html = await response.text();
} catch (error) {
  console.warn(`Keeping existing contributions snapshot: ${error.message}`);
  process.exit(0);
}

const counts = new Map();
for (const [, id, text] of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)/g)) {
  const match = text.match(/^(\d+) contributions?/);
  counts.set(id, match ? Number(match[1]) : 0);
}

const days = [...html.matchAll(/<td[^>]*ContributionCalendar-day[^>]*>/g)]
  .map(([tag]) => ({
    date: tag.match(/data-date="([^"]+)"/)?.[1],
    level: Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0),
    count: counts.get(tag.match(/id="([^"]+)"/)?.[1]) ?? 0,
  }))
  .filter((day) => day.date)
  .sort((a, b) => a.date.localeCompare(b.date));

if (days.length < 300) {
  console.warn(`Keeping existing contributions snapshot: only parsed ${days.length} days`);
  process.exit(0);
}

// The graph shows the calendar year, so earlier days aren't kept.
const year = days.at(-1).date.slice(0, 4);
const current = days.filter((day) => day.date.startsWith(year));
const total = current.reduce((sum, day) => sum + day.count, 0);
await writeFile(OUT, `${JSON.stringify({ user: USER, total, days: current }, null, 2)}\n`);
console.log(`Wrote ${current.length} days, ${total} contributions in ${year}`);
