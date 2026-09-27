import { useEffect, useRef, useState } from 'react';
import ExternalLink from './components/ExternalLink';
import PointWaveField from './components/PointWaveField';
import ProjectVisual from './components/ProjectVisual';
import { PROJECTS } from './data/projects';
import useTheme from './hooks/useTheme';

const EMAIL = 'charlieconner04@gmail.com';

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/charliec2004' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/charlescon' },
  { label: 'X', href: 'https://x.com/charliee_' },
];

const FOCUS = [
  'Product engineering',
  'Interface design',
  'Agentic systems',
  'Applied machine learning',
  'Systems thinking',
];

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const copyTimer = useRef(null);
  const menuToggle = useRef(null);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuToggle.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth > 720) setMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [menuOpen]);

  const copyEmail = async () => {
    await copyText(EMAIL);
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="/">Charles Conner</a>

        <button
          ref={menuToggle}
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={menuOpen ? 'menu-icon is-open' : 'menu-icon'} />
        </button>

        <nav className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Primary">
          <a href="#work" onClick={closeMenu}>Work</a>
          <a href="#about" onClick={closeMenu}>About</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
        </nav>

        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
        >
          <span className="theme-toggle__icon" aria-hidden="true" />
          <span>Theme</span>
        </button>
      </header>

      <main inert={menuOpen}>
        <section className="hero section-shell" aria-labelledby="hero-title">
          <PointWaveField theme={theme} />
          <h1 id="hero-title">
            Charles Conner
            <span>Product engineer.</span>
          </h1>
          <div className="hero__bottom">
            <p>
              I build software end to end, from the first product decisions to
              shipped code, across interfaces, systems, and applied AI. Based in
              the Bay Area.
            </p>
            <a className="scroll-cue" href="#work">
              <span>Selected work</span>
              <span className="scroll-cue__line" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="work section-shell" id="work" aria-labelledby="work-title">
          <h2 className="section-title" id="work-title">Selected work</h2>

          <div className="project-list">
            {PROJECTS.map((project) => (
              <article className="project" key={project.name}>
                <div className="project__copy">
                  <h3>
                    <a href={project.url} target="_blank" rel="noreferrer">
                      {project.name}
                    </a>
                  </h3>
                  <p>{project.description}</p>
                  <p className="project__tech">{project.tech.join(', ')}</p>
                  <ExternalLink href={project.url} className="project__link">
                    {project.url.includes('github.com') ? 'View on GitHub' : 'Visit site'}
                  </ExternalLink>
                </div>
                <a
                  className="project__visual-link"
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ProjectVisual kind={project.visual} />
                  <span className="sr-only">Open {project.name}</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="about section-shell" id="about" aria-labelledby="about-title">
          <h2 className="section-title" id="about-title">About</h2>

          <div className="about__grid">
            <img
              className="portrait"
              src="/charles-conner.webp"
              alt="Charles Conner"
              width="900"
              height="1117"
              loading="lazy"
              decoding="async"
            />
            <div className="about__body">
              <p className="about__lead">
                I work across product and engineering, from early decisions
                through shipped software.
              </p>
              <div className="about__columns">
                <p>
                  I like building things and learning by doing. I care about
                  clear thinking, sound systems, and the small details that make
                  software feel considered.
                </p>
                <p>
                  I studied computer science at Chapman University. My background
                  combines analytics, product thinking, and hands-on engineering.
                </p>
              </div>
              <div className="focus">
                <span>Focus</span>
                <ul>
                  {FOCUS.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="contact section-shell" id="contact" aria-labelledby="contact-title">
          <h2 id="contact-title">Let’s talk.</h2>
          <button className="email-button" type="button" onClick={copyEmail}>
            <span>{EMAIL}</span>
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? 'Email address copied' : ''}
          </span>
          <footer className="contact__footer">
            <div className="social-links">
              {SOCIALS.map((social) => (
                <ExternalLink href={social.href} key={social.label}>{social.label}</ExternalLink>
              ))}
            </div>
            <p>© Charles Conner</p>
          </footer>
        </section>
      </main>
    </>
  );
}

export default App;
