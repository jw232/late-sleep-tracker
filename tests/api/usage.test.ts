import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, mockUser } from '../helpers/mock-supabase';

// Module-level mocks
let mockSupabase: any;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

const mockGetSubscriptionStatus = vi.fn();
vi.mock('@/lib/subscription', () => ({
  getSubscriptionStatus: (...args: any[]) => mockGetSubscriptionStatus(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  const result = createMockSupabase(mockUser);
  mockSupabase = result.supabase;
  mockGetSubscriptionStatus.mockResolvedValue({
    isPro: false,
    aiUsageThisMonth: 0,
    aiLimitReached: false,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
});

import { GET } from '@/app/api/usage/route';

// ---------------------------------------------------------------------------
// GET /api/usage  (6 tests)
// ---------------------------------------------------------------------------
describe('GET /api/usage', () => {
  it('returns 401 when not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns getSubscriptionStatus result', async () => {
    const status = {
      isPro: false,
      aiUsageThisMonth: 2,
      aiLimitReached: false,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
    mockGetSubscriptionStatus.mockResolvedValueOnce(status);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(status);
  });

  it('calls getSubscriptionStatus with correct args (supabase, user.id)', async () => {
    await GET();

    expect(mockGetSubscriptionStatus).toHaveBeenCalledTimes(1);
    expect(mockGetSubscriptionStatus).toHaveBeenCalledWith(mockSupabase, mockUser.id);
  });

  it('active subscription returns isPro: true', async () => {
    mockGetSubscriptionStatus.mockResolvedValueOnce({
      isPro: true,
      aiUsageThisMonth: 10,
      aiLimitReached: false,
      currentPeriodEnd: '2026-03-01T00:00:00Z',
      cancelAtPeriodEnd: false,
    });

    const res = await GET();
    const body = await res.json();
    expect(body.isPro).toBe(true);
  });

  it('free user at limit returns aiLimitReached: true', async () => {
    mockGetSubscriptionStatus.mockResolvedValueOnce({
      isPro: false,
      aiUsageThisMonth: 5,
      aiLimitReached: true,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });

    const res = await GET();
    const body = await res.json();
    expect(body.aiLimitReached).toBe(true);
  });

  it('returns correct aiUsageThisMonth count', async () => {
    mockGetSubscriptionStatus.mockResolvedValueOnce({
      isPro: false,
      aiUsageThisMonth: 3,
      aiLimitReached: false,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });

    const res = await GET();
    const body = await res.json();
    expect(body.aiUsageThisMonth).toBe(3);
  });
});
