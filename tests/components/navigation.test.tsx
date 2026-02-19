import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navigation } from '@/components/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/history',
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

// Mock supabase client (requires env vars at import time)
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'test@example.com' } } }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock useLocale
vi.mock('@/hooks/use-locale', () => ({
  useLocale: () => ({
    locale: 'zh',
    setLocale: vi.fn(),
    t: {
      nav: {
        record: '记录',
        history: '历史',
        insights: '洞察',
        billing: '订阅',
        settings: '设置',
      },
      settings: {
        signOut: '退出登录',
      },
    },
  }),
}));

describe('Navigation', () => {
  it('renders 5 page links', () => {
    render(<Navigation />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
  });

  it('renders language toggle button', () => {
    render(<Navigation />);
    expect(screen.getByText('EN')).toBeInTheDocument();
  });
});
