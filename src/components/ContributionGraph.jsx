import ExternalLink from './ExternalLink';
import contributions from '../data/contributions.json';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

function parseDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Every day of the calendar year, Jan through Dec; days not yet reached stay empty. */
function calendarYear(year, recorded) {
  const byDate = new Map(recorded.map((day) => [day.date, day]));
  const last = recorded.at(-1).date;
  const days = [];
  for (let date = parseDate(`${year}-01-01`); date.getUTCFullYear() === Number(year); date.setUTCDate(date.getUTCDate() + 1)) {
    const iso = date.toISOString().slice(0, 10);
    days.push(byDate.get(iso) ?? { date: iso, level: 0, count: 0, future: iso > last });
  }
  return days;
}

/**
 * Static markup for the year's contribution calendar. The grid flows down
 * Sunday-first columns, so only the first day needs explicit placement.
 */
export default function ContributionGraph() {
  const { user } = contributions;
  const year = contributions.days.at(-1).date.slice(0, 4);
  const days = calendarYear(year, contributions.days);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const lead = parseDate(days[0].date).getUTCDay();
  const weeks = Math.ceil((lead + days.length) / 7);

  // Label each month at the week holding its 1st, skipping labels that would crowd.
  const labels = [];
  days.forEach((day, index) => {
    if (!day.date.endsWith('-01')) return;
    const column = Math.floor((lead + index) / 7);
    if (column > weeks - 3 || column < (labels.at(-1)?.column ?? -3) + 3) return;
    labels.push({ column, name: MONTHS[Number(day.date.slice(5, 7)) - 1] });
  });

  return (
    <figure className="contributions" aria-labelledby="contributions-title" style={{ '--weeks': weeks }}>
      <figcaption className="contributions__header">
        <span>
          <span id="contributions-title">
            {total.toLocaleString('en-US')} contributions in {year}
          </span>
          <ExternalLink href={`https://github.com/${user}`}>@{user}</ExternalLink>
        </span>
        <div className="contributions__legend" aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span className="contributions__day" data-level={level} key={level} />
          ))}
          <span>More</span>
        </div>
      </figcaption>
      <div className="contributions__scroll">
        <div className="contributions__months" aria-hidden="true">
          {labels.map((label) => (
            <span key={label.name} style={{ gridColumn: label.column + 1 }}>{label.name}</span>
          ))}
        </div>
        <div className="contributions__grid">
          {days.map((day, index) => (
            <span
              className="contributions__day"
              key={day.date}
              data-level={day.level}
              data-future={day.future || undefined}
              style={index === 0 ? { gridRowStart: lead + 1 } : undefined}
              title={day.future ? undefined : `${day.count || 'No'} contribution${day.count === 1 ? '' : 's'} on ${DAY_FORMAT.format(parseDate(day.date))}`}
            />
          ))}
        </div>
      </div>
    </figure>
  );
}
