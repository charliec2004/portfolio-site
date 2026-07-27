import { useState, useCallback, useRef, useEffect } from 'react';
import { PROJECTS } from '../data/projects';
import { SKILLS } from '../data/skills';

const MAX_HISTORY = 50;

const COMMANDS = new Map([
  ['help', () => [
    'Available commands:',
    '',
    '  help        Show this help message',
    '  about       About me',
    '  skills      List my technical skills',
    '  projects    List my projects',
    '  contact     Show contact info',
    '  resume      Open my resume (PDF)',
    '  github      Open my GitHub profile',
    '  linkedin    Open my LinkedIn profile',
    '  clear       Clear the terminal',
    '  exit        Close the terminal',
  ].join('\n')],

  ['about', () =>
    'I like making things that work well and feel good to use. I enjoy the process of figuring out how something should work, building it, and seeing people actually use it. I move between design and engineering because both sides shape how ideas become real. I care about clear thinking, solid systems, and details that quietly make a difference. This site is just a place to share what I\'m building and learning over time.'
  ],

  ['skills', () => {
    const list = SKILLS.map((s) => `  - ${s.name}`).join('\n');
    return `Technical skills:\n\n${list}`;
  }],

  ['projects', () => {
    const list = PROJECTS.map(
      (p) => `  ${p.name}\n    ${p.url}`
    ).join('\n\n');
    return `Projects:\n\n${list}`;
  }],

  ['contact', () => 'Email: charlieconner04@gmail.com'],

  ['email', () => 'charlieconner04@gmail.com'],

  ['resume', () => {
    window.open('/Charles_Conner_Resume.pdf', '_blank', 'noopener');
    return 'Opening resume...';
  }],

  ['github', () => {
    window.open('https://github.com/charliec2004', '_blank', 'noopener');
    return 'Opening GitHub...';
  }],

  ['linkedin', () => {
    window.open('https://www.linkedin.com/in/charlescon', '_blank', 'noopener');
    return 'Opening LinkedIn...';
  }],

  ['sudo hire me', () => 'Permission granted. Sending r\u00e9sum\u00e9... \u2728'],
]);

export default function useTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const clearLines = useCallback(() => setLines([]), []);

  const handleSubmit = useCallback(() => {
    const raw = inputValue.trim();
    if (!raw) return;

    // Push to history (cap at MAX_HISTORY)
    historyRef.current = [raw, ...historyRef.current].slice(0, MAX_HISTORY);
    historyIndexRef.current = -1;

    // Echo the input line
    setLines((prev) => [...prev, { type: 'input', text: raw }]);
    setInputValue('');

    const cmd = raw.toLowerCase();

    // Built-in commands that mutate state directly
    if (cmd === 'clear') {
      clearLines();
      return;
    }
    if (cmd === 'exit') {
      close();
      return;
    }

    const handler = COMMANDS.get(cmd);
    if (handler) {
      const output = handler();
      setLines((prev) => [...prev, { type: 'output', text: output }]);
    } else {
      setLines((prev) => [
        ...prev,
        { type: 'output', text: `Command not found: ${raw}. Type 'help' for available commands.` },
      ]);
    }
  }, [inputValue, clearLines, close]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.key === 'Escape') {
      close();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = historyRef.current;
      if (history.length === 0) return;
      const next = Math.min(historyIndexRef.current + 1, history.length - 1);
      historyIndexRef.current = next;
      setInputValue(history[next]);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const history = historyRef.current;
      const next = historyIndexRef.current - 1;
      if (next < 0) {
        historyIndexRef.current = -1;
        setInputValue('');
      } else {
        historyIndexRef.current = next;
        setInputValue(history[next]);
      }
    }
  }, [handleSubmit, close]);

  // Global backtick toggle
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Backquote') return;

      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      e.preventDefault();
      setIsOpen((prev) => !prev);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return {
    isOpen,
    lines,
    inputValue,
    setInputValue,
    handleSubmit,
    handleKeyDown,
    open,
    close,
    clearLines,
  };
}
