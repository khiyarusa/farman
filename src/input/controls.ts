import { el } from '../ui/dom';
import { FA } from '../ui/i18n';
import { clamp, moveTowards } from '../core/math';
import type { SteeringMode } from '../save/schema';

export interface InputState {
  throttle: number;
  brake: number;
  clutch: number;
  steer: number;
  handbrake: number;
}

export type ControlAction =
  | 'shiftUp'
  | 'shiftDown'
  | 'selector'
  | 'camera'
  | 'pause'
  | 'reset'
  | 'handbrake';

export interface ControlOptions {
  manual: boolean;
  steeringMode: SteeringMode;
  leftHanded: boolean;
  onAction: (action: ControlAction) => void;
}

/**
 * Touch controls: analog pedals, a draggable steering wheel (or left/right
 * buttons / gyro), gear selection, handbrake and camera.
 *
 * Pedal input is derived from the touch point inside each pedal, never from
 * capacitive pressure, which ordinary phone screens cannot measure.
 */
export class TouchControls {
  readonly root: HTMLElement;
  readonly state: InputState = { throttle: 0, brake: 0, clutch: 0, steer: 0, handbrake: 0 };
  private wheelEl: HTMLElement | null = null;
  private wheelAngle = 0;
  private steeringPointer: number | null = null;
  private steeringStartAngle = 0;
  private steeringValue = 0;
  private pedalPointers = new Map<number, { key: 'throttle' | 'brake' | 'clutch'; el: HTMLElement }>();
  private buttonsSteer = 0;
  private gyroSteer = 0;
  private gyroEnabled = false;
  private leftHanded: boolean;
  private disposed = false;

  constructor(private readonly opts: ControlOptions) {
    this.leftHanded = opts.leftHanded;
    this.root = el('div', { class: 'controls' });
    this.build();
    if (opts.steeringMode === 'gyro') this.enableGyro();
  }

