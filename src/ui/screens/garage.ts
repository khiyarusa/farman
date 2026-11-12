import { el, clear } from '../dom';
import { FA } from '../i18n';
import { formatLitres, formatMoney, formatMoneyShort, formatNumber, formatPercent } from '../format';
import type { App } from '../../app';
import type { VehicleProfile } from '../../vehicles/profile';
import type { VehicleState } from '../../save/schema';
import { GAME } from '../../core/config';

export function garageScreen(app: App): HTMLElement {
  const root = el('div', { class: 'screen' });
  root.appendChild(el('div', { class: 'scrim' }));

  const credits = el('div', { class: 'pill num', text: formatMoneyShort(app.save.player.credits) });
  const back = el('button', { class: 'btn btn--ghost', text: FA.menuGarage });
  back.style.display = 'none';

  const topbar = el('div', { class: 'topbar' });
  const title = el(
    'div',
    { class: 'topbar-title' },
    el('div', { class: 'eyebrow', text: 'FARMAN' }),
    el('h1', { class: 'h-l', text: FA.garage }),
  );
  const actions = el('div', { class: 'topbar-actions' });
  const backBtn = el('button', { class: 'btn btn--ghost btn--icon', title: FA.back });
  backBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>';
  backBtn.addEventListener('click', () => app.goMenu());
  actions.append(credits, backBtn);
  topbar.append(actions, title);

  const specs = el('div', { class: 'garage-specs panel' });
  const stage = el('div', { class: 'garage-stage' });
  const layout = el('div', { class: 'garage-layout' }, specs, stage);
  const body = el('div', { class: 'screen-body' }, layout);
  root.append(topbar, body);

  const render = (): void => {
    const profile = app.selectedProfile;
    const state = app.vehicleState(profile.id);
    clear(specs);
    specs.append(...specsContent(app, profile, state));
    clear(stage);
    stage.append(...stageContent(app, profile, state));
    credits.textContent = formatMoneyShort(app.save.player.credits);
  };

  render();
  // Re-render whenever the app notifies a state change while this screen is open.
  app.onScreenRefresh = render;
  return root;
}

