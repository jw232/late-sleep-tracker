import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/history',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useLocale
vi.mock('@/hooks/use-locale', () => ({
  useLocale: () => ({
    locale: 'zh',
    setLocale: vi.fn(),
    t: {
      history: {
        title: '历史记录',
        search: '搜索',
        searchPlaceholder: '搜索原因...',
        last7Days: '最近7天',
        last30Days: '最近30天',
        noRecords: '暂无记录',
        error: '加载失败，请重试',
        edit: '编辑',
        delete: '删除',
        confirmDelete: '确认删除这条记录吗？',
        cancel: '取消',
        save: '保存',
        editRecord: '编辑记录',
      },
      analysis: {
        title: 'AI 分析结果',
        mainReasons: '主要原因',
        confidence: '置信度',
        suggestions: '改善建议',
        tags: '标签',
      },
    },
  }),
}));

// Mock RecordList component
vi.mock('@/components/history/record-list', () => ({
  RecordList: ({ records }: any) => (
    <div data-testid="record-list">{records.length} records</div>
  ),
}));

import HistoryPage from '@/app/history/page';

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue([]),
    });
  });

  it('renders history page title', async () => {
    await act(async () => {
      render(<HistoryPage />);
    });
    expect(screen.getByText('历史记录')).toBeInTheDocument();
  });

  it('renders 7-day and 30-day filter buttons', async () => {
    await act(async () => {
      render(<HistoryPage />);
    });
    expect(screen.getByText('最近7天')).toBeInTheDocument();
    expect(screen.getByText('最近30天')).toBeInTheDocument();
  });

  it('renders search input and search button', async () => {
    await act(async () => {
      render(<HistoryPage />);
    });
    expect(screen.getByPlaceholderText('搜索原因...')).toBeInTheDocument();
    // Search button is an icon button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3); // 7-day, 30-day, search
  });

  it('fetches 7-day records on mount (default days=7)', async () => {
    await act(async () => {
      render(<HistoryPage />);
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('days=7')
      );
    });
  });

  it('enter key triggers search', async () => {
    await act(async () => {
      render(<HistoryPage />);
    });
    const searchInput = screen.getByPlaceholderText('搜索原因...');
    fireEvent.change(searchInput, { target: { value: '工作' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=%E5%B7%A5%E4%BD%9C')
      );
    });
  });

  it('fetch failure shows error message', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    await act(async () => {
      render(<HistoryPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('加载失败，请重试')).toBeInTheDocument();
    });
  });
});
