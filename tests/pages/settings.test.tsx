import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

const mockPush = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/settings',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useLocale
vi.mock('@/hooks/use-locale', () => ({
  useLocale: () => ({
    locale: 'zh',
    setLocale: vi.fn(),
    t: {
      settings: {
        title: '设置',
        language: '语言',
        export: '数据导出',
        exportCSV: '导出 CSV',
        exportJSON: '导出 JSON',
        clearData: '清空数据',
        clearConfirm: '请输入「确认清空」来清除所有数据',
        clearConfirmText: '确认清空',
        clearButton: '清空所有数据',
        noRecordsToClear: '没有记录可清空',
        privacy: '隐私说明',
        privacyPoints: [
          '数据存储在安全的云数据库中',
          'AI 分析仅用于提供个人化建议',
          '我们不会与第三方共享您的数据',
          '您可以随时导出或删除所有数据',
        ],
        about: '关于',
        version: '版本',
        description: '帮助您追踪和改善晚睡习惯的应用',
        totalRecords: '记录总数',
        signOut: '退出登录',
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

import SettingsPage from '@/app/settings/page';
import { supabase } from '@/lib/supabase/client';

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([]),
      blob: vi.fn().mockResolvedValue(new Blob()),
    });
  });

  it('renders settings title', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('设置')).toBeInTheDocument();
  });

  it('renders Chinese and English language buttons', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('renders CSV and JSON export buttons', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('导出 CSV')).toBeInTheDocument();
    expect(screen.getByText('导出 JSON')).toBeInTheDocument();
  });

  it('renders clear data section with confirm input', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText('清空数据')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('确认清空')).toBeInTheDocument();
  });

  it('clear button disabled when totalRecords is 0', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    const clearButton = screen.getByText('没有记录可清空');
    expect(clearButton).toBeDisabled();
  });

  it('clear button disabled when confirm text does not match', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]),
      blob: vi.fn().mockResolvedValue(new Blob()),
    });
    await act(async () => {
      render(<SettingsPage />);
    });
    const input = screen.getByPlaceholderText('确认清空');
    fireEvent.change(input, { target: { value: '不对' } });
    const clearButton = screen.getByText('清空所有数据');
    expect(clearButton).toBeDisabled();
  });

  it('clear button enabled when confirm text matches and has records', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }]),
      blob: vi.fn().mockResolvedValue(new Blob()),
    });
    await act(async () => {
      render(<SettingsPage />);
    });
    const input = screen.getByPlaceholderText('确认清空');
    fireEvent.change(input, { target: { value: '确认清空' } });
    const clearButton = screen.getByText('清空所有数据');
    expect(clearButton).not.toBeDisabled();
  });

  it('sign out button calls signOut and navigates to /login', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    fireEvent.click(screen.getByText('退出登录'));
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('shows total record count', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }]),
      blob: vi.fn().mockResolvedValue(new Blob()),
    });
    await act(async () => {
      render(<SettingsPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
