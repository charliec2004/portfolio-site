import assert from 'node:assert/strict';
import test from 'node:test';
import { GITHUB_USER, parseContributions, renderContributionGraph, validContributions } from '../src/lib/contributions.js';

function calendar(end, count = 2) {
  const days = [];
  for (let i = 364; i >= 0; i--) {
    const date = new Date(Date.parse(end) - i * 86400000).toISOString().slice(0, 10);
    days.push(`<td class="ContributionCalendar-day" data-date="${date}" data-level="1" id="day-${i}"></td><tool-tip for="day-${i}">\n${count ? `${count} contributions` : 'No contributions'} on ${date}.\n</tool-tip>`);
  }
  return days.join('');
}

test('parses a complete public calendar and filters to the current year', () => {
  const data = parseContributions(calendar('2026-10-08'), new Date('2026-10-08T12:00:00Z'));
  assert.equal(data.days.length, 281);
  assert.equal(data.total, 562);
  assert.equal(validContributions(data), true);
  assert.match(renderContributionGraph(data), /562 contributions in 2026/);
});

test('rejects broken tooltips, partial calendars, duplicate dates, and stale upstream responses', () => {
  const html = calendar('2026-10-08');
  const now = new Date('2026-10-08T12:00:00Z');
  assert.throws(() => parseContributions(html.replace(/<tool-tip[\s\S]*?<\/tool-tip>/, ''), now));
  assert.throws(() => parseContributions(html.replace('data-date="2026-10-08"', 'data-date="2026-10-07"'), now));
  assert.throws(() => parseContributions(html.slice(0, 1000), now));
  assert.throws(() => parseContributions(html, new Date('2026-10-12')));
});

test('year rollover renders January 1 plus future cells, and leap years render 366 days', () => {
  const data = parseContributions(calendar('2027-01-01', 0), new Date('2027-01-01T12:00:00Z'));
  assert.equal(data.days.length, 1);
  assert.equal(data.total, 0);
  assert.equal((renderContributionGraph(data).match(/data-future="true"/g) ?? []).length, 364);
  const leap = { user: GITHUB_USER, total: 0, days: [{ date: '2028-01-01', level: 0, count: 0 }] };
  assert.equal((renderContributionGraph(leap).match(/data-future="true"/g) ?? []).length, 365);
});

test('stored snapshots reject unsafe or inconsistent values before rendering HTML', () => {
  const data = parseContributions(calendar('2026-10-08'), new Date('2026-10-08T12:00:00Z'));
  assert.equal(validContributions({ ...data, user: '"><script>' }), false);
  assert.equal(validContributions({ ...data, total: -1 }), false);
  assert.equal(validContributions({ ...data, days: [{ date: '2026-02-30', level: 0, count: 0 }] }), false);
  assert.throws(() => renderContributionGraph({ ...data, user: '"><script>' }));
});
