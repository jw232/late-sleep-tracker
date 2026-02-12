import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateStreak } from '@/lib/streak';

describe('calculateStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-09T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for empty array', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('returns 1 when only today has a record', () => {
    expect(calculateStreak(['2026-02-09'])).toBe(1);
  });

  it('returns 2 for today + yesterday', () => {
    expect(calculateStreak(['2026-02-09', '2026-02-08'])).toBe(2);
  });

  it('returns 7 for 7 consecutive days', () => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date('2026-02-09');
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
    expect(calculateStreak(dates)).toBe(7);
  });

  it('returns 0 when today has no record but yesterday does (current behavior)', () => {
    expect(calculateStreak(['2026-02-08'])).toBe(0);
  });

  it('returns 0 when neither today nor yesterday has a record', () => {
    expect(calculateStreak(['2026-02-05'])).toBe(0);
  });

  it('counts only after the gap', () => {
    // today + yesterday + gap + 3 days before
    expect(calculateStreak(['2026-02-09', '2026-02-08', '2026-02-05', '2026-02-04', '2026-02-03'])).toBe(2);
  });

  it('handles unordered input correctly', () => {
    expect(calculateStreak(['2026-02-07', '2026-02-09', '2026-02-08'])).toBe(3);
  });

  it('handles duplicate dates without issue', () => {
    expect(calculateStreak(['2026-02-09', '2026-02-09', '2026-02-08'])).toBe(2);
  });
});
