import { el } from '../dom';
import { FA } from '../i18n';
import { formatNumber, formatPercent } from '../format';
import type { VehicleProfile } from '../../vehicles/profile';
import type { VehicleTelemetry } from '../../vehicles/vehicle';
import type { MissionDef } from '../../missions/definitions';

/**
 * Driving HUD (DOM overlay). Text stays crisp at any device resolution and the
 * layout follows the app's RTL design system.
 */
export class Hud {
  readonly root: HTMLElement;
  private speedEl: HTMLElement;
  private gearEl: HTMLElement;
  private gearModeEl: HTMLElement;
  private tachNeedle: SVGGElement;
  private tachValue: HTMLElement;
  private fuelBar: HTMLElement;
  private tempBar: HTMLElement;
  private fuelLabel: HTMLElement;
  private tempLabel: HTMLElement;
  private flags: Record<'abs' | 'tcs' | 'esc' | 'limiter' | 'stall', HTMLElement>;
  private objectiveTitle: HTMLElement;
  private objectiveText: HTMLElement;
  private objectiveMeta: HTMLElement;
  private minimap: HTMLCanvasElement;
  private mapPolylines: Array<Array<[number, number]>> = [];

  private lastMapDraw = 0;
  private toastEl: HTMLElement;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private telemetryRows: HTMLElement;

  constructor(private readonly profile: VehicleProfile, mission: MissionDef | null) {
    this.root = el('div', { class: 'hud' });

    this.objectiveTitle = el('div', { class: 'k', text: mission ? mission.titleFa : FA.freeDrive });
    this.objectiveText = el('div', { class: 'v', text: mission ? mission.objectiveFa : FA.freeDriveDesc });
    this.objectiveMeta = el('div', { class: 'mute num', style: 'font-size:0.7rem' });
    const objective = el('div', { class: 'hud-objective' }, this.objectiveTitle, this.objectiveText, this.objectiveMeta);

    this.minimap = el('canvas', { attrs: { width: 220, height: 220 } });
    const minimapWrap = el('div', { class: 'hud-minimap' }, this.minimap);

    const hudTop = el('div', { class: 'hud-top' }, objective, minimapWrap);

    this.speedEl = el('div', { class: 'value num', text: 'Û°' });
    const speed = el('div', { class: 'hud-speed' }, this.speedEl, el('div', { class: 'unit', text: 'km/h' }));

    this.gearEl = el('div', { class: 'g', text: 'N' });
    this.gearModeEl = el('div', { class: 'mode', text: profile.transmission.labelFa });
    const gear = el('div', { class: 'hud-gear' }, this.gearEl, this.gearModeEl);

    const tachSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tachSvg.setAttribute('viewBox', '0 0 120 68');
    tachSvg.innerHTML = `
      <path d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="7" stroke-linecap="round"/>
      <path d="M84 20 A48 48 0 0 1 108 62" fill="none" stroke="rgba(213,84,78,0.65)" stroke-width="7" stroke-linecap="round"/>
      <g id="needle" transform="rotate(-90 60 62)">
        <line x1="60" y1="62" x2="60" y2="22" stroke="#6fe0b6" stroke-width="2.6" stroke-linecap="round"/>
      </g>
      <circle cx="60" cy="62" r="4" fill="#0d1113" stroke="rgba(255,255,255,0.35)" stroke-width="1.2"/>
    `;
    this.tachNeedle = tachSvg.querySelector('#needle') as SVGGElement;
    const tachWrap = el('div', { class: 'hud-tach' }, tachSvg);
    this.tachValue = el('div', { class: 'mute num', style: 'font-size:0.6rem;text-align:center;margin-top:-0.3rem', text: 'Û°' });

    this.fuelBar = el('span');
    this.tempBar = el('span');
    this.fuelLabel = el('span', { class: 'num', text: 'â€”' });
    this.tempLabel = el('span', { class: 'num', text: 'â€”' });
    const gauges = el(
      'div',
      { class: 'hud-gauges' },
      el('div', { class: 'hud-gauge' }, el('span', { text: FA.hudFuel }), el('div', { class: 'bar' }, this.fuelBar), this.fuelLabel),
      el('div', { class: 'hud-gauge' }, el('span', { text: FA.hudTemp }), el('div', { class: 'bar' }, this.tempBar), this.tempLabel),
    );

    const cluster = el('div', { class: 'hud-cluster' }, speed, tachWrap, gear, gauges);
    tachWrap.appendChild(this.tachValue);

    const flag = (label: string): HTMLElement => el('span', { class: 'flag', text: label });
    this.flags = {
      abs: flag('ABS'),
      tcs: flag('TCS'),
      esc: flag('ESC'),
      limiter: flag('LIMIT'),
      stall: flag('STALL'),
    };
    const flagRow = el('div', { class: 'hud-flags' }, ...Object.values(this.flags));

    this.toastEl = el('div', { class: 'hud-toast' });

    this.telemetryRows = el('div', {
      class: 'hud-objective',
      style: 'position:absolute;bottom:7.5rem;left:1.1rem;font-size:0.66rem;opacity:0.85;display:none;line-height:1.8',
    });

    this.root.append(hudTop, cluster, flagRow, this.toastEl, this.telemetryRows);
  }

  setMap(polylines: Array<Array<[number, number]>>, _size: number): void {
    this.mapPolylines = polylines;
  }

