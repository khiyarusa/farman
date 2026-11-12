/** Minimal DOM helpers — no framework, no virtual DOM, tiny and predictable. */

type Child = Node | string | number | null | undefined | false;

export interface ElProps {
  class?: string;
  text?: string;
  html?: string;
  title?: string;
  style?: Partial<CSSStyleDeclaration> | string;
  dataset?: Record<string, string>;
  attrs?: Record<string, string | number | boolean>;
  on?: Partial<Record<keyof HTMLElementEventMap, (ev: Event) => void>>;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: ElProps,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props?.class) node.className = props.class;
  if (props?.text !== undefined) node.textContent = props.text;
  if (props?.html !== undefined) node.innerHTML = props.html;
  if (props?.title) node.title = props.title;
  if (typeof props?.style === 'string') node.style.cssText = props.style;
  else if (props?.style) Object.assign(node.style, props.style);
  if (props?.dataset) for (const [k, v] of Object.entries(props.dataset)) node.dataset[k] = v;
  if (props?.attrs) {
    for (const [k, v] of Object.entries(props.attrs)) {
      if (v === false) continue;
      if (v === true) node.setAttribute(k, '');
      else node.setAttribute(k, String(v));
    }
  }
  if (props?.on) {
    for (const [event, handler] of Object.entries(props.on)) {
      if (handler) node.addEventListener(event, handler);
    }
  }
  append(node, children);
  return node;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'string' || typeof child === 'number'
      ? document.createTextNode(String(child))
      : child);
  }
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function icon(path: string, size = 18): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path);
  svg.appendChild(p);
  return svg;
}

export const ICONS = {
  back: 'M15 18l-6-6 6-6',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 110-4h.09A1.65 1.65 0 003.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H8a1.65 1.65 0 001-1.51V2a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V8a1.65 1.65 0 001.51 1H22a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z',
  pause: 'M8 5v14M16 5v14',
  camera:
    'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  play: 'M6 4l14 8-14 8z',
  chevron: 'M9 18l6-6-6-6',
  check: 'M20 6L9 17l-5-5',
  close: 'M18 6L6 18M6 6l12 12',
  fuel: 'M3 22V6a2 2 0 012-2h6a2 2 0 012 2v16M2 22h14M13 8h3l4 4v7a2 2 0 01-4 0v-5h-3',
  wrench:
    'M14.7 6.3a4 4 0 105.6 5.6l-1.5 1.5a2 2 0 11-2.8-2.8l1.5-1.5a4 4 0 00-5.6-5.6L9 5.6 5.6 2 2 5.6l3.6 3.6-2.2 2.2a4 4 0 105.6 5.6',
  gauge: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 12l4-4',
};
