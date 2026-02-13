import { describe, it, expect } from 'vitest';

// Extracted from app/api/insights/route.ts
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h < 12 ? h * 60 + m + 24 * 60 : h * 60 + m;
}

function formatMin(m: number): string {
  const normalized = m >= 24 * 60 ? m - 24 * 60 : m;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

describe('timeToMinutes', () => {
  it('23:00 → 1380 minutes', () => {
    expect(timeToMinutes('23:00')).toBe(1380);
  });

  it('01:00 → 1500 minutes (added 24h because < 12:00)', () => {
    expect(timeToMinutes('01:00')).toBe(1500);
  });

  it('00:00 → 1440 minutes', () => {
    expect(timeToMinutes('00:00')).toBe(1440);
  });

  it('11:59 → 2159 minutes', () => {
    expect(timeToMinutes('11:59')).toBe(2159);
  });

  it('12:00 → 720 minutes (no add)', () => {
    expect(timeToMinutes('12:00')).toBe(720);
  });
});

describe('formatMin', () => {
  it('formatMin(1500) → "01:00"', () => {
    expect(formatMin(1500)).toBe('01:00');
  });

  it('formatMin(0) → "00:00"', () => {
    expect(formatMin(0)).toBe('00:00');
  });
});

describe('average/earliest/latest calculation', () => {
  it('[23:00, 01:00] average → "00:00"', () => {
    const times = ['23:00', '01:00'].map(timeToMinutes);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    expect(formatMin(avg)).toBe('00:00');
  });

  it('empty times array → empty string (no crash)', () => {
    const times: number[] = [];
    let avgTime = '';
    if (times.length > 0) {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      avgTime = formatMin(avg);
    }
    expect(avgTime).toBe('');
  });

  it('single record → avg=earliest=latest=that time', () => {
    const times = [timeToMinutes('02:30')];
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const earliest = Math.min(...times);
    const latest = Math.max(...times);

    const avgStr = formatMin(avg);
    const earliestStr = formatMin(earliest);
    const latestStr = formatMin(latest);

    expect(avgStr).toBe('02:30');
    expect(earliestStr).toBe('02:30');
    expect(latestStr).toBe('02:30');
  });
});
