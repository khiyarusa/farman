import { el } from '../dom';
import { FA } from '../i18n';
import { formatMoneyShort, formatNumber } from '../format';
import type { App } from '../../app';

/** Main menu. The studio scene is already rendering behind this overlay. */
export function menuScreen(app: App): HTMLElement {
  const save = app.save;
  const root = el('div', { class: 'screen menu-screen' });

  root.appendChild(el('div', { class: 'scrim' }));

  const brand = el(
    'div',
    { class: 'brand' },
    el('div', { class: 'brand-mark' }),
    el(
      'div',
      {},
      el('div', { class: 'brand-name', text: FA.appName }),
      el('div', { class: 'brand-sub', text: 'FARMAN • DRIVING SIMULATION' }),
    ),
  );

  const meta = el(
    'div',
    { class: 'menu-meta' },
    el('div', { class: 'credits num', text: formatMoneyShort(save.player.credits) }),
    el('div', { text: `${FA.menuLevel} ${formatNumber(save.player.level)}` }),
    el('div', { class: 'pill', text: app.selectedProfile.nameFa }),
  );

  const top = el('div', { class: 'menu-top' }, brand, meta);

  const primary = menuItem(FA.menuFreeDrive, '۰۱', true, () => app.startDrive(null));
  const nav = el(
    'div',
    { class: 'menu-nav' },
    primary,
    menuItem(FA.menuGarage, '۰۲', false, () => app.goGarage()),
    menuItem(FA.menuMissions, '۰۳', false, () => app.goMissions()),
    menuItem(FA.menuSettings, '۰۴', false, () => app.goSettings()),
    menuItem(FA.menuHelp, '۰۵', false, () => app.goHelp()),
    menuItem(app.isNative ? FA.menuExit : FA.menuExit, '۰۶', false, () => app.requestExit()),
  );

  const main = el('div', { class: 'menu-main' }, nav, el('div', {}));

  const foot = el(
    'div',
    { class: 'menu-foot' },
    el('div', { class: 'tagline', text: FA.tagline }),
    el(
      'div',
      { class: 'pill' },
      el('span', { class: 'dot' }),
      el('span', { text: app.save.settings.graphics === 'high' ? 'کیفیت بالا' : app.save.settings.graphics === 'low' ? 'کیفیت سبک' : 'کیفیت متعادل' }),
    ),
    el('div', { class: 'ltr', text: `v${app.version}` }),
  );

  root.append(top, main, foot);
  return root;
}

function menuItem(label: string, index: string, primaryItem: boolean, onClick: () => void): HTMLElement {
  const button = el(
    'button',
    {
      class: `menu-item${primaryItem ? ' is-primary' : ''}`,
      on: { click: onClick },
    },
    el('span', { text: label }),
    el('span', { class: 'idx', text: index }),
  );
  return button;
}
