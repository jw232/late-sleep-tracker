import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockSupabase, createMockQueryBuilder, mockUser } from '../helpers/mock-supabase';
import type { SleepRecord } from '@/types';

// Create mock outside vi.mock for reference
const { supabase: mockSupabaseClient } = createMockSupabase(mockUser);

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

const makeRecord = (overrides: Partial<SleepRecord> = {}): SleepRecord => ({
  id: 'r1',
  record_date: '2026-01-01',
  sleep_time: '23:00',
  reason_text: 'test',
  mood_score: 3,
  analysis: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

function makeRequest(days?: number) {
  const url = days
    ? `http://localhost:3000/api/insights?days=${days}`
    : 'http://localhost:3000/api/insights';
  return new NextRequest(url, { method: 'GET' });
}

const defaultSubStatus = {
  isPro: false,
  aiUsageThisMonth: 0,
  aiLimitReached: false,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

const defaultPatternAnalysis = {
  patterns: [{ name: 'Late work', evidence: 'Working past midnight', frequency: '3x/week' }],
  weekday_analysis: { worst_day: 'Friday', analysis: 'End of week fatigue' },
  trend: 'stable',
  actionable_advice: ['Set a work cutoff time'],
};

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });
  mockGetSubscriptionStatus.mockResolvedValue(defaultSubStatus);
  mockAnthropicCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(defaultPatternAnalysis) }],
  });
  // Default: return empty records
  const qb = createMockQueryBuilder({ data: [], error: null });
  mockSupabaseClient.from.mockReturnValue(qb);
});

const importRoute = () => import('@/app/api/insights/route');

// --- Tests ---

