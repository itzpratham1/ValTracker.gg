/**
 * Real-time AI HTML Typewriter Streamer & HUD Telemetry Engine
 * Safely streams complex HTML structures character-by-character without breaking tags,
 * while managing active prompt cursors, scan laser lines, live token counters, and fast-forward skipping.
 */

export interface StreamOptions {
  speed?: number; // ms per character chunk (default 8)
  chunkSize?: number; // characters per tick (default 6)
  onComplete?: () => void;
  showHudBar?: boolean;
  hudTitle?: string;
}

export interface StreamController {
  skip: () => void;
  cancel: () => void;
  isStreaming: () => boolean;
}

/**
 * Reactive HTML Streamer — Streams HTML tokens safely by calling onUpdate callback
 * Perfect for Svelte {@html} rendering without DOM manipulation conflicts.
 */
export function streamHtmlReactive(
  htmlContent: string,
  onUpdate: (html: string) => void,
  options: StreamOptions = {}
): StreamController {
  const speed = options.speed ?? 8;
  const chunkSize = options.chunkSize ?? 6;
  let active = true;
  let timerId: any = null;

  const cursorHtml = '<span class="ai-typing-cursor">▌</span>';

  // Tokenize into tags and text chunks
  const tokens: { isTag: boolean; content: string }[] = [];
  const tagRegex = /<[^>]+>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(htmlContent)) !== null) {
    if (match.index > lastIndex) {
      const text = htmlContent.slice(lastIndex, match.index);
      for (let i = 0; i < text.length; i += chunkSize) {
        tokens.push({ isTag: false, content: text.slice(i, i + chunkSize) });
      }
    }
    tokens.push({ isTag: true, content: match[0] });
    lastIndex = tagRegex.lastIndex;
  }
  if (lastIndex < htmlContent.length) {
    const text = htmlContent.slice(lastIndex);
    for (let i = 0; i < text.length; i += chunkSize) {
      tokens.push({ isTag: false, content: text.slice(i, i + chunkSize) });
    }
  }

  let tokenIndex = 0;
  let accumulated = '';

  function finish() {
    active = false;
    if (timerId) clearTimeout(timerId);
    onUpdate(htmlContent);
    options.onComplete?.();
  }

  function step() {
    if (!active) return;
    if (tokenIndex >= tokens.length) {
      finish();
      return;
    }

    let tagCount = 0;
    while (tokenIndex < tokens.length) {
      const token = tokens[tokenIndex++];
      accumulated += token.content;
      if (!token.isTag) {
        break; // stop at text chunk for typing tick
      }
      tagCount++;
      if (tagCount > 10) break;
    }

    onUpdate(accumulated + cursorHtml);
    timerId = setTimeout(step, speed);
  }

  step();

  return {
    skip: () => finish(),
    cancel: () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    },
    isStreaming: () => active
  };
}

/**
 * Direct DOM Node HTML Streamer
 */
