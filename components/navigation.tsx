'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Moon, key: 'record' as const },
  { href: '/history', icon: ClipboardList, key: 'history' as const },
  { href: '/insights', icon: BarChart3, key: 'insights' as const },
  { href: '/settings', icon: Settings, key: 'settings' as const },
];

export function Navigation() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
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
        <button
          onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          {locale === 'zh' ? 'EN' : '中文'}
        </button>
      </div>
    </nav>
  );
}
