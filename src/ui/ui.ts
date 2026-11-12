import { el } from './dom';
import type { App } from '../app';

/** Screen router and overlay host. Only one screen is mounted at a time. */
export class UIRoot {
  readonly root: HTMLElement;
  private screenLayer: HTMLElement;
  private hudLayer: HTMLElement;
  private overlayLayer: HTMLElement;
  private toastEl: HTMLElement;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private current: HTMLElement | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.screenLayer = el('div', { class: 'screen-layer', style: 'position:absolute;inset:0;pointer-events:none;' });
    this.screenLayer.style.pointerEvents = 'none';
    this.hudLayer = el('div', { class: 'hud-layer', style: 'position:absolute;inset:0;pointer-events:none;' });
    this.overlayLayer = el('div', { class: 'overlay-layer', style: 'position:absolute;inset:0;pointer-events:none;' });
    this.toastEl = el('div', { class: 'toast' });
    this.root.append(this.screenLayer, this.hudLayer, this.overlayLayer, this.toastEl);
  }

  mountScreen(node: HTMLElement): void {
    if (this.current) {
      const old = this.current;
      this.current = null;
      old.classList.remove('is-active');
      old.classList.add('is-leaving');
      setTimeout(() => old.remove(), 320);
    }
    node.classList.add('screen', 'is-active');
    node.style.pointerEvents = 'auto';
    this.screenLayer.appendChild(node);
    this.current = node;
    requestAnimationFrame(() => node.classList.add('is-active'));
  }

  clearScreen(): void {
    if (!this.current) return;
    const old = this.current;
    this.current = null;
    old.classList.remove('is-active');
    setTimeout(() => old.remove(), 320);
  }

  setHud(node: HTMLElement | null): void {
    this.hudLayer.replaceChildren();
    if (node) this.hudLayer.appendChild(node);
  }

  openOverlay(node: HTMLElement): void {
    this.overlayLayer.replaceChildren(node);
  }

  closeOverlay(): void {
    this.overlayLayer.replaceChildren();
  }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('is-visible');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('is-visible'), 2200);
  }

  setOpacity(opacity: number): void {
    this.root.style.opacity = String(opacity);
  }
}

export interface GameHost extends App {}

/** Full-screen shell with a title bar and scrollable body. */
export function shell(opts: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: HTMLElement[];
  body: HTMLElement;
  scrim?: boolean;
}): HTMLElement {
  const root = el('div', { class: 'screen' });
  if (opts.scrim !== false) root.appendChild(el('div', { class: 'scrim' }));

  const topbar = el('div', { class: 'topbar' });
  const titleWrap = el(
    'div',
    { class: 'topbar-title' },
    el('div', { class: 'eyebrow', text: opts.subtitle ?? 'فرمان' }),
    el('h1', { class: 'h-l', text: opts.title }),
  );
  const actions = el('div', { class: 'topbar-actions' });
  if (opts.onBack) {
    const back = el('button', { class: 'btn btn--ghost btn--icon', title: 'بازگشت' });
    back.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
    back.addEventListener('click', opts.onBack);
    actions.appendChild(back);
  }
  for (const action of opts.actions ?? []) actions.appendChild(action);

  topbar.append(actions, titleWrap);
  root.append(topbar, opts.body);
  return root;
}
