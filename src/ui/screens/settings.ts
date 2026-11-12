import { el } from '../dom';
import { FA } from '../i18n';
import { formatNumber } from '../format';
import type { App } from '../../app';
import type { Settings } from '../../save/schema';

type Category = 'graphics' | 'audio' | 'controls' | 'assists' | 'interface';

export function settingsScreen(app: App): HTMLElement {
  const root = el('div', { class: 'screen' });
  root.appendChild(el('div', { class: 'scrim' }));

  const topbar = el('div', { class: 'topbar' });
  const title = el(
    'div',
    { class: 'topbar-title' },
    el('div', { class: 'eyebrow', text: 'FARMAN' }),
    el('h1', { class: 'h-l', text: FA.settings }),
  );
  const actions = el('div', { class: 'topbar-actions' });
  const back = el('button', { class: 'btn btn--ghost btn--icon', title: FA.back });
  back.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>';
  back.addEventListener('click', () => app.goMenu());
  actions.appendChild(back);
  topbar.append(actions, title);

  const nav = el('div', { class: 'settings-nav panel panel--flat' });
  const panel = el('div', { class: 'settings-panel panel' });
  const layout = el('div', { class: 'settings-layout' }, nav, panel);
  const body = el('div', { class: 'screen-body' }, layout);
  root.append(topbar, body);

  const categories: Array<[Category, string]> = [
    ['graphics', FA.graphics],
    ['audio', FA.audio],
    ['controls', FA.controls],
    ['assists', FA.assists],
    ['interface', FA.settings],
  ];

  let active: Category = 'graphics';
  const render = (): void => {
    nav.replaceChildren(
      ...categories.map(([id, label]) => {
        const btn = el('button', { text: label, class: id === active ? 'is-active' : '' });
        btn.addEventListener('click', () => {
          active = id;
          render();
        });
        return btn;
      }),
    );
    panel.replaceChildren(...buildPanel(app, active));
  };
  render();
  return root;
}

function buildPanel(app: App, category: Category): HTMLElement[] {
  const s = app.save.settings;
  switch (category) {
    case 'graphics':
      return [
        row(
          FA.quality,
          'کیفیت سایه‌ها، رزولوشن و جزئیات محیط',
          segmented(
            [
              ['low', FA.qualityLow],
              ['balanced', FA.qualityBalanced],
              ['high', FA.qualityHigh],
            ],
            s.graphics,
            (v) => app.applySetting('graphics', v as Settings['graphics']),
          ),
        ),
        row(
          FA.renderScale,
          'کاهش مقیاس رندر، عملکرد را روی دستگاه‌های ضعیف بهتر می‌کند',
          slider(s.renderScale, 0.6, 1.4, 0.05, (v) => app.applySetting('renderScale', v), (v) => `${formatNumber(v * 100)}٪`),
        ),
      ];
    case 'audio':
      return [
        row(FA.masterVolume, '', volumeSlider(app, 'masterVolume', s.masterVolume)),
        row(FA.engineVolume, '', volumeSlider(app, 'engineVolume', s.engineVolume)),
        row(FA.ambienceVolume, '', volumeSlider(app, 'ambienceVolume', s.ambienceVolume)),
        row(FA.uiVolume, '', volumeSlider(app, 'uiVolume', s.uiVolume)),
      ];
    case 'controls':
      return [
        row(
          FA.steeringMode,
          'روش اصلی فرمان‌دهی',
          segmented(
            [
              ['wheel', FA.steeringWheel],
              ['buttons', FA.steeringButtons],
              ['gyro', FA.steeringGyro],
            ],
            s.steeringMode,
            (v) => app.applySetting('steeringMode', v as Settings['steeringMode']),
          ),
        ),
        row(
          FA.sensitivity,
          '',
          slider(s.steeringSensitivity, 0.4, 1.8, 0.05, (v) => app.applySetting('steeringSensitivity', v), (v) =>
            formatNumber(v, 2),
          ),
        ),
        row(
          FA.controlSize,
          '',
          slider(s.controlSize, 0.8, 1.3, 0.05, (v) => app.applySetting('controlSize', v), (v) => `${formatNumber(v * 100)}٪`),
        ),
        row(
          FA.controlOpacity,
          '',
          slider(s.controlOpacity, 0.35, 1, 0.05, (v) => app.applySetting('controlOpacity', v), (v) =>
            `${formatNumber(v * 100)}٪`,
          ),
        ),
        row(FA.layout, '', toggle(s.leftHanded, (v) => app.applySetting('leftHanded', v), FA.leftHanded, FA.rightHanded)),
      ];
    case 'assists':
      return [
        row(FA.assistAbs, 'فقط روی خودروهایی که ABS دارند', toggle(s.assists.abs, (v) => app.applySetting('assists', { ...s.assists, abs: v }))),
        row(FA.assistTcs, 'کاهش گشتاور هنگام لغزش چرخ محرک', toggle(s.assists.tcs, (v) => app.applySetting('assists', { ...s.assists, tcs: v }))),
        row(FA.assistEsc, 'کمک به کنترل چرخش خودرو', toggle(s.assists.esc, (v) => app.applySetting('assists', { ...s.assists, esc: v }))),
        row(FA.assistAutoClutch, 'برای بازیکنان تازه‌کار در خودروی دستی', toggle(s.assists.autoClutch, (v) => app.applySetting('assists', { ...s.assists, autoClutch: v }))),
        row(
          FA.assistStability,
          '',
          slider(s.assists.stability, 0, 1, 0.05, (v) => app.applySetting('assists', { ...s.assists, stability: v }), (v) =>
            `${formatNumber(v * 100)}٪`,
          ),
        ),
      ];
    case 'interface':
    default:
      return [
        row(
          FA.uiScale,
          'اندازه متن و اجزای رابط کاربری',
          slider(s.uiScale, 0.85, 1.35, 0.05, (v) => app.applySetting('uiScale', v), (v) => `${formatNumber(v * 100)}٪`),
        ),
        row(
          FA.digits,
          '',
          segmented(
            [
              ['fa', FA.digitsFa],
              ['latin', FA.digitsLatin],
            ],
            s.digits,
            (v) => app.applySetting('digits', v as Settings['digits']),
          ),
        ),
        row(FA.telemetry, 'نمایش داده‌های موتور و لغزش چرخ‌ها', toggle(s.showTelemetry, (v) => app.applySetting('showTelemetry', v))),
        row(FA.tutorialHints, '', toggle(s.tutorialHints, (v) => app.applySetting('tutorialHints', v))),
        el(
          'div',
          { style: 'margin-top:1rem' },
          el('button', {
            class: 'btn btn--ghost',
            text: FA.resetSettings,
            on: { click: () => app.resetSettings() },
          }),
        ),
      ];
  }
}

