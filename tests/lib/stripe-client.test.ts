import { describe, it, expect, vi, beforeEach } from 'vitest';

const MockStripe = vi.fn(function (this: any) {
  this.customers = { list: vi.fn() };
});

vi.mock('stripe', () => ({
  default: MockStripe,
}));

describe('getStripe', () => {
  beforeEach(() => {
    vi.resetModules();
    MockStripe.mockClear();

    // Re-mock stripe after resetModules so the fresh import picks it up
    vi.doMock('stripe', () => ({
      default: MockStripe,
    }));
  });

  it('returns a Stripe instance', async () => {
    const { getStripe } = await import('@/lib/stripe');
    const stripe = getStripe();
    expect(stripe).toBeDefined();
  });

  it('uses STRIPE_SECRET_KEY env var', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123';
    const { getStripe } = await import('@/lib/stripe');
    getStripe();
    expect(MockStripe).toHaveBeenCalledWith('sk_test_abc123', expect.any(Object));
  });

  it('singleton pattern: two calls return same reference', async () => {
    const { getStripe } = await import('@/lib/stripe');
    const first = getStripe();
    const second = getStripe();
    expect(first).toBe(second);
    expect(MockStripe).toHaveBeenCalledTimes(1);
  });

  it('passes correct apiVersion', async () => {
    const { getStripe } = await import('@/lib/stripe');
    getStripe();
    expect(MockStripe).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ apiVersion: '2026-01-28.clover' })
    );
  });
});
