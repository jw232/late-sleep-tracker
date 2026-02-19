'use client';

import { useState, useEffect, useCallback, createContext, useContext, createElement } from 'react';
import zh from '@/locales/zh.json';
import en from '@/locales/en.json';

const locales = { zh, en } as const;
type Locale = keyof typeof locales;

type LocaleContextType = {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: typeof zh;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
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

  return createElement(LocaleContext.Provider, { value: { locale, setLocale, t } }, children);
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
