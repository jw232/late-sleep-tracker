import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock useLocale
vi.mock('@/hooks/use-locale', () => ({
  useLocale: () => ({
    locale: 'zh',
    setLocale: vi.fn(),
    t: {
      login: {
        title: '晚睡记录',
        subtitle: '记录你的晚睡时间，用 AI 发现改善方向',
        google: '使用 Google 登录',
        or: '或',
        emailPlaceholder: '输入邮箱地址',
        sendLink: '发送登录链接',
        checkEmail: '登录链接已发送，请查收邮箱',
        error: '登录失败，请重试',
      },
    },
  }),
}));

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}));

import LoginPage from '@/app/login/page';
import { supabase } from '@/lib/supabase/client';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login title and subtitle', () => {
    render(<LoginPage />);
    expect(screen.getByText('晚睡记录')).toBeInTheDocument();
    expect(screen.getByText('记录你的晚睡时间，用 AI 发现改善方向')).toBeInTheDocument();
  });

  it('renders Google OAuth button', () => {
    render(<LoginPage />);
    expect(screen.getByText('使用 Google 登录')).toBeInTheDocument();
  });

  it('renders email input', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('输入邮箱地址')).toBeInTheDocument();
  });

  it('renders Magic Link button', () => {
    render(<LoginPage />);
    expect(screen.getByText('发送登录链接')).toBeInTheDocument();
  });

  it('Magic Link button disabled when email empty', () => {
    render(<LoginPage />);
    const sendButton = screen.getByText('发送登录链接');
    expect(sendButton).toBeDisabled();
  });

  it('click Google button calls signInWithOAuth with provider google', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText('使用 Google 登录'));
    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      );
    });
  });

  it('submit email form calls signInWithOtp', async () => {
    render(<LoginPage />);
    const emailInput = screen.getByPlaceholderText('输入邮箱地址');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const sendButton = screen.getByText('发送登录链接');
    fireEvent.click(sendButton);
    await waitFor(() => {
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' })
      );
    });
  });

  it('login error shows error message', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValueOnce({
      data: null,
      error: { message: 'fail' },
    } as any);
    render(<LoginPage />);
    fireEvent.click(screen.getByText('使用 Google 登录'));
    await waitFor(() => {
      expect(screen.getByText('登录失败，请重试')).toBeInTheDocument();
    });
  });
});
