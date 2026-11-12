import { el } from '../dom';
import { FA } from '../i18n';
import { formatNumber } from '../format';
import type { App } from '../../app';
import { MISSIONS } from '../../missions/definitions';

export function missionsScreen(app: App): HTMLElement {
  const root = el('div', { class: 'screen' });
  root.appendChild(el('div', { class: 'scrim' }));

  const topbar = el('div', { class: 'topbar' });
  const title = el(
    'div',
    { class: 'topbar-title' },
    el('div', { class: 'eyebrow', text: 'FARMAN' }),
    el('h1', { class: 'h-l', text: FA.missions }),
  );
  const actions = el('div', { class: 'topbar-actions' });
  const back = el('button', { class: 'btn btn--ghost btn--icon', title: FA.back });
  back.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>';
  back.addEventListener('click', () => app.goMenu());
  actions.appendChild(back);
  topbar.append(actions, title);

  const grid = el('div', { class: 'mission-grid' });

  const free = el('button', { class: 'mission-card', on: { click: () => app.startDrive(null) } });
  free.append(
    el('div', { class: 'title', text: FA.freeDrive }),
    el('div', { class: 'desc', text: FA.freeDriveDesc }),
    el(
      'div',
      { class: 'foot' },
      el('span', { text: FA.start }),
      el('span', { class: 'badge', text: '∞' }),
    ),
  );
  grid.appendChild(free);

  for (const mission of MISSIONS) {
    const record = app.save.missions[mission.id];
    const card = el('button', {
      class: `mission-card${record?.completed ? ' is-done' : ''}`,
      on: { click: () => app.startDrive(mission.id) },
    });
    card.append(
      el(
        'div',
        { class: 'foot', style: 'justify-content:flex-start;gap:0.4rem' },
        el('span', { class: 'badge', text: record?.completed ? '✓' : '○' }),
        el('span', { class: 'mute', text: mission.weather === 'rain' ? FA.weatherRain : FA.weatherDry }),
      ),
      el('div', { class: 'title', text: mission.titleFa }),
      el('div', { class: 'desc', text: mission.descFa }),
      el(
        'div',
        { class: 'foot' },
        el('span', { text: record ? `${FA.bestScore} ${formatNumber(record.bestScore)}` : FA.locked.replace('قفل', '—') }),
        el('span', { class: 'badge', text: `${FA.reward} ${formatNumber(mission.reward / 1_000_000)} م` }),
      ),
    );
    grid.appendChild(card);
  }

  const body = el(
    'div',
    { class: 'screen-body' },
    el('div', { class: 'muted', style: 'font-size:0.82rem', text: FA.missionSelect }),
    grid,
  );
  root.append(topbar, body);
  return root;
}
