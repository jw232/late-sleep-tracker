'use client';

import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLocale } from '@/hooks/use-locale';

export function LandingNav() {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-card backdrop-blur-md border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-foreground">
          <Moon className="h-6 w-6 text-primary" />
          <span className="font-[family-name:var(--font-heading)] text-lg font-bold">
            {t.landing.footer}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {locale === 'zh' ? 'EN' : '中文'}
          </button>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t.landing.loginButton}
          </Link>
        </div>
      </div>
    </nav>
  );
}
