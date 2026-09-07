const TERMS = ['Fall 2025', 'Spring 2026', 'Fall 2026', 'Spring 2027'];
const FILLED_CELLS = new Set([3, 6, 8, 13, 16, 17, 22, 26, 31]);

/**
 * Decorative, monochrome illustrations for each project. Any figures shown
 * are taken from the project's own README.
 */
export default function ProjectVisual({ kind }) {
  if (kind === 'august') {
    return (
      <div className="visual visual--august" aria-hidden="true">
        <div className="thread">
          <div className="thread__top">
            <span>Messages</span>
            <span>August</span>
          </div>
          <p className="thread__msg thread__msg--out">
            Keep an eye on the airline refund. It should land by Friday.
          </p>
          <p className="thread__msg thread__msg--in">
            On it. I’ll follow up with them if it hasn’t posted by Thursday.
          </p>
          <p className="thread__msg thread__msg--in thread__msg--later">
            Refund posted this morning. Nothing left to chase.
          </p>
        </div>
      </div>
    );
  }

  if (kind === 'quorum') {
    return (
      <div className="visual visual--quorum" aria-hidden="true">
        <div className="plan">
          <div className="plan__top">
            <span>Degree plan</span>
            <span>Computer Science, B.S.</span>
          </div>
          <div className="plan__terms">
            {TERMS.map((term) => (
              <div className="plan__term" key={term}>
                <span>{term}</span>
                <i />
                <i />
                <i />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (kind === 'scheduler') {
    return (
      <div className="visual visual--scheduler" aria-hidden="true">
        <div className="roster__label">
          <span>Weekly roster</span>
          <span>Front desk</span>
        </div>
        <div className="roster__grid">
          {Array.from({ length: 35 }, (_, cell) => (
            <i className={FILLED_CELLS.has(cell) ? 'is-filled' : ''} key={cell} />
          ))}
        </div>
        <div className="roster__foot">
          <span>13 employees</span>
          <span>6 departments</span>
        </div>
      </div>
    );
  }

  return (
    <div className="visual visual--tennis" aria-hidden="true">
      <div className="court">
        <span className="court__net" />
        <span className="court__ball court__ball--one" />
        <span className="court__ball court__ball--two" />
        <span className="court__score">65.45%</span>
        <span className="court__score-label">Test accuracy, 2023 onward</span>
      </div>
    </div>
  );
}