function row(label: string, hint: string, control: HTMLElement): HTMLElement {
  return el(
    'div',
    { class: 'setting' },
    el('div', {}, el('div', { class: 'label', text: label }), hint ? el('div', { class: 'hint', text: hint }) : null),
    control,
  );
}

function segmented(
  options: Array<[string, string]>,
  value: string,
  onChange: (v: string) => void,
): HTMLElement {
  const wrap = el('div', { class: 'segmented' });
  for (const [id, label] of options) {
    const btn = el('button', { text: label, class: id === value ? 'is-active' : '' });
    btn.addEventListener('click', () => {
      for (const child of Array.from(wrap.children)) child.classList.remove('is-active');
      btn.classList.add('is-active');
      onChange(id);
    });
    wrap.appendChild(btn);
  }
  return wrap;
}

function slider(
  value: number,
  min: number,
  max: number,
  step: number,
  onChange: (v: number) => void,
  format: (v: number) => string,
): HTMLElement {
  const wrap = el('div', { style: 'display:flex;align-items:center;gap:0.6rem' });
  const input = el('input', { attrs: { type: 'range', min, max, step, value } });
  const label = el('div', { class: 'num', style: 'min-width:3rem;text-align:left;font-size:0.8rem', text: format(value) });
  input.addEventListener('input', () => {
    const v = Number(input.value);
    label.textContent = format(v);
    onChange(v);
  });
  wrap.append(input, label);
  return wrap;
}

function toggle(value: boolean, onChange: (v: boolean) => void, onLabel?: string, offLabel?: string): HTMLElement {
  const btn = el('button', { class: `switch${value ? ' is-on' : ''}`, attrs: { 'aria-pressed': value } });
  const wrap = el('div', { style: 'display:flex;align-items:center;gap:0.6rem;justify-content:flex-end' });
  if (onLabel && offLabel) {
    const text = el('span', { class: 'mute', style: 'font-size:0.75rem', text: value ? onLabel : offLabel });
    btn.addEventListener('click', () => {
      const next = !btn.classList.contains('is-on');
      btn.classList.toggle('is-on', next);
      btn.setAttribute('aria-pressed', String(next));
      text.textContent = next ? onLabel : offLabel;
      onChange(next);
    });
    wrap.append(text, btn);
    return wrap;
  }
  btn.addEventListener('click', () => {
    const next = !btn.classList.contains('is-on');
    btn.classList.toggle('is-on', next);
    btn.setAttribute('aria-pressed', String(next));
    onChange(next);
  });
  wrap.appendChild(btn);
  return wrap;
}

function volumeSlider(app: App, key: 'masterVolume' | 'engineVolume' | 'ambienceVolume' | 'uiVolume', value: number): HTMLElement {
  return slider(value, 0, 1, 0.05, (v) => app.applySetting(key, v), (v) => `${formatNumber(v * 100)}٪`);
}