function specsContent(app: App, profile: VehicleProfile, state: VehicleState): HTMLElement[] {
  const powerHp = peakPowerHp(profile);
  const torque = peakTorque(profile);

  const header = el(
    'div',
    {},
    el('div', { class: 'eyebrow', text: profile.bodyStyleFa }),
    el('h2', { class: 'h-l', text: profile.nameFa }),
    el(
      'div',
      { class: 'muted', style: 'font-size:0.8rem;margin-top:0.2rem' },
      `${profile.year} · ${profile.transmission.labelFa} · ${drivetrainFa(profile)}`,
    ),
  );

  const grid = el('div', { class: 'spec-grid' });
  const rows: Array<[string, string, string]> = [
    [FA.horsepower, formatNumber(powerHp), 'hp'],
    [FA.torque, formatNumber(torque), 'N·m'],
    [FA.weight, formatNumber(profile.massKg), 'kg'],
    [FA.acceleration, profile.performance.zeroTo100Sec ? formatNumber(profile.performance.zeroTo100Sec, 1) : '—', 's'],
    [FA.topSpeed, profile.performance.topSpeedKph ? formatNumber(profile.performance.topSpeedKph) : '—', 'km/h'],
    [FA.tank, formatNumber(profile.fuel.tankLitres), 'L'],
  ];
  for (const [k, v, unit] of rows) {
    grid.appendChild(
      el(
        'div',
        { class: 'spec' },
        el('div', { class: 'k', text: k }),
        el('div', { class: 'v num' }, v, el('small', { text: unit })),
      ),
    );
  }

  const condition = el('div', { class: 'condition-row' });
  const meters: Array<[string, number, string]> = [
    [FA.fuel, state.fuel / profile.fuel.tankLitres, `${formatLitres(state.fuel)} ${FA.litre}`],
    [FA.tires, 1 - avg(state.tireWear), formatPercent(1 - avg(state.tireWear))],
    [FA.engineWear, 1 - state.engineWear, formatPercent(1 - state.engineWear)],
    [FA.bodyDamage, 1 - state.bodyDamage, formatPercent(1 - state.bodyDamage)],
  ];
  for (const [label, ratio, value] of meters) {
    const meter = el('div', { class: 'meter' });
    const bar = el('span');
    bar.style.width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%`;
    if (ratio < 0.5) meter.classList.add('is-warn');
    if (ratio < 0.25) meter.classList.add('is-bad');
    meter.appendChild(bar);
    condition.appendChild(
      el(
        'div',
        {},
        el('div', { class: 'k', style: 'font-size:0.68rem;color:var(--text-mute)', text: label }),
        el('div', { style: 'font-size:0.8rem;font-weight:600', class: 'num', text: value }),
        meter,
      ),
    );
  }

  const refuelCost = Math.max(0, Math.round((profile.fuel.tankLitres - state.fuel) * GAME.fuelPricePerLitre));
  const repairCost = Math.round(state.bodyDamage * 100 * GAME.repairCostPerPercent);
  const serviceCost = GAME.serviceCost;

  const serviceRow = el(
    'div',
    { style: 'display:flex;gap:0.4rem;flex-wrap:wrap' },
    actionButton(`${FA.refuel} · ${formatMoneyShort(refuelCost)}`, refuelCost <= app.save.player.credits, () =>
      app.serviceVehicle('refuel'),
    ),
    actionButton(`${FA.repair} · ${formatMoneyShort(repairCost)}`, repairCost <= app.save.player.credits, () =>
      app.serviceVehicle('repair'),
    ),
    actionButton(`${FA.service} · ${formatMoneyShort(serviceCost)}`, serviceCost <= app.save.player.credits, () =>
      app.serviceVehicle('full'),
    ),
  );

  const paints = el('div', { class: 'paint-row' });
  for (const paint of profile.visual.paints) {
    const swatch = el('button', {
      class: `swatch${state.paintId === paint.id ? ' is-active' : ''}`,
      title: paint.nameFa,
      on: { click: () => app.setPaint(paint.id) },
    });
    swatch.style.background = paint.hex;
    paints.appendChild(swatch);
  }

  const rims = el('div', { class: 'paint-row' });
  for (const rim of profile.visual.rims) {
    const swatch = el('button', {
      class: `swatch${state.rimId === rim.id ? ' is-active' : ''}`,
      title: rim.nameFa,
      on: { click: () => app.setRim(rim.id) },
    });
    swatch.style.background = rim.hex;
    rims.appendChild(swatch);
  }

  return [
    header,
    el('div', { class: 'divider' }),
    grid,
    el('div', { class: 'divider' }),
    el('div', { class: 'eyebrow', text: 'وضعیت خودرو' }),
    condition,
    serviceRow,
    el('div', { class: 'divider' }),
    el('div', { class: 'eyebrow', text: FA.paint }),
    paints,
    el('div', { class: 'eyebrow', text: FA.rims, style: 'margin-top:0.6rem' }),
    rims,
    el(
      'div',
      { style: 'margin-top:auto;display:flex;flex-direction:column;gap:0.45rem' },
      el(
        'button',
        { class: 'btn btn--primary btn--block', on: { click: () => app.startDrive(null) } },
        FA.drive,
      ),
      el(
        'button',
        { class: 'btn btn--ghost btn--block', on: { click: () => app.goMissions() } },
        FA.menuMissions,
      ),
      el(
        'div',
        { class: 'mute num', style: 'font-size:0.7rem;text-align:center' },
        `${FA.odometer}: ${formatNumber(state.odometerKm, 1)} ${FA.km}`,
      ),
    ),
  ];
}

function stageContent(app: App, profile: VehicleProfile, _state: VehicleState): HTMLElement[] {
  const chips = el('div', { class: 'car-selector' });
  for (const p of app.profiles) {
    const unlocked = app.save.player.unlockedVehicleIds.includes(p.id);
    const chip = el('button', {
      class: `car-chip${p.id === profile.id ? ' is-active' : ''}`,
      on: {
        click: () => {
          if (!unlocked) {
            app.toast(FA.locked);
            return;
          }
          app.selectVehicle(p.id);
        },
      },
    });
    chip.append(
      el('div', { class: 'name', text: p.nameFa }),
      el('div', { class: 'meta', text: unlocked ? `${p.year} · ${p.transmission.labelFa}` : FA.locked }),
    );
    chips.appendChild(chip);
  }

  const hints = el(
    'div',
    { class: 'hint-bar' },
    el('span', { text: 'برای چرخش خودرو، صحنه را بکشید' }),
  );

  return [hints, chips];
}

function actionButton(label: string, enabled: boolean, onClick: () => void): HTMLElement {
  const btn = el('button', { class: 'btn btn--sm', text: label, on: { click: onClick } });
  btn.disabled = !enabled;
  return btn;
}

export function peakPowerHp(profile: VehicleProfile): number {
  let best = 0;
  for (const point of profile.engine.torqueCurve) {
    const kw = (point.nm * point.rpm) / 9549;
    best = Math.max(best, kw);
  }
  return Math.round(best * 1.341);
}

export function peakTorque(profile: VehicleProfile): number {
  let best = 0;
  for (const point of profile.engine.torqueCurve) best = Math.max(best, point.nm);
  return Math.round(best);
}

export function drivetrainFa(profile: VehicleProfile): string {
  if (profile.drivetrain.layout === 'FWD') return 'دیفرانسیل جلو';
  if (profile.drivetrain.layout === 'RWD') return 'دیفرانسیل عقب';
  return 'چهار چرخ محرک';
}

function avg(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
}

export const __garageTest = { peakPowerHp, peakTorque, drivetrainFa, formatMoney };
