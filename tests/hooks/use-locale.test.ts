import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocale } from '@/hooks/use-locale';

describe('useLocale', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to zh', () => {
    const { result } = renderHook(() => useLocale());
    expect(result.current.locale).toBe('zh');
  });

  it('switches to en', () => {
    const { result } = renderHook(() => useLocale());
    act(() => {
      result.current.setLocale('en');
    });
    expect(result.current.locale).toBe('en');
  });

  it('returns English content after switching to en', () => {
    const { result } = renderHook(() => useLocale());
    act(() => {
      result.current.setLocale('en');
    });
    expect(result.current.t.nav.record).toBe('Record');
  });

  it('has complete t object structure', () => {
    const { result } = renderHook(() => useLocale());
    const t = result.current.t;
    expect(t).toHaveProperty('nav');
    expect(t).toHaveProperty('record');
    expect(t).toHaveProperty('analysis');
    expect(t).toHaveProperty('history');
    expect(t).toHaveProperty('insights');
    expect(t).toHaveProperty('settings');
  });

  it('persists language preference to localStorage', () => {
    const { result } = renderHook(() => useLocale());
    act(() => {
      result.current.setLocale('en');
    });
    expect(localStorage.getItem('locale')).toBe('en');
  });
});
