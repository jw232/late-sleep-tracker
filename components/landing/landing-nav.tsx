'use client';

import Link from 'next/link';
import { Moon } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

export function LandingNav() {
  const { locale, setLocale, t } = useLocale();

  return (
    <nav className="sticky top-0 z-50 bg-white/5 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2 text-white">
          <Moon className="h-6 w-6 text-amber-400" />
          <span className="font-[family-name:var(--font-heading)] text-lg font-bold">
            {t.landing.footer}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            {locale === 'zh' ? 'EN' : '中文'}
          </button>
          <Link
            href="/login"
            className="rounded-lg bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors border border-white/20"
          >
            {t.landing.loginButton}
          </Link>
        </div>
      </div>
    </nav>
  );
}
