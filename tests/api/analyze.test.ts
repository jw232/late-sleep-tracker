import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockSupabase, createMockQueryBuilder, mockUser } from '../helpers/mock-supabase';

// Create mock outside vi.mock for reference
const { supabase: mockSupabaseClient, queryBuilder: mockQB } = createMockSupabase(mockUser);

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

const mockAnthropicCreate = vi.fn();
vi.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: {
      create: (...args: any[]) => mockAnthropicCreate(...args),
    },
  },
}));

const mockGetSubscriptionStatus = vi.fn();
vi.mock('@/lib/subscription', () => ({
  getSubscriptionStatus: (...args: any[]) => mockGetSubscriptionStatus(...args),
}));

// --- Helpers ---

const defaultAnalysis = {
  top_reasons: [{ reason: 'Work', confidence: 85 }],
  suggestions: ['Sleep earlier'],
  tags: ['work'],
};

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost:3000/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ reason_text: 'Stayed up working', sleep_time: '01:30', ...body }),
  });
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });
  mockGetSubscriptionStatus.mockResolvedValue({
    isPro: false,
    aiUsageThisMonth: 0,
    aiLimitReached: false,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  mockAnthropicCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(defaultAnalysis) }],
  });
  mockSupabaseClient.from.mockReturnValue(mockQB);
});

const importRoute = () => import('@/app/api/analyze/route');

// --- Tests ---

describe('POST /api/analyze', () => {
  // Auth test (1)
  describe('authentication', () => {
    it('returns 401 when not logged in', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });
  });

  // AI limit tests (2-4)
  describe('AI usage limits', () => {
    it('returns 403 with limit_reached when aiLimitReached is true', async () => {
      mockGetSubscriptionStatus.mockResolvedValueOnce({
        isPro: false,
        aiUsageThisMonth: 5,
        aiLimitReached: true,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });

      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('limit_reached');
    });

    it('calls getSubscriptionStatus with supabase and user.id', async () => {
      const { POST } = await importRoute();
      await POST(makeRequest());
      expect(mockGetSubscriptionStatus).toHaveBeenCalledWith(mockSupabaseClient, mockUser.id);
    });

    it('continues to analysis when aiLimitReached is false', async () => {
      mockGetSubscriptionStatus.mockResolvedValueOnce({
        isPro: false,
        aiUsageThisMonth: 2,
        aiLimitReached: false,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      });

      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      expect(mockAnthropicCreate).toHaveBeenCalled();
    });
  });

  // Anthropic API call tests (5-9)
  describe('Anthropic API calls', () => {
    it('uses correct model claude-sonnet-4-5-20250929', async () => {
      const { POST } = await importRoute();
      await POST(makeRequest());
      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'claude-sonnet-4-5-20250929' })
      );
    });

    it('message includes sleep_time and reason_text', async () => {
      const { POST } = await importRoute();
      await POST(makeRequest({ sleep_time: '02:00', reason_text: 'Gaming' }));
      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      const userMessage = callArgs.messages[0].content;
      expect(userMessage).toContain('02:00');
      expect(userMessage).toContain('Gaming');
    });

    it('system prompt specifies JSON format', async () => {
      const { POST } = await importRoute();
      await POST(makeRequest());
      const callArgs = mockAnthropicCreate.mock.calls[0][0];
      expect(callArgs.system).toContain('JSON');
    });

    it('sets max_tokens to 1024', async () => {
      const { POST } = await importRoute();
      await POST(makeRequest());
      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 1024 })
      );
    });

    it('extracts text block from response.content array', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [
          { type: 'tool_use', id: 'x' },
          { type: 'text', text: JSON.stringify(defaultAnalysis) },
        ],
      });

      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      const json = await res.json();
      expect(json.top_reasons).toEqual(defaultAnalysis.top_reasons);
    });
  });

  // Response handling tests (10-14)
  describe('response handling', () => {
    it('returns parsed JSON analysis result on success', async () => {
      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(defaultAnalysis);
    });

    it('strips ```json ... ``` markdown code fences', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: '```json\n{"top_reasons":[],"suggestions":[],"tags":[]}\n```' }],
      });

      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      const json = await res.json();
      expect(json).toEqual({ top_reasons: [], suggestions: [], tags: [] });
    });

    it('strips ``` ... ``` plain code fences', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: '```\n{"top_reasons":[],"suggestions":[],"tags":[]}\n```' }],
      });

      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      const json = await res.json();
      expect(json).toEqual({ top_reasons: [], suggestions: [], tags: [] });
    });

    it('parses JSON without code fences', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: '{"top_reasons":[{"reason":"Phone","confidence":90}],"suggestions":["Put phone away"],"tags":["phone"]}' }],
      });

      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      const json = await res.json();
      expect(json.top_reasons[0].reason).toBe('Phone');
    });

    it('inserts usage record in ai_usage table after success', async () => {
      const { POST } = await importRoute();
      await POST(makeRequest());
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('ai_usage');
      expect(mockQB.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        endpoint: 'analyze',
      });
    });
  });

  // Error tests (15-16)
  describe('error handling', () => {
    it('returns 500 when Anthropic API throws', async () => {
      mockAnthropicCreate.mockRejectedValueOnce(new Error('API connection failed'));

      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('Analysis failed');
      expect(json.detail).toContain('API connection failed');
    });

    it('returns 500 when AI returns invalid JSON', async () => {
      mockAnthropicCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'not valid json' }],
      });

      const { POST } = await importRoute();
      const res = await POST(makeRequest());
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('Analysis failed');
    });
  });
});
