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

  useEffect(() => {
    function scrollToToday() {
      const scroller = island.current?.querySelector('.contributions__scroll');
      const today = scroller?.querySelector('.contributions__day[data-future]');
      if (today && scroller.scrollWidth > scroller.clientWidth) {
        scroller.scrollLeft = today.offsetLeft - scroller.clientWidth + today.offsetWidth * 2;
      }
    }
    scrollToToday();

    // Production keeps server-rendered markup; refresh only this small island.
    // Vite/GitHub Pages can keep their build-time fallback if the API is absent.
    if (RENDER_GRAPH) return;
    let controller;
    let disposed = false;
    async function refresh() {
      if (document.hidden || controller) return;
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 10000);
      try {
        const response = await fetch('/api/contributions', { signal: controller.signal, cache: 'no-cache' });
        if (!response.ok || !response.headers.has('X-Contributions-Source')) return;
        const html = await response.text();
        if (disposed || !island.current || island.current.innerHTML === html) return;
        const previous = island.current.querySelector('.contributions__scroll')?.scrollLeft;
        island.current.innerHTML = html;
        const scroller = island.current.querySelector('.contributions__scroll');
        if (scroller && previous !== undefined) scroller.scrollLeft = previous;
        else scrollToToday();
      } catch {
        // Offline/upstream failures leave the current graph intact; retry later.
      } finally {
        window.clearTimeout(timeout);
        controller = undefined;
      }
    }
    void refresh();
    const interval = window.setInterval(refresh, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
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
