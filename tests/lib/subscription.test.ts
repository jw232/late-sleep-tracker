import { describe, it, expect, vi } from 'vitest';
import { createMockQueryBuilder } from '../helpers/mock-supabase';
import { getSubscriptionStatus } from '@/lib/subscription';

function buildSupabase(subData: any, usageCount: number | null) {
  const mockFrom = vi.fn();
  const subBuilder = createMockQueryBuilder({ data: subData });
  const usageBuilder = createMockQueryBuilder({ count: usageCount });

  mockFrom.mockImplementation((table: string) => {
    if (table === 'subscriptions') return subBuilder;
    if (table === 'ai_usage') return usageBuilder;
    return createMockQueryBuilder();
  });

  return { from: mockFrom } as any;
}

describe('getSubscriptionStatus', () => {
  // --- isPro checks ---

  it('status=active → isPro: true', async () => {
    const supabase = buildSupabase(
      { status: 'active', current_period_end: '2026-03-01', cancel_at_period_end: false },
      0
    );
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.isPro).toBe(true);
  });

  it('status=trialing → isPro: true', async () => {
    const supabase = buildSupabase(
      { status: 'trialing', current_period_end: '2026-03-01', cancel_at_period_end: false },
      0
    );
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.isPro).toBe(true);
  });

  it('status=canceled → isPro: false', async () => {
    const supabase = buildSupabase(
      { status: 'canceled', current_period_end: '2026-03-01', cancel_at_period_end: false },
      0
    );
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.isPro).toBe(false);
  });

  it('status=past_due → isPro: false', async () => {
    const supabase = buildSupabase(
      { status: 'past_due', current_period_end: '2026-03-01', cancel_at_period_end: false },
      0
    );
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.isPro).toBe(false);
  });

  it('no subscription (data=null) → isPro: false', async () => {
    const supabase = buildSupabase(null, 0);
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.isPro).toBe(false);
  });

  // --- AI usage ---

  it('counts current month AI usage from count value', async () => {
    const supabase = buildSupabase(null, 3);
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.aiUsageThisMonth).toBe(3);
  });

  it('count=null → aiUsageThisMonth=0', async () => {
    const supabase = buildSupabase(null, null);
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.aiUsageThisMonth).toBe(0);
  });

  // --- aiLimitReached ---

  it('free user usage >= 5 → aiLimitReached: true', async () => {
    const supabase = buildSupabase(null, 5);
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.aiLimitReached).toBe(true);
  });

  it('free user usage < 5 → aiLimitReached: false', async () => {
    const supabase = buildSupabase(null, 4);
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.aiLimitReached).toBe(false);
  });

  it('pro user any usage → aiLimitReached: false', async () => {
    const supabase = buildSupabase(
      { status: 'active', current_period_end: '2026-03-01', cancel_at_period_end: false },
      100
    );
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.aiLimitReached).toBe(false);
  });

  // --- other fields ---

  it('returns correct currentPeriodEnd', async () => {
    const supabase = buildSupabase(
      { status: 'active', current_period_end: '2026-04-15T00:00:00Z', cancel_at_period_end: false },
      0
    );
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.currentPeriodEnd).toBe('2026-04-15T00:00:00Z');
  });

  it('returns correct cancelAtPeriodEnd', async () => {
    const supabase = buildSupabase(
      { status: 'active', current_period_end: '2026-04-15', cancel_at_period_end: true },
      0
    );
    const result = await getSubscriptionStatus(supabase, 'user-123');
    expect(result.cancelAtPeriodEnd).toBe(true);
  });
});