  setObjective(title: string, text: string): void {
    this.objectiveTitle.textContent = title;
    this.objectiveText.textContent = text;
  }

  setObjectiveMeta(text: string): void {
    this.objectiveMeta.textContent = text;
  }

  setTelemetryVisible(visible: boolean): void {
    this.telemetryRows.style.display = visible ? 'block' : 'none';
  }

  toast(message: string): void {
    this.toastEl.textContent = message;
    this.toastEl.classList.add('is-visible');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('is-visible'), 1800);
  }

  update(t: VehicleTelemetry, nowMs: number): void {
    this.speedEl.textContent = formatNumber(Math.round(t.speedKph));
    const gearText = t.gearLabel;
    if (this.gearEl.textContent !== gearText) this.gearEl.textContent = gearText;
    this.gearModeEl.textContent = this.profile.transmission.labelFa;

    const redline = this.profile.engine.redlineRpm || 6500;
    const rpm = Number.isFinite(t.rpm) ? t.rpm : 0;
    const frac = Math.max(0, Math.min(1.05, rpm / (redline * 1.08)));
    this.tachNeedle.setAttribute('transform', `rotate(${-90 + 180 * frac} 60 62)`);
    this.tachValue.textContent = `${formatNumber(Math.round(rpm / 100) * 100)}`;

    const fuelPct = formatPercent(Math.max(0, t.fuelFraction));
    this.fuelBar.style.width = `${Math.max(0, Math.min(100, t.fuelFraction * 100))}%`;
    this.fuelBar.style.background = t.fuelFraction < 0.15 ? 'var(--danger)' : 'var(--accent)';
    this.fuelLabel.textContent = fuelPct;

    const tempRatio = Math.max(0, Math.min(1, (t.coolantC - 40) / 80));
    this.tempBar.style.width = `${tempRatio * 100}%`;
    this.tempBar.style.background = t.coolantC > 112 ? 'var(--danger)' : t.coolantC < 60 ? 'var(--warn)' : 'var(--accent)';
    this.tempLabel.textContent = `${formatNumber(Math.round(t.coolantC))}Â°`;

    this.flags.abs.classList.toggle('is-on', t.absActive);
    this.flags.tcs.classList.toggle('is-on', t.tcsActive);
    this.flags.esc.classList.toggle('is-warn', t.escActive);
    this.flags.limiter.classList.toggle('is-danger', t.limiter);
    this.flags.stall.classList.toggle('is-danger', t.stalled);

    if (t.fuelFraction < 0.12 && t.fuelFraction > 0) {
      this.objectiveMeta.textContent = FA.toasts.lowFuel;
    }

    if (nowMs - this.lastMapDraw > 120) {
      this.lastMapDraw = nowMs;
      this.drawMinimap(t);
    }

    if (this.telemetryRows.style.display !== 'none') {
      this.telemetryRows.innerHTML = [
        `RPM ${formatNumber(Math.round(t.rpm))} Â· ${formatNumber(Math.round(t.engineTorque))} NÂ·m`,
        `SLIP ${t.wheels.map((w) => formatNumber(w.slipRatio, 2)).join(' / ')}`,
        `FZ ${t.wheels.map((w) => formatNumber(Math.round(w.normalForce))).join(' / ')}`,
        `SUS ${t.wheels.map((w) => formatNumber(w.travelOffset * 100, 1)).join(' / ')}`,
        `SURF ${t.groundSurface}`,
      ]
        .map((line) => `<div class="ltr">${line}</div>`)
        .join('');
    }
  }

  private drawMinimap(t: VehicleTelemetry): void {
    const ctx = this.minimap.getContext('2d');
    if (!ctx) return;
    const w = this.minimap.width;
    const h = this.minimap.height;
    const scale = w / 420;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(10,14,15,0.85)';
    ctx.fillRect(0, 0, w, h);

    // The car is always at the centre; the map scrolls under it.
    const carX = 0;
    const carZ = 0;
    void carX;
    void carZ;
    const worldToMap = (x: number, z: number, cx: number, cz: number, yaw: number): [number, number] => {
      const dx = x - cx;
      const dz = z - cz;
      const cos = Math.cos(-yaw);
      const sin = Math.sin(-yaw);
      const rx = dx * cos - dz * sin;
      const rz = dx * sin + dz * cos;
      return [w / 2 + rx * scale, h / 2 + rz * scale];
    };
    // Note: the HUD does not know the absolute car position here; the map is drawn
    // relative to the last known position supplied by the app.
    const origin = this.mapOrigin;
    ctx.strokeStyle = 'rgba(180,196,200,0.55)';
    ctx.lineWidth = Math.max(1.4, 3.2 * scale);
    for (const line of this.mapPolylines) {
      ctx.beginPath();
      for (let i = 0; i < line.length; i++) {
        const [x, z] = line[i] as [number, number];
        const [mx, my] = worldToMap(x, z, origin.x, origin.z, origin.yaw);
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.stroke();
    }

    ctx.fillStyle = '#6fe0b6';
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2 - 7);
    ctx.lineTo(w / 2 - 5.5, h / 2 + 6);
    ctx.lineTo(w / 2 + 5.5, h / 2 + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    void t;
  }

  /** Called by the app each frame with the current world pose. */
  mapOrigin = { x: 0, z: 0, yaw: 0 };

  dispose(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.root.remove();
  }
}
