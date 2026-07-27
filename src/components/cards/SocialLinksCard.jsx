import {
  forwardRef,
  Fragment,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import resumeIcon from '../../assets/icons/resume.svg';
import githubIcon from '../../assets/icons/github.svg';
import linkedinIcon from '../../assets/icons/linkedin.svg';
import xIcon from '../../assets/icons/x.svg';
import { clampFloatingTooltipPosition } from '../../utils/clampFloatingTooltip';
import { readTooltipTiltTransform } from '../../utils/readTooltipTiltTransform';
import { TOOLTIP_DWELL_MS } from '../../constants/tooltipTiming';
import useReducedMotion from '../../hooks/useReducedMotion';

// 36px at <=1279px, 42px at >=1280px. We previously interpolated via
// `--mid-progress`, but Firefox silently drops `calc(... * var(--mid-progress))`
// inline-style values to 0 — separators rendered as `height: 0`, no
// visible divider between icons. Tailwind breakpoints work in all engines.
const Separator = () => (
  <div className="w-px shrink-0 bg-separator h-9 xl:h-[42px]" aria-hidden="true" />
);

const ITEMS = [
  {
    key: 'resume',
    href: '/Charles_Conner_Resume.pdf',
    download: 'Charles_Conner_Resume.pdf',
    external: false,
    tooltip: 'PDF résumé',
    ariaLabel: 'Download resume',
    icon: resumeIcon,
    alt: 'Resume',
  },
  {
    key: 'github',
    href: 'https://github.com/charliec2004',
    external: true,
    tooltip: 'GitHub repos',
    ariaLabel: 'GitHub profile',
    icon: githubIcon,
    alt: 'GitHub',
  },
  {
    key: 'linkedin',
    href: 'https://www.linkedin.com/in/charlescon',
    external: true,
    tooltip: 'LinkedIn',
    ariaLabel: 'LinkedIn',
    icon: linkedinIcon,
    alt: 'LinkedIn',
  },
  {
    key: 'x',
    href: 'https://x.com/charliee_',
    external: true,
    tooltip: 'Posts on X',
    ariaLabel: 'X (Twitter) profile',
    icon: xIcon,
    alt: 'X',
  },
];

const SocialLinksCard = forwardRef(function SocialLinksCard(
  { tiltHandlers = {}, tooltipPageReady = false },
  ref
) {
  const reducedMotion = useReducedMotion();
  const socialTooltipTipId = useId();

  const [socialTooltip, setSocialTooltip] = useState(null);
  const [socialTipEntered, setSocialTipEntered] = useState(false);
  const anchorRef = useRef(null);
  const shellRef = useRef(null);
  const tiltRef = useRef(null);
  const contentRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const dwellTimerRef = useRef(null);

  const coarsePointer =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  const linksArmed = tooltipPageReady && !coarsePointer;

  const cancelScheduledHide = useCallback(() => {
    if (hideTimeoutRef.current != null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const clearDwell = useCallback(() => {
    if (dwellTimerRef.current != null) {
      window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  }, []);

  const hideTooltip = useCallback(() => {
    clearDwell();
    cancelScheduledHide();
    anchorRef.current = null;
    setSocialTooltip(null);
    setSocialTipEntered(false);
  }, [clearDwell, cancelScheduledHide]);

  const scheduleHideTooltip = useCallback(() => {
    clearDwell();
    cancelScheduledHide();
    hideTimeoutRef.current = window.setTimeout(() => {
      hideTimeoutRef.current = null;
      hideTooltip();
    }, 80);
  }, [clearDwell, cancelScheduledHide, hideTooltip]);

  const scheduleDwellShow = useCallback(
    (e, item) => {
      if (!linksArmed) return;
      cancelScheduledHide();
      clearDwell();
      const anchor = e.currentTarget;
      dwellTimerRef.current = window.setTimeout(() => {
        dwellTimerRef.current = null;
        anchorRef.current = anchor;
        setSocialTipEntered(false);
        setSocialTooltip({ text: item.tooltip, anchorKey: item.key });
      }, TOOLTIP_DWELL_MS);
    },
    [linksArmed, cancelScheduledHide, clearDwell]
  );

  useEffect(() => {
    if (!linksArmed) hideTooltip();
  }, [linksArmed, hideTooltip]);

  useEffect(
    () => () => {
      clearDwell();
      cancelScheduledHide();
    },
    [clearDwell, cancelScheduledHide]
  );

  useEffect(() => {
    if (!socialTooltip) return;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      hideTooltip();
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [socialTooltip, hideTooltip]);

  useLayoutEffect(() => {
    if (!socialTooltip || !shellRef.current || !tiltRef.current || !contentRef.current || !anchorRef.current)
      return;

    const shell = shellRef.current;
    const tiltWrap = tiltRef.current;
    const content = contentRef.current;

    let prevTilt = '';

    const clampPosition = () => {
      const anchor = anchorRef.current;
      if (!anchor?.isConnected || !tiltWrap) return;
      clampFloatingTooltipPosition(anchor, shell, content);
    };

    const applyTiltIfChanged = () => {
      const anchor = anchorRef.current;
      if (!anchor?.isConnected || !tiltWrap) return;
      const next = readTooltipTiltTransform(anchor);
      if (next !== prevTilt) {
        tiltWrap.style.transform = next;
        prevTilt = next;
      }
    };

    const clampNow = () => {
      clampPosition();
      applyTiltIfChanged();
    };

    const scrollOpts = { capture: true, passive: true };
    const resizeOpts = { passive: true };

    if (reducedMotion) {
      setSocialTipEntered(true);
      clampNow();
      queueMicrotask(clampNow);

      const ro = new ResizeObserver(clampNow);
      ro.observe(content);
      window.addEventListener('resize', clampNow, resizeOpts);
      window.addEventListener('scroll', clampNow, scrollOpts);

      return () => {
        ro.disconnect();
        window.removeEventListener('resize', clampNow, resizeOpts);
        window.removeEventListener('scroll', clampNow, scrollOpts);
      };
    }

    setSocialTipEntered(false);
    clampNow();
    queueMicrotask(clampNow);

    let followRaf = null;
    const tickFollow = () => {
      if (!document.hidden) {
        clampPosition();
        applyTiltIfChanged();
      }
      followRaf = requestAnimationFrame(tickFollow);
    };

    let kickoff = requestAnimationFrame(() => {
      clampNow();
      requestAnimationFrame(() => {
        clampNow();
        setSocialTipEntered(true);
        requestAnimationFrame(clampNow);
        followRaf = requestAnimationFrame(tickFollow);
      });
    });

    const ro = new ResizeObserver(clampNow);
    ro.observe(content);

    window.addEventListener('resize', clampNow, resizeOpts);

    return () => {
      cancelAnimationFrame(kickoff);
      if (followRaf != null) cancelAnimationFrame(followRaf);
      ro.disconnect();
      window.removeEventListener('resize', clampNow, resizeOpts);
    };
  }, [socialTooltip, reducedMotion]);

  return (
    <>
      <nav
        ref={ref}
        data-card="social"
        aria-label="Social links"
        className="rounded-card w-full shrink-0 overflow-visible"
      >
        {/* min-h, gap, and side padding all snap at xl (1280px) instead
            of fluidly interpolating via `--mid-progress`. The fluid path
            relied on `length / length` inside calc() which Firefox does
            not always compute (the inline gap evaluated to `normal`),
            collapsing the row into clumped icons with no visible
            separators. Hard breakpoints render identically everywhere. */}
        <div
          className="social-card-face magnetic-tilt-surface bg-gradient-green shadow-card-inset w-full flex flex-row justify-center items-center py-2 min-h-[68px] xl:min-h-[80px] gap-2 xl:gap-4 px-3 xl:px-5"
          onMouseMove={tiltHandlers.onMouseMove}
          onMouseLeave={tiltHandlers.onMouseLeave}
        >
          {/* Uses React Fragments instead of `<span className="contents">`
              wrappers. Firefox renders `display: contents` children as
              flex items most of the time, but flex `gap` distribution on
              contents-children is buggy on certain Firefox versions —
              icons would clump together with no separators visible.
              Fragments emit no DOM at all, so the link/separator are
              true direct flex children of the row in every browser. */}
          {ITEMS.map((item, index) => (
            <Fragment key={item.key}>
              {index > 0 ? <Separator /> : null}
              {/* Link padding + icon size snap at xl(1280) instead of
                  the prior `--mid-progress` lerp; same Firefox issue. */}
              <a
                href={item.href}
                data-tooltip-tilt-z={0}
                aria-describedby={socialTooltip?.anchorKey === item.key ? socialTooltipTipId : undefined}
                {...(item.download ? { download: item.download } : {})}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : { rel: 'noopener' })}
                className="flex flex-col justify-center items-center shrink-0 group p-2.5 xl:p-4"
                aria-label={item.ariaLabel}
                onMouseEnter={linksArmed ? (e) => scheduleDwellShow(e, item) : undefined}
                onMouseLeave={linksArmed ? scheduleHideTooltip : undefined}
                onFocus={linksArmed ? (e) => scheduleDwellShow(e, item) : undefined}
                onBlur={linksArmed ? hideTooltip : undefined}
              >
                <img
                  src={item.icon}
                  alt={item.alt}
                  className="block select-none transition-[filter] duration-300 group-hover:brightness-[0.85] group-focus-visible:brightness-[0.85] w-7 h-7 xl:w-11 xl:h-11"
                />
              </a>
            </Fragment>
          ))}
        </div>
      </nav>
      {socialTooltip && typeof document !== 'undefined'
        ? createPortal(
            <div ref={shellRef} className="skill-tooltip-shell skill-tooltip-portal--fine-pointer-only">
              <div ref={tiltRef} className="skill-tooltip-tilt-follow">
                <div
                  ref={contentRef}
                  id={socialTooltipTipId}
                  role="tooltip"
                  className={`skill-tooltip-portal ${socialTipEntered ? 'is-visible' : ''}`}
                >
                  {socialTooltip.text}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
});

export default SocialLinksCard;
