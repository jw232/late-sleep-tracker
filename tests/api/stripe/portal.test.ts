import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockSupabase, createMockQueryBuilder, mockUser } from '../../helpers/mock-supabase';

// Auth supabase mock (user's client for auth check)
const { supabase: mockSupabaseClient } = createMockSupabase(mockUser);
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Admin supabase mock (for DB operations, bypasses RLS)
const mockAdminQB = createMockQueryBuilder();
const mockAdminSupabase = { from: vi.fn(() => mockAdminQB) };
vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: vi.fn(() => mockAdminSupabase),
}));

// Stripe mock
const mockPortalCreate = vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/session123' });
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    billingPortal: { sessions: { create: (...args: any[]) => mockPortalCreate(...args) } },
  })),
}));

import { POST } from '@/app/api/stripe/portal/route';

function createPortalRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/stripe/portal', {
    method: 'POST',
    headers: { ...headers },
  });
}

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-set default auth to logged-in user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    // Re-set default admin QB (no stripe_customer_id by default)
    mockAdminSupabase.from.mockReturnValue(mockAdminQB);
    // Re-set Stripe mock
    mockPortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session123' });
  });

  it('returns 401 when not logged in', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const res = await POST(createPortalRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 404 when no stripe_customer_id', async () => {
    // Default mockAdminQB resolves with { data: null }, so sub?.stripe_customer_id is falsy
    const res = await POST(createPortalRequest());
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('No subscription found');
  });

  it('creates Portal Session with correct customer ID', async () => {
    const adminQB = createMockQueryBuilder({ data: { stripe_customer_id: 'cus_portal456' } });
    mockAdminSupabase.from.mockReturnValue(adminQB);

    await POST(createPortalRequest({ origin: 'https://myapp.com' }));

    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: 'cus_portal456',
      return_url: 'https://myapp.com/billing',
    });
  });

  it('returns the portal session url', async () => {
    const adminQB = createMockQueryBuilder({ data: { stripe_customer_id: 'cus_portal456' } });
    mockAdminSupabase.from.mockReturnValue(adminQB);

    const res = await POST(createPortalRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe('https://billing.stripe.com/session123');
  });

  it('uses request origin header for return_url', async () => {
    const adminQB = createMockQueryBuilder({ data: { stripe_customer_id: 'cus_portal456' } });
    mockAdminSupabase.from.mockReturnValue(adminQB);

    await POST(createPortalRequest({ origin: 'https://example.com' }));

    expect(mockPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: 'https://example.com/billing',
      }),
    );
  });

  it('falls back to localhost:3000 when origin missing', async () => {
    const adminQB = createMockQueryBuilder({ data: { stripe_customer_id: 'cus_portal456' } });
    mockAdminSupabase.from.mockReturnValue(adminQB);

    await POST(createPortalRequest());

    expect(mockPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        return_url: 'http://localhost:3000/billing',
      }),
    );
  });
});
