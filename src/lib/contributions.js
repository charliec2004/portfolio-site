export const GITHUB_USER = 'charliec2004';

/** @typedef {{date: string, level: number, count: number}} ContributionDay */
/** @typedef {{user: string, total: number, days: ContributionDay[], fetchedAt?: string}} Contributions */

/** Reject partial calendars rather than replacing good data with a broken scrape.
 * @param {string} html
 * @param {Date} [now]
 * @returns {Contributions}
 */
export function parseContributions(html, now = new Date()) {
  const counts = new Map();
  for (const [, id, text] of html.matchAll(/<tool-tip\b[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)) {
    const match = text.trim().match(/^(\d+|No) contributions?\b/);
    if (match) counts.set(id, match[1] === 'No' ? 0 : Number(match[1]));
  }
  const days = [...html.matchAll(/<td\b[^>]*ContributionCalendar-day[^>]*>/g)].map(([tag]) => ({
    date: tag.match(/data-date="([^"]+)"/)?.[1] ?? '',
    level: Number(tag.match(/data-level="(\d)"/)?.[1] ?? NaN),
    count: counts.get(tag.match(/\bid="([^"]+)"/)?.[1]) ?? NaN,
  })).sort((a, b) => a.date.localeCompare(b.date));

  if (days.length < 300 || days.length > 371 || days.some((day, index) =>
    !validDay(day) || (index > 0 && Date.parse(day.date) - Date.parse(days[index - 1].date) !== 86400000))) {
    throw new Error('GitHub returned an incomplete or invalid contribution calendar');
  }
  const last = days.at(-1);
  if (!last || Math.abs(now.getTime() - Date.parse(last.date)) > 2 * 86400000) {
    throw new Error('GitHub returned an out-of-date contribution calendar');
  }
  const year = last.date.slice(0, 4);
  const current = days.filter((day) => day.date.startsWith(year));
  return { user: GITHUB_USER, total: current.reduce((sum, day) => sum + day.count, 0), days: current, fetchedAt: now.toISOString() };
}

/** @param {ContributionDay} day */
function validDay(day) {
  return /^\d{4}-\d{2}-\d{2}$/.test(day.date)
    && Number.isFinite(Date.parse(day.date))
    && new Date(day.date).toISOString().slice(0, 10) === day.date
    && Number.isInteger(day.level) && day.level >= 0 && day.level <= 4
    && Number.isSafeInteger(day.count) && day.count >= 0;
}

/** @param {unknown} value @returns {value is Contributions} */
export function validContributions(value) {
  if (!value || typeof value !== 'object') return false;
  const data = /** @type {Contributions} */ (value);
  return data.user === GITHUB_USER && Array.isArray(data.days) && data.days.length > 0 && data.days.length <= 366
    && data.days.every((day, index) => validDay(day)
      && day.date.slice(0, 4) === data.days[0].date.slice(0, 4)
      && (index === 0 ? day.date.endsWith('-01-01') : Date.parse(day.date) - Date.parse(data.days[index - 1].date) === 86400000))
    && data.total === data.days.reduce((sum, day) => sum + day.count, 0)
    && (data.fetchedAt === undefined || Number.isFinite(Date.parse(data.fetchedAt)));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Shared markup for build-time fallback and live Worker responses.
 * All interpolated values are validated dates/numbers or fixed strings.
 * @param {Contributions} data
 */
export function renderContributionGraph(data) {
  if (!validContributions(data)) throw new Error('Invalid contributions snapshot');
  const year = data.days[0].date.slice(0, 4);
  const last = data.days.at(-1)?.date ?? '';
  const byDate = new Map(data.days.map((day) => [day.date, day]));
  const days = [];
  for (let date = new Date(`${year}-01-01T00:00:00Z`); date.getUTCFullYear() === Number(year); date.setUTCDate(date.getUTCDate() + 1)) {
    const iso = date.toISOString().slice(0, 10);
    days.push({ ...(byDate.get(iso) ?? { date: iso, level: 0, count: 0 }), future: iso > last });
  }
  const lead = new Date(`${year}-01-01T00:00:00Z`).getUTCDay();
  const weeks = Math.ceil((lead + days.length) / 7);
  let lastColumn = -3;
  const months = days.map((day, index) => {
    const column = Math.floor((lead + index) / 7);
    if (!day.date.endsWith('-01') || column > weeks - 3 || column < lastColumn + 3) return '';
    lastColumn = column;
    return `<span style="grid-column:${column + 1}">${MONTHS[Number(day.date.slice(5, 7)) - 1]}</span>`;
  }).join('');
  const cells = days.map((day, index) => `<span class="contributions__day" data-level="${day.level}"${day.future ? ' data-future="true"' : ` title="${day.count || 'No'} contribution${day.count === 1 ? '' : 's'} on ${DAY_FORMAT.format(new Date(`${day.date}T00:00:00Z`))}"`}${index === 0 ? ` style="grid-row-start:${lead + 1}"` : ''}></span>`).join('');
  return `<figure class="contributions" aria-labelledby="contributions-title" style="--weeks:${weeks}"><figcaption class="contributions__header"><span><span id="contributions-title">${data.total.toLocaleString('en-US')} contributions in ${year}</span><a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noreferrer">@${GITHUB_USER}<span class="external-arrow" aria-hidden="true"><svg viewBox="0 0 12 12" focusable="false"><path d="M2.25 9.75 9.75 2.25M4.25 2.25h5.5v5.5"></path></svg></span></a></span><div class="contributions__legend" aria-hidden="true"><span>Less</span>${[0, 1, 2, 3, 4].map((level) => `<span class="contributions__day" data-level="${level}"></span>`).join('')}<span>More</span></div></figcaption><div class="contributions__scroll"><div class="contributions__months" aria-hidden="true">${months}</div><div class="contributions__grid">${cells}</div></div></figure>`;
}
