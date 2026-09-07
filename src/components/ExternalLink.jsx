/** Anchor that opens in a new tab and carries a small outward-arrow glyph. */
export default function ExternalLink({ href, children, className = '' }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="external-arrow" aria-hidden="true">
        <svg viewBox="0 0 12 12" focusable="false">
          <path d="M2.25 9.75 9.75 2.25M4.25 2.25h5.5v5.5" />
        </svg>
      </span>
    </a>
  );
}
