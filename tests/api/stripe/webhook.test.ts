import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockQueryBuilder } from '../../helpers/mock-supabase';

process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
const mockAdminQB = createMockQueryBuilder();
const mockAdminSupabase = { from: vi.fn(() => mockAdminQB) };

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    webhooks: { constructEvent: (...args: any[]) => mockConstructEvent(...args) },
    subscriptions: { retrieve: (...args: any[]) => mockSubscriptionsRetrieve(...args) },
  })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: vi.fn(() => mockAdminSupabase),
}));

import { POST } from '@/app/api/stripe/webhook/route';

const createWebhookRequest = (body: string, signature?: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (signature) headers['stripe-signature'] = signature;
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers,
  });
};

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminSupabase.from.mockReturnValue(mockAdminQB);
  });

  // --- Signature verification tests (3) ---

  describe('signature verification', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const req = createWebhookRequest('{}');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Missing signature');
    });

    it('returns 400 when constructEvent throws', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Signature verification failed');
      });

      const req = createWebhookRequest('{}', 'sig_invalid');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid signature');
    });

    it('calls constructEvent with correct args (body, signature, secret)', async () => {
      mockConstructEvent.mockReturnValue({ type: 'some.unknown.event', data: { object: {} } });

      const body = '{"test":"data"}';
      const signature = 'sig_valid123';
      await POST(createWebhookRequest(body, signature));

      expect(mockConstructEvent).toHaveBeenCalledWith(body, signature, 'whsec_test');
    });
  });

  // --- checkout.session.completed tests (3) ---

  describe('checkout.session.completed', () => {
    const mockSubscription = {
      id: 'sub_123',
      status: 'active',
      cancel_at_period_end: false,
      items: { data: [{ price: { id: 'price_123' }, current_period_end: 1700000000 }] },
    };

    beforeEach(() => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { subscription: 'sub_123', customer: 'cus_123' } },
      });
      mockSubscriptionsRetrieve.mockResolvedValue(mockSubscription);
    });

    it('retrieves subscription from Stripe', async () => {
      await POST(createWebhookRequest('{}', 'sig_valid'));

      expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith('sub_123');
    });

    it('updates DB subscription record with correct fields', async () => {
      await POST(createWebhookRequest('{}', 'sig_valid'));

      expect(mockAdminQB.update).toHaveBeenCalledWith(
        expect.objectContaining({
          stripe_subscription_id: 'sub_123',
          status: 'active',
          price_id: 'price_123',
          current_period_end: new Date(1700000000 * 1000).toISOString(),
          cancel_at_period_end: false,
        }),
      );
      expect(mockAdminQB.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_123');
    });

    it('converts current_period_end from unix timestamp to ISO string', async () => {
      await POST(createWebhookRequest('{}', 'sig_valid'));

      const updateArg = mockAdminQB.update.mock.calls[0][0];
      const expectedDate = new Date(1700000000 * 1000).toISOString();
      expect(updateArg.current_period_end).toBe(expectedDate);
    });

    it('includes updated_at timestamp in the update', async () => {
      await POST(createWebhookRequest('{}', 'sig_valid'));

      const updateArg = mockAdminQB.update.mock.calls[0][0];
      expect(updateArg.updated_at).toBeDefined();
      expect(new Date(updateArg.updated_at).toISOString()).toBe(updateArg.updated_at);
    });

    it('skips update when session has no subscription or customer', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { subscription: null, customer: null } },
      });

      const res = await POST(createWebhookRequest('{}', 'sig_valid'));
      const json = await res.json();

      expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled();
      expect(mockAdminQB.update).not.toHaveBeenCalled();
      expect(json).toEqual({ received: true });
    });
  });

  // --- customer.subscription.updated test (1) ---

  describe('customer.subscription.updated', () => {
    it('updates status, price_id, current_period_end, cancel_at_period_end', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: {
          object: {
            customer: 'cus_123',
            status: 'active',
            cancel_at_period_end: true,
            items: { data: [{ price: { id: 'price_456' }, current_period_end: 1700000000 }] },
          },
        },
      });

      await POST(createWebhookRequest('{}', 'sig_valid'));

      expect(mockAdminQB.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          price_id: 'price_456',
          current_period_end: new Date(1700000000 * 1000).toISOString(),
          cancel_at_period_end: true,
        }),
      );
      expect(mockAdminQB.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_123');
    });
  });

  // --- customer.subscription.deleted test (1) ---

  describe('customer.subscription.deleted', () => {
    it('includes updated_at in the canceled update', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: { customer: 'cus_del', items: { data: [] } },
        },
      });

      await POST(createWebhookRequest('{}', 'sig_valid'));

      const updateArg = mockAdminQB.update.mock.calls[0][0];
      expect(updateArg.updated_at).toBeDefined();
      expect(new Date(updateArg.updated_at).toISOString()).toBe(updateArg.updated_at);
    });

    it('sets status to canceled', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: {
          object: { customer: 'cus_789', items: { data: [] } },
        },
      });

      await POST(createWebhookRequest('{}', 'sig_valid'));

      expect(mockAdminQB.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'canceled' }),
      );
      expect(mockAdminQB.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_789');
    });
  });

  // --- invoice.payment_failed tests (2) ---

  describe('invoice.payment_failed', () => {
    it('sets status to past_due', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: { object: { customer: 'cus_failed' } },
      });

      await POST(createWebhookRequest('{}', 'sig_valid'));

      expect(mockAdminQB.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'past_due' }),
      );
      expect(mockAdminQB.eq).toHaveBeenCalledWith('stripe_customer_id', 'cus_failed');
    });

    it('skips update when invoice has no customer', async () => {
      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: { object: { customer: null } },
      });

      await POST(createWebhookRequest('{}', 'sig_valid'));

      expect(mockAdminQB.update).not.toHaveBeenCalled();
    });
  });

  // --- General behavior tests (2) ---

  describe('general behavior', () => {
    it('all handled events return received true', async () => {
      const events = [
        {
          type: 'checkout.session.completed',
          data: { object: { subscription: 'sub_1', customer: 'cus_1' } },
        },
        {
          type: 'customer.subscription.updated',
          data: {
            object: {
              customer: 'cus_1',
              status: 'active',
              cancel_at_period_end: false,
              items: { data: [{ price: { id: 'p1' }, current_period_end: 1700000000 }] },
            },
          },
        },
        {
          type: 'customer.subscription.deleted',
          data: { object: { customer: 'cus_1', items: { data: [] } } },
        },
        {
          type: 'invoice.payment_failed',
          data: { object: { customer: 'cus_1' } },
        },
      ];

      mockSubscriptionsRetrieve.mockResolvedValue({
        id: 'sub_1',
        status: 'active',
        cancel_at_period_end: false,
        items: { data: [{ price: { id: 'p1' }, current_period_end: 1700000000 }] },
      });

      for (const event of events) {
        vi.clearAllMocks();
        mockAdminSupabase.from.mockReturnValue(mockAdminQB);
        mockSubscriptionsRetrieve.mockResolvedValue({
          id: 'sub_1',
          status: 'active',
          cancel_at_period_end: false,
          items: { data: [{ price: { id: 'p1' }, current_period_end: 1700000000 }] },
        });
        mockConstructEvent.mockReturnValue(event);

        const res = await POST(createWebhookRequest('{}', 'sig_valid'));
        const json = await res.json();
        expect(json).toEqual({ received: true });
      }
    });

    it('unhandled event type also returns received true', async () => {
      mockConstructEvent.mockReturnValue({ type: 'some.unknown.event', data: { object: {} } });

      const res = await POST(createWebhookRequest('{}', 'sig_valid'));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ received: true });
    });
  });
});
