import { describe, it, expect, vi } from 'vitest';

const MockAnthropic = vi.fn(function (this: any) {
  this.messages = { create: vi.fn() };
});

vi.mock('@anthropic-ai/sdk', () => ({
  default: MockAnthropic,
}));

describe('anthropic client', () => {
  it('calls the Anthropic constructor', async () => {
    await import('@/lib/anthropic');
    expect(MockAnthropic).toHaveBeenCalled();
  });

  it('exports an anthropic instance', async () => {
    const { anthropic } = await import('@/lib/anthropic');
    expect(anthropic).toBeDefined();
    expect(anthropic.messages).toBeDefined();
    expect(anthropic.messages.create).toBeInstanceOf(Function);
  });
});
