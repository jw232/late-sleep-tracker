import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

let mockPaymentParam = '';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/billing',
  useSearchParams: () => new URLSearchParams(mockPaymentParam ? `payment=${mockPaymentParam}` : ''),
}));

// Mock useLocale
vi.mock('@/hooks/use-locale', () => ({
  useLocale: () => ({
    locale: 'zh',
    setLocale: vi.fn(),
    t: {
      billing: {
        subscription: '订阅',
        freePlan: '免费版',
        proPlan: 'Pro',
        currentPlan: '当前方案',
        monthly: '月付 $3.99',
        yearly: '年付 $39.99',
        yearlySave: '省16%',
        manageSubscription: '管理订阅',
        cancelAtEnd: '将在到期后取消',
        expiresOn: '有效期至',
        paymentSuccess: '订阅成功！',
        paymentCanceled: '支付已取消',
      },
    },
  }),
}));

import BillingPage from '@/app/billing/page';

describe('BillingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPaymentParam = '';
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        isPro: false,
        aiUsageThisMonth: 2,
        aiLimitReached: false,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }),
    });
  });

  it('renders subscription title', async () => {
    await act(async () => {
      render(<BillingPage />);
    });
    const titles = screen.getAllByText('订阅');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('non-Pro shows Free plan info', async () => {
    await act(async () => {
      render(<BillingPage />);
    });
    await waitFor(() => {
      expect(screen.getByText(/免费版/)).toBeInTheDocument();
    });
  });

  it('Pro user shows PRO badge and manage button', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        isPro: true,
        aiUsageThisMonth: 10,
        aiLimitReached: false,
        currentPeriodEnd: '2026-12-31T00:00:00Z',
        cancelAtPeriodEnd: false,
      }),
    });
    await act(async () => {
      render(<BillingPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('PRO')).toBeInTheDocument();
      expect(screen.getByText('管理订阅')).toBeInTheDocument();
    });
  });

  it('URL param payment=success shows success message', async () => {
    mockPaymentParam = 'success';
    await act(async () => {
      render(<BillingPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('订阅成功！')).toBeInTheDocument();
    });
  });

  it('URL param payment=canceled shows canceled message', async () => {
    mockPaymentParam = 'canceled';
    await act(async () => {
      render(<BillingPage />);
    });
    await waitFor(() => {
      expect(screen.getByText('支付已取消')).toBeInTheDocument();
    });
  });
});