export function streamHtmlOutput(
  targetEl: HTMLElement,
  htmlContent: string,
  options: StreamOptions = {}
): StreamController {
  const speed = options.speed ?? 12;
  const chunkSize = options.chunkSize ?? 3;
  let active = true;
  let timerId: any = null;

  targetEl.classList.add('ai-stream-active');

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
  const sourceRoot = doc.body.firstElementChild as HTMLElement;

  if (!sourceRoot) {
    targetEl.innerHTML = htmlContent;
    options.onComplete?.();
    return {
      skip: () => {},
      cancel: () => {},
      isStreaming: () => false
    };
  }

  targetEl.innerHTML = '';
  
  const laserEl = document.createElement('div');
  laserEl.className = 'ai-scan-laser';
  targetEl.appendChild(laserEl);

  const cursorEl = document.createElement('span');
  cursorEl.className = 'ai-typing-cursor';
  cursorEl.textContent = '▌';

  type Op =
    | { type: 'append_element'; element: HTMLElement; parentNode: Node }
    | { type: 'append_text_chunk'; textChunk: string; textNode: Text; parentNode: Node };

  const ops: Op[] = [];

  function buildOps(sourceNode: Node, targetParentNode: Node) {
    for (let i = 0; i < sourceNode.childNodes.length; i++) {
      const child = sourceNode.childNodes[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        const elem = child as HTMLElement;
        const cloned = elem.cloneNode(false) as HTMLElement;
        ops.push({ type: 'append_element', element: cloned, parentNode: targetParentNode });
        buildOps(elem, cloned);
      } else if (child.nodeType === Node.TEXT_NODE) {
        const textVal = child.textContent || '';
        if (textVal.length > 0) {
          const textNode = document.createTextNode('');
          ops.push({ type: 'append_element', element: textNode as any, parentNode: targetParentNode });
          
          for (let pos = 0; pos < textVal.length; pos += chunkSize) {
            const chunk = textVal.slice(pos, pos + chunkSize);
            ops.push({
              type: 'append_text_chunk',
              textChunk: chunk,
              textNode: textNode,
              parentNode: targetParentNode
            });
          }
        }
      }
    }
  }

  buildOps(sourceRoot, targetEl);

  let opIndex = 0;

  function moveCursor(lastParentNode: Node) {
    if (cursorEl.parentNode) {
      cursorEl.parentNode.removeChild(cursorEl);
    }
    if (lastParentNode && lastParentNode.nodeType === Node.ELEMENT_NODE) {
      (lastParentNode as HTMLElement).appendChild(cursorEl);
    } else if (lastParentNode && lastParentNode.nodeType === Node.TEXT_NODE) {
      (lastParentNode.parentNode as HTMLElement)?.appendChild(cursorEl);
    } else {
      targetEl.appendChild(cursorEl);
    }
  }

  function finish() {
    active = false;
    if (timerId) clearTimeout(timerId);
    if (cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
    if (laserEl.parentNode) laserEl.parentNode.removeChild(laserEl);
    targetEl.classList.remove('ai-stream-active');
    targetEl.innerHTML = htmlContent;
    
    animateAllNumbersInContainer(targetEl);
    options.onComplete?.();
  }

  function step() {
    if (!active) return;

    if (opIndex >= ops.length) {
      finish();
      return;
    }

    const op = ops[opIndex++];

    if (op.type === 'append_element') {
      op.parentNode.appendChild(op.element);
      if (op.element instanceof HTMLElement) {
        moveCursor(op.element);
      }
    } else if (op.type === 'append_text_chunk') {
      op.textNode.textContent += op.textChunk;
      moveCursor(op.parentNode);
    }

    timerId = setTimeout(step, speed);
  }

  step();

  return {
    skip: () => finish(),
    cancel: () => {
      active = false;
      if (timerId) clearTimeout(timerId);
      if (cursorEl.parentNode) cursorEl.parentNode.removeChild(cursorEl);
      if (laserEl.parentNode) laserEl.parentNode.removeChild(laserEl);
      targetEl.classList.remove('ai-stream-active');
    },
    isStreaming: () => active
  };
}

/**
 * Animates numeric stat values in a target container from 0 to target value
 */
export function animateAllNumbersInContainer(container: HTMLElement) {
  if (!container) return;
  const statElements = container.querySelectorAll('.card-val, .impact-val, .mr-kda-main, .ai-stat-pill-val, .hero-val, [data-countup]');
  
  statElements.forEach(el => {
    const rawText = el.textContent?.trim() || '';
    const numMatch = rawText.match(/^([^\d-]*)([-+]?\d*\.?\d+)(.*)$/);
    if (!numMatch) return;

    const prefix = numMatch[1];
    const targetNum = parseFloat(numMatch[2]);
    const suffix = numMatch[3];

    if (isNaN(targetNum) || targetNum === 0) return;

    const decimals = numMatch[2].includes('.') ? numMatch[2].split('.')[1].length : 0;
    const duration = 600;
    const startTime = performance.now();

    function updateNum(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = (targetNum * eased).toFixed(decimals);
      
      el.textContent = `${prefix}${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateNum);
      } else {
        el.textContent = rawText;
      }
    }

    requestAnimationFrame(updateNum);
  });
}
