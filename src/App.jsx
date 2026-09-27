import { useEffect, useRef, useState } from 'react';
import Cursor from './components/Cursor';
import ProjectVisual from './components/ProjectVisual';
import ExternalLink from './components/ExternalLink';
import PointWaveField from './components/PointWaveField';
import { PROJECTS } from './data/projects';
import useTheme from './hooks/useTheme';

const EMAIL = 'charlieconner04@gmail.com';

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/charliec2004' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/charlescon' },
  { label: 'X', href: 'https://x.com/charliee_' },
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
    const success = document.execCommand('copy');
    input.remove();
    if (!success) throw new Error('Copy unavailable');
  }
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [copyStatus, setCopyStatus] = useState('idle');
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
    window.clearTimeout(copyTimer.current);
    try {
      await copyText(EMAIL);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    } finally {
      copyTimer.current = window.setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <Cursor />
      <a className="skip-link" href="#main-content">Skip to content</a>
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

      <main id="main-content" inert={menuOpen}>
        <section className="hero section-shell" aria-labelledby="hero-title">
          <PointWaveField theme={theme} />
          <h1 id="hero-title">
            Charles Conner
            <span>Product engineer.</span>
          </h1>
          <div className="hero__bottom">
            <p>
              Based in the Bay Area. Building useful software, from
              student schedules to personal assistants.
            </p>
          </div>
        </section>

        <section className="work section-shell" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <h2 className="section-title" id="work-title">Things I’ve Built</h2>
          </div>
          <div className="project-list">
            {PROJECTS.filter((project) => project.featured).map((project) => (
              <article className="project" key={project.name}>
                <div className="project__copy">
                  <h3>
                    <a href={project.url} target="_blank" rel="noreferrer">
                      {project.name}
                    </a>
                  </h3>
                  <p>
                    <span className="project__outcome">{project.outcome}</span>{' '}
                    {project.description}
                  </p>
                </div>
                <a className="project__visual-link" href={project.url} target="_blank" rel="noreferrer" aria-label={`Explore ${project.name}`}>
                  <ProjectVisual kind={project.visual} />
                </a>
              </article>
            ))}
          </div>
          <div className="more-work">
            <h3>More things I’ve made</h3>
            <div className="more-work__grid">
              {PROJECTS.filter((project) => !project.featured).map((project) => (
                <article key={project.name}>
                  <h4><ExternalLink href={project.url}>{project.name}</ExternalLink></h4>
                  <p>{project.description}</p>
                </article>
              ))}
            </div>
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
                I’m currently studying computer science at Chapman University.
              </p>
              <p className="about__description">
                These days, I’m exploring personal assistants, everyday planning tools,
                and what tennis data can tell us about the next match.
              </p>
            </div>
          </div>
        </section>

        <section className="contact section-shell" id="contact" aria-labelledby="contact-title">
          <h2 id="contact-title">Let’s talk.</h2>
          <div className="email-row">
            <a href={`mailto:${EMAIL}`}>{EMAIL}<span aria-hidden="true"> ↗</span></a>
            <button className="email-button" type="button" onClick={copyEmail} aria-live="polite" aria-atomic="true">
              {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Couldn’t copy' : 'Copy email'}
            </button>
          </div>
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
