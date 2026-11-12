import { el } from '../dom';
import { FA } from '../i18n';
import { formatNumber, formatPercent } from '../format';
import type { App } from '../../app';
import type { MissionDef } from '../../missions/definitions';
import type { MissionResult } from '../../missions/manager';

export function pauseOverlay(app: App, mission: MissionDef | null): HTMLElement {
  const overlay = el('div', { class: 'overlay is-open' });
  const panel = el('div', { class: 'overlay-panel panel' });
  panel.append(
    el('div', { class: 'eyebrow', text: FA.paused }),
    el('h2', { class: 'h-l', text: FA.pause }),
    ...(mission ? [el('div', { class: 'muted', text: mission.titleFa })] : []),
    el('div', { class: 'divider' }),
    el('button', { class: 'btn btn--primary btn--block', text: FA.resume, on: { click: () => app.resume() } }),
    el('button', { class: 'btn btn--block', text: FA.restart, on: { click: () => app.restartMission() } }),
    el('button', { class: 'btn btn--ghost btn--block', text: FA.settings, on: { click: () => app.openSettingsOverlay() } }),
    el('button', { class: 'btn btn--danger btn--block', text: FA.exitToMenu, on: { click: () => app.exitDrive() } }),
  );
  overlay.appendChild(panel);
  return overlay;
}

export function resultsOverlay(app: App, result: MissionResult, mission: MissionDef | null): HTMLElement {
  const overlay = el('div', { class: 'overlay is-open' });
  const panel = el('div', { class: 'overlay-panel panel' });
  const success = result.success;
  panel.append(
    el('div', { class: 'eyebrow', text: mission?.titleFa ?? FA.freeDrive }),
    el('h2', { class: 'h-l', text: success ? FA.success : FA.failed, style: `color:${success ? 'var(--accent-soft)' : 'var(--danger)'}` }),
    el('div', { class: 'divider' }),
    el('div', { class: 'result-score num', text: formatNumber(result.score) }),
    el('div', { class: 'mute', style: 'font-size:0.72rem;margin-top:-0.3rem', text: FA.score }),
    el('div', { class: 'divider' }),
    statRow(FA.time, `${formatNumber(result.elapsedSec, 1)} s`),
    statRow(FA.distance, `${formatNumber(result.distanceKm, 2)} ${FA.km}`),
    statRow(FA.collisions, formatNumber(result.collisions)),
    statRow(FA.fuelUsed, `${formatNumber(result.fuelUsedL, 2)} ${FA.litre}`),
    ...(mission ? [statRow(FA.penalty, formatNumber(result.penalty))] : []),
    el('div', { class: 'divider' }),
    el(
      'div',
      { style: 'display:flex;gap:0.5rem' },
      el('button', { class: 'btn btn--primary', style: 'flex:1', text: mission ? FA.retry : FA.resume, on: { click: () => mission ? app.restartMission() : app.resume() } }),
      el('button', { class: 'btn btn--ghost', style: 'flex:1', text: FA.exitToMenu, on: { click: () => app.exitDrive() } }),
    ),
  );
  if (result.reward > 0) {
    panel.insertBefore(
      el('div', { class: 'pill', style: 'align-self:flex-start;margin-top:0.4rem', text: `${FA.reward}: ${formatNumber(result.reward / 1_000_000)} م` }),
      panel.lastElementChild,
    );
  }
  overlay.appendChild(panel);
  return overlay;
}

function statRow(label: string, value: string): HTMLElement {
  return el('div', { class: 'result-row' }, el('span', { class: 'muted', text: label }), el('span', { class: 'num', text: value }));
}

export function tutorialOverlay(app: App, mode: 'manual' | 'automatic', onClose: () => void): HTMLElement {
  const overlay = el('div', { class: 'overlay is-open' });
  const panel = el('div', { class: 'overlay-panel panel' });
  const lines =
    mode === 'manual'
      ? [FA.tutorialManual1, FA.tutorialManual2, FA.tutorialManual3, FA.tutorialManual4]
      : [FA.tutorialAuto1, FA.tutorialAuto2, FA.tutorialAuto3];
  panel.append(
    el('div', { class: 'eyebrow', text: FA.tutorial }),
    el('h2', { class: 'h-l', text: mode === 'manual' ? FA.tutorialManualTitle : FA.tutorialAutoTitle }),
    el(
      'ol',
      { class: 'muted', style: 'margin:0.4rem 0 0.8rem;padding-inline-start:1.2rem;font-size:0.86rem;line-height:1.9' },
      ...lines.map((line) => el('li', { text: line })),
    ),
    el('button', {
      class: 'btn btn--primary btn--block',
      text: FA.gotIt,
      on: {
        click: () => {
          app.markTutorialSeen(mode);
          overlay.classList.remove('is-open');
          onClose();
        },
      },
    }),
  );
  overlay.appendChild(panel);
  return overlay;
}

export function confirmOverlay(title: string, desc: string, confirmText: string, onConfirm: () => void, onCancel: () => void): HTMLElement {
  const overlay = el('div', { class: 'overlay is-open' });
  const panel = el('div', { class: 'overlay-panel panel' });
  panel.append(
    el('h2', { class: 'h-l', text: title }),
    el('div', { class: 'muted', text: desc }),
    el('div', { class: 'divider' }),
    el('button', { class: 'btn btn--danger btn--block', text: confirmText, on: { click: onConfirm } }),
    el('button', { class: 'btn btn--ghost btn--block', text: FA.cancel, on: { click: onCancel } }),
  );
  overlay.appendChild(panel);
  return overlay;
}

export function helpScreen(app: App): HTMLElement {
  const root = el('div', { class: 'screen' });
  root.appendChild(el('div', { class: 'scrim' }));
  const topbar = el('div', { class: 'topbar' });
  const title = el('div', { class: 'topbar-title' }, el('div', { class: 'eyebrow', text: 'FARMAN' }), el('h1', { class: 'h-l', text: FA.helpTitle }));
  const actions = el('div', { class: 'topbar-actions' });
  const back = el('button', { class: 'btn btn--ghost btn--icon', title: FA.back });
  back.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>';
  back.addEventListener('click', () => app.goMenu());
  actions.appendChild(back);
  topbar.append(actions, title);

  const body = el(
    'div',
    { class: 'screen-body' },
    el(
      'div',
      { class: 'panel', style: 'padding:1.2rem;display:grid;gap:0.7rem;max-width:46rem' },
      helpRow(FA.helpControls),
      helpRow(FA.helpGoal),
      helpRow(FA.helpManual),
      helpRow(FA.helpKeys),
      helpRow(FA.helpSave),
    ),
  );
  root.append(topbar, body);
  return root;
}

function helpRow(text: string): HTMLElement {
  return el('div', { class: 'muted', style: 'font-size:0.88rem;line-height:1.9', text });
}

export function missionHud(mission: MissionDef): HTMLElement {
  return el(
    'div',
    { class: 'hud-objective' },
    el('div', { class: 'k', text: mission.titleFa }),
    el('div', { class: 'v', text: mission.objectiveFa }),
    el('div', { class: 'mute num', style: 'font-size:0.7rem', attrs: { id: 'mission-timer' }, text: '۰٫۰' }),
  );
}

export const __overlays = { formatPercent };
