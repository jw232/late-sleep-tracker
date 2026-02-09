'use client';

import { useState, useEffect, useCallback } from 'react';
import zh from '@/locales/zh.json';
import en from '@/locales/en.json';

const locales = { zh, en } as const;
type Locale = keyof typeof locales;

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved && saved in locales) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);

  const t = locales[locale];

  return { locale, setLocale, t };
}