describe('GET /api/insights', () => {
  // Auth & query tests (1-4)
  describe('authentication and query', () => {
    it('returns 401 when not logged in', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('filters by days param (default 30)', async () => {
      const qb = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      await GET(makeRequest());

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('sleep_records');
      expect(qb.select).toHaveBeenCalledWith('*');
      expect(qb.gte).toHaveBeenCalled();
      const gteArgs = qb.gte.mock.calls[0];
      expect(gteArgs[0]).toBe('record_date');
    });

    it('applies user_id filter for data isolation', async () => {
      const qb = createMockQueryBuilder({ data: [], error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      await GET(makeRequest());

      expect(qb.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('returns 500 when Supabase query fails', async () => {
      const qb = createMockQueryBuilder({ data: null, error: { message: 'DB connection failed' } });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('DB connection failed');
    });
  });

  // Reason aggregation tests (5-8)
  describe('reason aggregation', () => {
    it('aggregates reasons from analysis.top_reasons', async () => {
      const records = [
        makeRecord({
          analysis: { top_reasons: [{ reason: 'Work', confidence: 85 }], suggestions: [], tags: [] },
        }),
        makeRecord({
          id: 'r2',
          analysis: { top_reasons: [{ reason: 'Work', confidence: 70 }], suggestions: [], tags: [] },
        }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.topReasons).toEqual([{ reason: 'Work', count: 2 }]);
    });

    it('returns top 5 sorted by count descending', async () => {
      const reasons = ['A', 'B', 'C', 'D', 'E', 'F'];
      const records: SleepRecord[] = [];
      let id = 0;
      for (const reason of reasons) {
        const count = 6 - reasons.indexOf(reason);
        for (let i = 0; i < count; i++) {
          records.push(
            makeRecord({
              id: `r${id++}`,
              analysis: { top_reasons: [{ reason, confidence: 80 }], suggestions: [], tags: [] },
            })
          );
        }
      }
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.topReasons).toHaveLength(5);
      expect(json.topReasons[0]).toEqual({ reason: 'A', count: 6 });
      expect(json.topReasons[4]).toEqual({ reason: 'E', count: 2 });
    });

    it('returns empty topReasons when no analysis data', async () => {
      const records = [makeRecord({ analysis: null })];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.topReasons).toEqual([]);
    });

    it('skips records with null analysis', async () => {
      const records = [
        makeRecord({
          analysis: { top_reasons: [{ reason: 'Gaming', confidence: 90 }], suggestions: [], tags: [] },
        }),
        makeRecord({ id: 'r2', analysis: null }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.topReasons).toEqual([{ reason: 'Gaming', count: 1 }]);
    });
  });

  // Sleep time stats tests (9-14)
  describe('sleep time statistics', () => {
    it('calculates correct average time', async () => {
      // 23:00 = 1380 min, 01:00 = 1500 min (< 12 so + 1440)
      // avg = (1380 + 1500) / 2 = 1440 → 1440 >= 1440 → 1440 - 1440 = 0 → 00:00
      const records = [
        makeRecord({ sleep_time: '23:00' }),
        makeRecord({ id: 'r2', sleep_time: '01:00' }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.sleepStats.avgTime).toBe('00:00');
    });

    it('identifies earliest sleep time', async () => {
      // 23:00 = 1380, 01:00 = 1500 → earliest = 1380 → 23:00
      const records = [
        makeRecord({ sleep_time: '23:00' }),
        makeRecord({ id: 'r2', sleep_time: '01:00' }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.sleepStats.earliestTime).toBe('23:00');
    });

    it('identifies latest sleep time', async () => {
      // 23:00 = 1380, 01:00 = 1500 → latest = 1500 → 1500-1440 = 60 → 01:00
      const records = [
        makeRecord({ sleep_time: '23:00' }),
        makeRecord({ id: 'r2', sleep_time: '01:00' }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.sleepStats.latestTime).toBe('01:00');
    });

    it('handles cross-midnight times by adding 24 hours for times before 12:00', async () => {
      // 01:30 → h=1 < 12 → 1*60+30+1440 = 1530
      // 02:00 → h=2 < 12 → 2*60+0+1440 = 1560
      // avg = (1530+1560)/2 = 1545 → 1545-1440 = 105 → 1h45m → 01:45
      const records = [
        makeRecord({ sleep_time: '01:30' }),
        makeRecord({ id: 'r2', sleep_time: '02:00' }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.sleepStats.avgTime).toBe('01:45');
      expect(json.sleepStats.earliestTime).toBe('01:30');
      expect(json.sleepStats.latestTime).toBe('02:00');
    });

    it('returns empty strings when no sleep_time data', async () => {
      const records = [makeRecord({ sleep_time: '' })];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.sleepStats.avgTime).toBe('');
      expect(json.sleepStats.earliestTime).toBe('');
      expect(json.sleepStats.latestTime).toBe('');
    });

    it('formats time as HH:MM with zero-padding', async () => {
      // 00:05 → h=0 < 12 → 0*60+5+1440 = 1445 → 1445-1440 = 5 → 00:05
      const records = [makeRecord({ sleep_time: '00:05' })];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.sleepStats.avgTime).toBe('00:05');
      expect(json.sleepStats.avgTime).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  // Trend & AI tests (15-20)
  describe('trend and AI pattern analysis', () => {
    it('returns last 14 records as trend data', async () => {
      const records: SleepRecord[] = [];
      for (let i = 0; i < 16; i++) {
        records.push(
          makeRecord({
            id: `r${i}`,
            record_date: `2026-01-${String(i + 1).padStart(2, '0')}`,
            sleep_time: '23:00',
          })
        );
      }
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.trend).toHaveLength(14);
      // First trend item should be record at index 2 (16 - 14 = 2)
      expect(json.trend[0].date).toBe('2026-01-03');
      expect(json.trend[13].date).toBe('2026-01-16');
    });

    it('calls Anthropic for pattern analysis when records >= 3 and isPro', async () => {
      mockGetSubscriptionStatus.mockResolvedValueOnce({
        ...defaultSubStatus,
        isPro: true,
      });
      const records = [
        makeRecord({ id: 'r1', reason_text: 'Work' }),
        makeRecord({ id: 'r2', reason_text: 'Gaming' }),
        makeRecord({ id: 'r3', reason_text: 'Reading' }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(mockAnthropicCreate).toHaveBeenCalled();
      expect(json.patternAnalysis).toEqual(defaultPatternAnalysis);
    });

    it('does not call Anthropic for non-Pro user', async () => {
      mockGetSubscriptionStatus.mockResolvedValueOnce({
        ...defaultSubStatus,
        isPro: false,
      });
      const records = [
        makeRecord({ id: 'r1' }),
        makeRecord({ id: 'r2' }),
        makeRecord({ id: 'r3' }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
      expect(json.patternAnalysis).toBeNull();
    });

    it('does not call Anthropic when records < 3', async () => {
      mockGetSubscriptionStatus.mockResolvedValueOnce({
        ...defaultSubStatus,
        isPro: true,
      });
      const records = [
        makeRecord({ id: 'r1' }),
        makeRecord({ id: 'r2' }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(mockAnthropicCreate).not.toHaveBeenCalled();
      expect(json.patternAnalysis).toBeNull();
    });

    it('returns patternAnalysis as null when Anthropic call fails (no crash)', async () => {
      mockGetSubscriptionStatus.mockResolvedValueOnce({
        ...defaultSubStatus,
        isPro: true,
      });
      mockAnthropicCreate.mockRejectedValueOnce(new Error('API Error'));
      const records = [
        makeRecord({ id: 'r1' }),
        makeRecord({ id: 'r2' }),
        makeRecord({ id: 'r3' }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.patternAnalysis).toBeNull();
    });

    it('returns totalRecords and isPro fields', async () => {
      mockGetSubscriptionStatus.mockResolvedValueOnce({
        ...defaultSubStatus,
        isPro: true,
      });
      const records = [
        makeRecord({ id: 'r1' }),
        makeRecord({ id: 'r2' }),
      ];
      const qb = createMockQueryBuilder({ data: records, error: null });
      mockSupabaseClient.from.mockReturnValue(qb);

      const { GET } = await importRoute();
      const res = await GET(makeRequest());
      const json = await res.json();
      expect(json.totalRecords).toBe(2);
      expect(json.isPro).toBe(true);
    });
  });
});
