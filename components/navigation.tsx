'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Moon, Sun, ClipboardList, BarChart3, CreditCard, Settings, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase/client';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Moon, key: 'record' as const },
  { href: '/history', icon: ClipboardList, key: 'history' as const },
  { href: '/insights', icon: BarChart3, key: 'insights' as const },
  { href: '/billing', icon: CreditCard, key: 'billing' as const },
  { href: '/settings', icon: Settings, key: 'settings' as const },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const [userInitial, setUserInitial] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const email = user.email || '';
        setUserInitial(email.charAt(0).toUpperCase());
      }
    });
    fetch('/api/usage').then(r => r.json()).then(data => {
      if (data.isPro) setIsPro(true);
    }).catch(() => {});
  }, []);

  if (pathname === '/login') return null;
  if (pathname === '/' && !userInitial) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.nav[item.key]}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            {locale === 'zh' ? 'EN' : '中文'}
          </button>
          {userInitial && (
            <>
              {isPro && (
                <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  PRO
                </span>
              )}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {userInitial}
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                }}
                aria-label={t.settings.signOut}
                title={t.settings.signOut}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
