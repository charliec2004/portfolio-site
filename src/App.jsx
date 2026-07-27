import { useEffect, useRef, useState } from 'react';
import charliePortrait from './assets/images/charlie-clean.webp';
import { PROJECTS } from './data/projects';

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/charliec2004' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/charlescon' },
  { label: 'X / Twitter', href: 'https://x.com/charliee_' },
];

const PRACTICE = [
  'Product engineering',
  'Interface design',
  'Agentic systems',
  'Applied machine learning',
  'Systems thinking',
];

function ExternalLink({ href, children, className = '' }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="external-arrow" aria-hidden="true">↗</span>
    </a>
  );
}

function InvertingCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointer.matches) return undefined;

    const cursor = cursorRef.current;
    let frame = null;
    let x = 0;
    let y = 0;

    const render = () => {
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      cursor.style.opacity = '1';
      frame = null;
    };

    const move = (event) => {
      x = event.clientX;
      y = event.clientY;
      if (frame === null) frame = window.requestAnimationFrame(render);
    };

    const hide = () => {
      cursor.style.opacity = '0';
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', hide);
    document.documentElement.addEventListener('mouseleave', hide);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', hide);
      document.documentElement.removeEventListener('mouseleave', hide);
    };
  }, []);

  return <div ref={cursorRef} className="inverting-cursor" aria-hidden="true" />;
}

function ProjectVisual({ index }) {
  if (index === 0) {
    return (
      <div className="visual visual--quorum" aria-hidden="true">
        <div className="q-browser">
          <div className="q-browser__top">
            <span>QUORUM / DEGREE PLAN</span>
            <span>2027</span>
          </div>
          <div className="q-plan">
            {['FALL 25', 'SPRING 26', 'FALL 26', 'SPRING 27'].map((term, termIndex) => (
              <div className="q-term" key={term}>
                <span>{term}</span>
                {[0, 1, 2].map((course) => (
                  <i key={`${termIndex}-${course}`} />
                ))}
              </div>
            ))}
          </div>
          <div className="q-progress"><i /></div>
          <div className="q-caption">124 / 128 credits mapped</div>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="visual visual--scheduler" aria-hidden="true">
        <div className="schedule-label">OPTIMAL WEEK / 04</div>
        <div className="schedule-grid">
          {Array.from({ length: 35 }, (_, cell) => (
            <i
              className={[3, 6, 8, 13, 16, 17, 22, 26, 31].includes(cell) ? 'is-filled' : ''}
              key={cell}
            />
          ))}
        </div>
        <div className="schedule-foot">
          <span>0 conflicts</span>
          <span>50+ volunteers</span>
        </div>
      </div>
    );
  }

  return (
    <div className="visual visual--tennis" aria-hidden="true">
      <div className="court">
        <span className="court__net" />
        <span className="ball ball--one" />
        <span className="ball ball--two" />
        <span className="score">64.5%</span>
        <span className="score-label">OUT-OF-SAMPLE ACCURACY</span>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('portfolio-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const copyTimer = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('portfolio-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#0a0a0a' : '#f4f4f0'
    );
  }, [theme]);

  useEffect(() => {
    const updateScroll = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const progress = distance > 0 ? window.scrollY / distance : 0;
      document.documentElement.style.setProperty('--scroll-progress', progress);
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
    return () => {
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const copyEmail = async () => {
    const email = 'charlieconner04@gmail.com';
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const input = document.createElement('textarea');
      input.value = email;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="paper-grain" aria-hidden="true" />
      <div className="scroll-track" aria-hidden="true"><i /></div>
      <InvertingCursor />

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Charles Conner, home" onClick={closeMenu}>
          Charles Conner
        </a>

        <button
          className="menu-toggle icon-button"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={menuOpen ? 'menu-icon is-open' : 'menu-icon'} />
        </button>

        <nav className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Primary navigation">
          <a href="#work" onClick={closeMenu}>Work</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
        </nav>

        <button
          className="theme-toggle"
          type="button"
          onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <span className="theme-toggle__icon" aria-hidden="true" />
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
      </header>

      <main id="top">
        <section className="hero section-shell" aria-labelledby="hero-title">
          <div className="hero__meta eyebrow">
            <span>Product engineer</span>
            <span>Bay Area</span>
          </div>
          <h1 id="hero-title">
            I make useful things
            <span>feel inevitable.</span>
          </h1>
          <div className="hero__bottom">
            <p>
              Charles Conner is a product engineer working across software,
              systems, and applied AI.
            </p>
            <a className="scroll-cue" href="#work">
              <span>Selected work</span>
              <span className="scroll-cue__line" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="work section-shell" id="work" aria-labelledby="work-title">
          <header className="section-heading">
            <p className="eyebrow">Selected work / 2025—26</p>
            <h2 id="work-title">Built to be used.</h2>
          </header>

          <div className="project-list">
            {PROJECTS.map((project, index) => (
              <article className="project" key={project.name}>
                <div className="project__number" aria-hidden="true">0{index + 1}</div>
                <div className="project__copy">
                  <div className="project__title-row">
                    <h3>{project.name}</h3>
                    <ExternalLink href={project.url} className="project__link">
                      View project
                    </ExternalLink>
                  </div>
                  <p>{project.description}</p>
                </div>
                <ExternalLink href={project.url} className="project__visual-link">
                  <ProjectVisual index={index} />
                  <span className="sr-only">Open {project.name}</span>
                </ExternalLink>
              </article>
            ))}
          </div>
        </section>

        <section className="about section-shell" id="about" aria-labelledby="about-title">
          <header className="section-heading">
            <p className="eyebrow">About / In practice</p>
            <h2 id="about-title">Design the system.<br />Then make it real.</h2>
          </header>

          <div className="about__grid">
            <figure className="portrait">
              <img src={charliePortrait} alt="Charles Conner" />
              <figcaption>Charles Conner, 2026</figcaption>
            </figure>
            <div className="about__body">
              <p className="about__lead">
                I work across product and engineering, from early decisions
                through shipped software.
              </p>
              <div className="about__columns">
                <p>
                  I like building things, learning by doing, and changing course
                  when the work meets reality. I care about clear thinking, solid
                  systems, and details that quietly make a difference.
                </p>
                <p>
                  My background combines computer science at Chapman University
                  with analytics, product thinking, and hands-on engineering.
                </p>
              </div>
              <div className="practice">
                <span className="eyebrow">Practice</span>
                <ul>
                  {PRACTICE.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="contact section-shell" id="contact" aria-labelledby="contact-title">
          <p className="eyebrow">Have a project in mind?</p>
          <h2 id="contact-title">Let’s make it<br />make sense.</h2>
          <button className="email-button" type="button" onClick={copyEmail}>
            <span>{copied ? 'Copied to clipboard' : 'charlieconner04@gmail.com'}</span>
            <span aria-hidden="true">{copied ? '✓' : 'Copy'}</span>
          </button>
          <div className="contact__footer">
            <div className="social-links">
              {SOCIALS.map((social) => (
                <ExternalLink href={social.href} key={social.label}>{social.label}</ExternalLink>
              ))}
            </div>
            <p>Designed &amp; built by Charles · © {new Date().getFullYear()}</p>
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? 'Email copied to clipboard' : ''}
          </span>
        </section>
      </main>
    </>
  );
}

export default App;