  private build(): void {
    const { manual, steeringMode } = this.opts;
    const leftSide = this.leftHanded;

    // --- steering --------------------------------------------------------
    if (steeringMode === 'buttons') {
      const wrap = el('div', { class: 'steering-buttons' });
      wrap.style.cssText = `position:absolute;bottom:calc(1.2rem + var(--safe-b));${leftSide ? 'left' : 'right'}:calc(1.2rem + var(--safe-l));display:flex;gap:0.6rem`;
      for (const dir of ['left', 'right'] as const) {
        const btn = el('button', { class: 'icon-btn', attrs: { 'aria-label': dir === 'left' ? 'چپ' : 'راست' } });
        btn.style.width = '4.2rem';
        btn.style.height = '4.2rem';
        btn.textContent = dir === 'left' ? '◀' : '▶';
        const set = (v: number): void => {
          if (dir === 'left') this.buttonsSteer = -v;
          else this.buttonsSteer = v;
        };
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          btn.setPointerCapture(e.pointerId);
          set(1);
        });
        btn.addEventListener('pointerup', () => set(0));
        btn.addEventListener('pointercancel', () => set(0));
        wrap.appendChild(btn);
      }
      this.root.appendChild(wrap);
    } else if (steeringMode === 'wheel') {
      const wheel = el('div', { class: 'steering-wheel' });
      wheel.style[leftSide ? 'left' : 'right'] = 'calc(1.3rem + var(--safe-' + (leftSide ? 'l' : 'r') + '))';
      const hub = el('div', { class: 'steering-hub', text: 'فرمان' });
      wheel.appendChild(hub);
      wheel.addEventListener('pointerdown', (e) => this.onWheelDown(e, wheel));
      wheel.addEventListener('pointermove', (e) => this.onWheelMove(e));
      wheel.addEventListener('pointerup', (e) => this.onWheelUp(e));
      wheel.addEventListener('pointercancel', (e) => this.onWheelUp(e));
      this.wheelEl = wheel;
      this.root.appendChild(wheel);
    }

    // --- pedals ----------------------------------------------------------
    const pedals = el('div', { class: 'pedals' });
    pedals.style[leftSide ? 'right' : 'left'] = 'calc(1.2rem + var(--safe-' + (leftSide ? 'r' : 'l') + '))';
    const brake = this.makePedal('brake', FA.brake, 'pedal--brake');
    const throttle = this.makePedal('throttle', FA.throttle, '');
    pedals.append(brake, throttle);
    if (manual) {
      const clutch = this.makePedal('clutch', FA.clutch, 'pedal--clutch');
      pedals.appendChild(clutch);
    }
    this.root.appendChild(pedals);

    // --- gearbox ---------------------------------------------------------
    if (manual) {
      const gearbox = el('div', { class: 'gearbox' });
      gearbox.style[leftSide ? 'right' : 'left'] = 'calc(5.6rem + var(--safe-' + (leftSide ? 'r' : 'l') + '))';
      const up = el('button', { class: 'gear-btn', text: '▲' });
      const down = el('button', { class: 'gear-btn', text: '▼' });
      const neutral = el('button', { class: 'gear-btn', text: 'N', style: 'font-size:0.75rem' });
      up.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.opts.onAction('shiftUp');
      });
      down.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.opts.onAction('shiftDown');
      });
      neutral.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.opts.onAction('selector');
      });
      gearbox.append(up, neutral, down);
      this.root.appendChild(gearbox);
    } else {
      const box = el('div', { class: 'gearbox' });
      box.style[leftSide ? 'right' : 'left'] = 'calc(5.6rem + var(--safe-' + (leftSide ? 'r' : 'l') + '))';
      const selector = el('button', { class: 'gear-btn', text: 'D', style: 'width:3.6rem;font-size:0.8rem' });
      selector.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.opts.onAction('selector');
      });
      box.appendChild(selector);
      this.root.appendChild(box);
    }

    // --- handbrake -------------------------------------------------------
    const handbrake = el('button', {
      class: 'icon-btn',
      text: FA.handbrake,
      style: 'position:absolute;bottom:calc(11.6rem + var(--safe-b));width:auto;padding:0 0.7rem;height:2.3rem;font-size:0.68rem',
    });
    handbrake.style[leftSide ? 'right' : 'left'] = 'calc(1.3rem + var(--safe-' + (leftSide ? 'r' : 'l') + '))';
    const setHandbrake = (v: number): void => {
      this.state.handbrake = v;
    };
    handbrake.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      handbrake.setPointerCapture(e.pointerId);
      setHandbrake(1);
    });
    handbrake.addEventListener('pointerup', () => setHandbrake(0));
    handbrake.addEventListener('pointercancel', () => setHandbrake(0));
    this.root.appendChild(handbrake);

    // --- top buttons -----------------------------------------------------
    const top = el('div', { class: 'small-controls' });
    const camera = el('button', { class: 'icon-btn', attrs: { 'aria-label': FA.camera } });
    camera.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="3.6"/></svg>';
    camera.addEventListener('click', () => this.opts.onAction('camera'));
    const pause = el('button', { class: 'icon-btn', attrs: { 'aria-label': FA.pause } });
    pause.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5v14M15 5v14"/></svg>';
    pause.addEventListener('click', () => this.opts.onAction('pause'));
    const reset = el('button', { class: 'icon-btn', attrs: { 'aria-label': FA.resetCar }, text: '↺' });
    reset.addEventListener('click', () => this.opts.onAction('reset'));
    top.append(camera, reset, pause);
    this.root.appendChild(top);
  }

  private makePedal(key: 'throttle' | 'brake' | 'clutch', label: string, cls: string): HTMLElement {
    const pedal = el('div', { class: `pedal ${cls}`.trim() });
    const fill = el('div', { class: 'fill' });
    pedal.append(fill, el('div', { class: 'ticks' }), el('div', { class: 'cap', text: label }));
    const apply = (e: PointerEvent): void => {
      const rect = pedal.getBoundingClientRect();
      const ratio = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
      this.state[key] = ratio;
      fill.style.height = `${ratio * 100}%`;
    };
    pedal.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      pedal.setPointerCapture(e.pointerId);
      this.pedalPointers.set(e.pointerId, { key, el: pedal });
      apply(e);
    });
    pedal.addEventListener('pointermove', (e) => {
      if (this.pedalPointers.get(e.pointerId)?.key !== key) return;
      apply(e);
    });
    const release = (e: PointerEvent): void => {
      this.pedalPointers.delete(e.pointerId);
      this.state[key] = 0;
      fill.style.height = '0%';
    };
    pedal.addEventListener('pointerup', release);
    pedal.addEventListener('pointercancel', release);
    return pedal;
  }

  private onWheelDown(e: PointerEvent, wheel: HTMLElement): void {
    e.preventDefault();
    wheel.setPointerCapture(e.pointerId);
    this.steeringPointer = e.pointerId;
    const rect = wheel.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    this.steeringStartAngle = Math.atan2(e.clientY - cy, e.clientX - cx) - this.steeringValue * Math.PI * 0.75;
  }

  private onWheelMove(e: PointerEvent): void {
    if (this.steeringPointer !== e.pointerId || !this.wheelEl) return;
    const rect = this.wheelEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
    let delta = angle - this.steeringStartAngle;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    this.steeringValue = clamp(delta / (Math.PI * 0.75), -1, 1);
  }

  private onWheelUp(e: PointerEvent): void {
    if (this.steeringPointer !== e.pointerId) return;
    this.steeringPointer = null;
  }

  private enableGyro(): void {
    const handler = (event: DeviceOrientationEvent): void => {
      const gamma = event.gamma ?? 0;
      // Landscape: tilting the device left/right maps to gamma.
      this.gyroSteer = clamp(gamma / 35, -1, 1);
      this.gyroEnabled = true;
    };
    window.addEventListener('deviceorientation', handler);
  }

  /** Called once per rendered frame to smooth analog inputs. */
  update(dt: number): void {
    if (this.disposed) return;
    let steer = this.steeringValue;
    if (this.opts.steeringMode === 'buttons') steer = this.buttonsSteer;
    if (this.opts.steeringMode === 'gyro' && this.gyroEnabled) steer = this.gyroSteer;

    const target = clamp(steer, -1, 1);
    const rate = this.steeringPointer !== null || this.opts.steeringMode !== 'wheel' ? 6 : 7;
    this.state.steer = moveTowards(this.state.steer, target, dt * rate * (this.steeringPointer !== null ? 1 : 1.8));
    if (this.steeringPointer === null && this.opts.steeringMode === 'wheel') {
      this.steeringValue = moveTowards(this.steeringValue, 0, dt * 2.6);
    }

    if (this.wheelEl) {
      this.wheelAngle = this.state.steer * 135;
      this.wheelEl.style.transform = `rotate(${this.wheelAngle}deg)`;
    }
  }

  setVisible(visible: boolean): void {
    this.root.style.display = visible ? '' : 'none';
  }

  dispose(): void {
    this.disposed = true;
    this.root.remove();
  }
}
