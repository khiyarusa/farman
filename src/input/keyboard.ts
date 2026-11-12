import { el } from '../ui/dom';
import { clamp } from '../core/math';

/** Keyboard fallback for desktop development and QA automation. */
export class KeyboardInput {
  readonly state = { throttle: 0, brake: 0, clutch: 0, steer: 0, handbrake: 0 };
  private keys = new Set<string>();
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    this.keys.add(e.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyC') this.actions.push('camera');
    if (e.code === 'KeyP' || e.code === 'Escape') this.actions.push('pause');
    if (e.code === 'KeyR') this.actions.push('reset');
    if (e.code === 'KeyE') this.actions.push('shiftUp');
    if (e.code === 'KeyQ') this.actions.push('shiftDown');
    if (e.code === 'KeyM') this.actions.push('selector');
  };
  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };
  actions: string[] = [];

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  update(dt: number): void {
    const k = this.keys;
    const targetThrottle = k.has('KeyW') || k.has('ArrowUp') ? 1 : 0;
    const targetBrake = k.has('KeyS') || k.has('ArrowDown') ? 1 : 0;
    const targetSteer = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    this.state.throttle = moveTo(this.state.throttle, targetThrottle, dt * 3.2);
    this.state.brake = moveTo(this.state.brake, targetBrake, dt * 3.6);
    this.state.steer = moveTo(this.state.steer, targetSteer, dt * 3.4);
    this.state.clutch = k.has('ControlLeft') || k.has('ShiftLeft') ? 1 : 0;
    this.state.handbrake = k.has('Space') ? 1 : 0;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}

function moveTo(current: number, target: number, maxDelta: number): number {
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return clamp(current + Math.sign(d) * maxDelta, 0, 1);
}

/** Small on-screen hint used when keyboard is the active input. */
export function keyboardHint(): HTMLElement {
  return el('div', { class: 'hint-bar ltr', text: 'W A S D / arrows · Space handbrake · E/Q shift · C camera · P pause' });
}
