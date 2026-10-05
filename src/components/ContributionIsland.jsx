import { memo, useEffect, useRef } from 'react';
import ContributionGraph from './ContributionGraph';

// The graph is static, so production clients keep the prerendered markup
// instead of shipping its data and hydrating ~400 nodes. React leaves an
// element's existing children alone when it owns them via innerHTML, and
// memo keeps App re-renders (theme, menu) from ever resetting that innerHTML.
const RENDER_GRAPH = import.meta.env.SSR || import.meta.env.DEV;
const KEEP_PRERENDERED = { __html: '' };

function ContributionIsland() {
  const island = useRef(null);

  // On narrow screens the year overflows; bring the current week into view.
  useEffect(() => {
    const scroller = island.current?.querySelector('.contributions__scroll');
    const today = scroller?.querySelector('.contributions__day[data-future]');
    if (today && scroller.scrollWidth > scroller.clientWidth) {
      scroller.scrollLeft = today.offsetLeft - scroller.clientWidth + today.offsetWidth * 2;
    }
  }, []);

  return RENDER_GRAPH ? (
    <div className="contributions-island" ref={island}>
      <ContributionGraph />
    </div>
  ) : (
    <div
      className="contributions-island"
      ref={island}
      suppressHydrationWarning
      dangerouslySetInnerHTML={KEEP_PRERENDERED}
    />
  );
}

export default memo(ContributionIsland);
