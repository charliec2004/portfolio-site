import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR = 'a, button, summary, [role="button"]';
const NON_TEXT_SELECTOR =
  'a, button, input, textarea, select, summary, [role="button"], [contenteditable="true"]';

/**
 * A small inverting dot that follows the pointer on fine-pointer devices.
 * It grows over interactive elements and becomes a caret over selectable text.
 * On touch devices it renders nothing visible and attaches no listeners.
 */
export default function Cursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointer.matches) return undefined;

    const cursor = cursorRef.current;
    let frame = null;
    let x = 0;
    let y = 0;
    let hasPointer = false;
    const metricsContext = document.createElement('canvas').getContext('2d');
    const metricsCache = new Map();

    const getGlyphMetrics = (style, character) => {
      if (!metricsContext) return null;

      const renderedCharacter = style.textTransform === 'uppercase'
        ? character.toLocaleUpperCase()
        : style.textTransform === 'lowercase'
          ? character.toLocaleLowerCase()
          : character;
      const font = [
        style.fontStyle,
        style.fontVariant,
        style.fontWeight,
        style.fontSize,
        style.fontFamily,
      ].join(' ');
      const cacheKey = `${font}|${renderedCharacter}`;

      if (metricsCache.has(cacheKey)) return metricsCache.get(cacheKey);

      metricsContext.font = font;
      const glyph = metricsContext.measureText(renderedCharacter);
      const fontBox = metricsContext.measureText('Hg');
      const fontSize = Number.parseFloat(style.fontSize) || 16;
      const metrics = {
        ascent: glyph.actualBoundingBoxAscent || fontSize * 0.72,
        descent: glyph.actualBoundingBoxDescent || fontSize * 0.18,
        fontAscent: fontBox.fontBoundingBoxAscent
          || fontBox.actualBoundingBoxAscent
          || fontSize * 0.8,
        fontDescent: fontBox.fontBoundingBoxDescent
          || fontBox.actualBoundingBoxDescent
          || fontSize * 0.2,
      };

      metricsCache.set(cacheKey, metrics);
      return metrics;
    };

    const isSelectableTextAtPoint = (clientX, clientY, element) => {
      const elementStyle = element ? window.getComputedStyle(element) : null;

      if (
        !element
        || element.closest(NON_TEXT_SELECTOR)
        || elementStyle?.userSelect === 'none'
      ) {
        return false;
      }

      let textNode;
      let offset;

      if (document.caretPositionFromPoint) {
        const position = document.caretPositionFromPoint(clientX, clientY);
        textNode = position?.offsetNode;
        offset = position?.offset;
      } else if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(clientX, clientY);
        textNode = range?.startContainer;
        offset = range?.startOffset;
      }

      if (
        textNode?.nodeType !== Node.TEXT_NODE
        || !textNode.textContent?.trim()
        || typeof offset !== 'number'
      ) {
        return false;
      }

      const textLength = textNode.textContent.length;
      const characterOffsets = [];

      if (offset < textLength) characterOffsets.push([offset, offset + 1]);
      if (offset > 0) characterOffsets.push([offset - 1, offset]);

      return characterOffsets.some(([start, end]) => {
        const character = textNode.textContent.slice(start, end);
        if (!character.trim()) return false;

        const range = document.createRange();
        range.setStart(textNode, start);
        range.setEnd(textNode, end);
        const rect = range.getBoundingClientRect();
        const textElement = textNode.parentElement || element;
        const textStyle = window.getComputedStyle(textElement);
        const metrics = getGlyphMetrics(textStyle, character);

        if (!metrics) return false;

        const fontBoxHeight = metrics.fontAscent + metrics.fontDescent;
        const baseline = (
          rect.top
          + ((rect.height - fontBoxHeight) / 2)
          + metrics.fontAscent
        );
        const visualTop = baseline - metrics.ascent;
        const visualBottom = baseline + metrics.descent;

        return (
          clientX >= rect.left - 2
          && clientX <= rect.right + 2
          && clientY >= visualTop - 2
          && clientY <= visualBottom + 2
        );
      });
    };

    const render = () => {
      frame = null;
      if (!hasPointer) return;

      const element = document.elementFromPoint(x, y);
      const interactiveElement = element?.closest(INTERACTIVE_SELECTOR);
      const state = interactiveElement
        ? interactiveElement.classList.contains('project__visual-link')
          ? 'visual'
          : 'interactive'
        : isSelectableTextAtPoint(x, y, element)
          ? 'text'
          : 'default';

      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      cursor.classList.toggle('is-interactive', state === 'interactive');
      cursor.classList.toggle('is-visual', state === 'visual');
      cursor.classList.toggle('is-text', state === 'text');
      cursor.style.opacity = '1';
    };

    const scheduleRender = () => {
      if (frame === null) frame = window.requestAnimationFrame(render);
    };

    const move = (event) => {
      x = event.clientX;
      y = event.clientY;
      hasPointer = true;
      scheduleRender();
    };

    const hide = () => {
      hasPointer = false;
      cursor.style.opacity = '0';
      cursor.classList.remove('is-text', 'is-interactive', 'is-visual', 'is-pressed');
    };

    const press = () => {
      if (!cursor.classList.contains('is-text')) {
        cursor.classList.add('is-pressed');
      }
    };

    const release = () => cursor.classList.remove('is-pressed');

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', press, { passive: true });
    window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    window.addEventListener('scroll', scheduleRender, { passive: true });
    window.addEventListener('blur', hide);
    document.documentElement.addEventListener('mouseleave', hide);

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('scroll', scheduleRender);
      window.removeEventListener('blur', hide);
      document.documentElement.removeEventListener('mouseleave', hide);
    };
  }, []);

  return (
    <div ref={cursorRef} className="cursor" aria-hidden="true">
      <i className="cursor__shape" />
    </div>
  );
}
