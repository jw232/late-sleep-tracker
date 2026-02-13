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
const mockCustomersCreate = vi.fn().mockResolvedValue({ id: 'cus_123' });
const mockCheckoutCreate = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/session123' });
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    customers: { create: (...args: any[]) => mockCustomersCreate(...args) },
    checkout: { sessions: { create: (...args: any[]) => mockCheckoutCreate(...args) } },
  })),
}));

import { POST } from '@/app/api/stripe/checkout/route';

function createCheckoutRequest(
  body: Record<string, any> = { priceId: 'price_123' },
  headers: Record<string, string> = {},
) {
  return new NextRequest('http://localhost/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-set default auth to logged-in user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
    // Re-set default admin QB (no existing customer)
    mockAdminSupabase.from.mockReturnValue(mockAdminQB);
    // Re-set Stripe mocks
    mockCustomersCreate.mockResolvedValue({ id: 'cus_123' });
    mockCheckoutCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/session123' });
  });

  it('returns 401 when not logged in', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const res = await POST(createCheckoutRequest());
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when priceId is missing', async () => {
    const res = await POST(createCheckoutRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing priceId');
  });

  it('queries subscriptions table for existing stripe_customer_id', async () => {
    await POST(createCheckoutRequest());

    expect(mockAdminSupabase.from).toHaveBeenCalledWith('subscriptions');
    expect(mockAdminQB.select).toHaveBeenCalledWith('stripe_customer_id');
    expect(mockAdminQB.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    expect(mockAdminQB.single).toHaveBeenCalled();
  });

  it('creates new Stripe customer when no existing customer', async () => {
    await POST(createCheckoutRequest());
    expect(mockCustomersCreate).toHaveBeenCalled();
  });

  it('new customer has correct email and metadata', async () => {
    await POST(createCheckoutRequest());

    expect(mockCustomersCreate).toHaveBeenCalledWith({
      email: mockUser.email,
      metadata: { user_id: mockUser.id },
    });
  });

  it('upserts subscription record with customer_id and status free', async () => {
    await POST(createCheckoutRequest());

    expect(mockAdminQB.upsert).toHaveBeenCalledWith({
      user_id: mockUser.id,
      stripe_customer_id: 'cus_123',
      status: 'free',
    });
  });

  it('does not recreate customer when one already exists', async () => {
    const adminQB = createMockQueryBuilder({ data: { stripe_customer_id: 'cus_existing' } });
    mockAdminSupabase.from.mockReturnValue(adminQB);

    await POST(createCheckoutRequest());

    expect(mockCustomersCreate).not.toHaveBeenCalled();
  });

  it('creates Checkout Session with correct params', async () => {
    await POST(createCheckoutRequest());

    expect(mockCheckoutCreate).toHaveBeenCalledWith({
      customer: 'cus_123',
      mode: 'subscription',
      line_items: [{ price: 'price_123', quantity: 1 }],
      success_url: 'http://localhost:3000/billing?payment=success',
      cancel_url: 'http://localhost:3000/billing?payment=canceled',
      metadata: { user_id: mockUser.id },
    });
  });

  it('returns the checkout session url', async () => {
    const res = await POST(createCheckoutRequest());
    const json = await res.json();
    expect(json.url).toBe('https://checkout.stripe.com/session123');
  });

  it('uses request origin header for URLs, falls back to localhost', async () => {
    const req = new NextRequest('http://localhost/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId: 'price_123' }),
      headers: { 'Content-Type': 'application/json', origin: 'https://myapp.com' },
    });

    await POST(req);

    expect(mockCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'https://myapp.com/billing?payment=success',
        cancel_url: 'https://myapp.com/billing?payment=canceled',
      }),
    );
  });
});
