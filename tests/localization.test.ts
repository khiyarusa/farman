import { describe, expect, it } from 'vitest';
import { formatDistance, formatMoney, formatNumber, formatTime, setDigitMode, toFaDigits, toLatinDigits } from '../src/ui/format';
import { FA } from '../src/ui/i18n';

describe('Persian formatting', () => {
  it('converts digits both ways', () => {
    expect(toFaDigits('0123456789')).toBe('۰۱۲۳۴۵۶۷۸۹');
    expect(toLatinDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  });

  it('groups thousands with the Persian separator', () => {
    setDigitMode('fa');
    expect(formatNumber(42000000)).toBe('۴۲٬۰۰۰٬۰۰۰');
    expect(formatNumber(1234.56, 1)).toBe('۱٬۲۳۴٫۶');
  });

  it('renders money and distance in Persian', () => {
    setDigitMode('fa');
    expect(formatMoney(2500000)).toContain('تومان');
    expect(formatMoney(2500000)).not.toMatch(/[0-9]/);
    expect(formatDistance(1.4)).toContain('کیلومتر');
    expect(formatDistance(0.35)).toContain('م');
  });

  it('formats times without latin digits', () => {
    setDigitMode('fa');
    expect(formatTime(75.4)).toMatch(/^[۰-۹]+:[۰-۹]{2}$/);
  });

  it('honours the latin digit setting', () => {
    setDigitMode('latin');
    expect(formatNumber(1234)).toBe('1,234');
    setDigitMode('fa');
  });
});

describe('Persian strings', () => {
  it('uses Persian letters, not transliteration', () => {
    expect(FA.menuFreeDrive).toMatch(/[\u0600-\u06FF]/);
    expect(FA.tagline).toContain('هر خودرو');
    expect(FA.gearN).toBe('خلاص');
    expect(FA.handbrake).toBe('ترمز دستی');
  });

  it('has no empty user-facing strings', () => {
    const values = Object.values(FA).filter((v) => typeof v === 'string') as string[];
    expect(values.every((v) => v.trim().length > 0)).toBe(true);
  });
});
