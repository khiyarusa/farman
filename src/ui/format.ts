/** Persian-first number and unit formatting. A single digit system is used everywhere. */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

export function toFaDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    out += code >= 48 && code <= 57 ? (FA_DIGITS[code - 48] as string) : ch;
  }
  return out;
}

export function toLatinDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const idx = FA_DIGITS.indexOf(ch as (typeof FA_DIGITS)[number]);
    out += idx >= 0 ? String(idx) : ch;
  }
  return out;
}

let digitMode: 'fa' | 'latin' = 'fa';

export function setDigitMode(mode: 'fa' | 'latin'): void {
  digitMode = mode;
}

function digits(s: string): string {
  return digitMode === 'fa' ? toFaDigits(s) : s;
}

export function formatNumber(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return digits('—');
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [intPart = '0', fracPart] = fixed.split('.');
  const sep = digitMode === 'fa' ? '٬' : ',';
  const decimal = digitMode === 'fa' ? '٫' : '.';
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  const sign = value < 0 ? '−' : '';
  return digits(fracPart ? `${sign}${grouped}${decimal}${fracPart}` : `${sign}${grouped}`);
}

export function formatSpeed(kmh: number): string {
  return formatNumber(Math.round(Math.abs(kmh)));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${formatNumber(Math.round(km * 1000))} م`;
  return `${formatNumber(km, km < 10 ? 1 : 0)} کیلومتر`;
}

export function formatMoney(toman: number): string {
  return `${formatNumber(Math.round(toman))} تومان`;
}

/** Compact money for chips: ۴۲٬۰۰۰٬۰۰۰ → ۴۲ میلیون */
export function formatMoneyShort(toman: number): string {
  if (toman >= 1_000_000_000) return `${formatNumber(toman / 1_000_000_000, 1)} میلیارد`;
  if (toman >= 1_000_000) return `${formatNumber(toman / 1_000_000, 0)} میلیون`;
  if (toman >= 1000) return `${formatNumber(toman / 1000, 0)} هزار`;
  return formatNumber(toman);
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return digits('۰٫۰');
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const tenth = Math.floor((seconds * 10) % 10);
  if (m > 0) return digits(`${m}:${String(s).padStart(2, '0')}`);
  return digits(`${s}.${tenth}`);
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return digits(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
}

export function formatPercent(ratio: number): string {
  return `${formatNumber(Math.round(ratio * 100))}٪`;
}

export function formatLitres(l: number): string {
  return digits(`${l.toFixed(1)}`);
}

export function formatTemp(c: number): string {
  return `${formatNumber(Math.round(c))}°`;
}
