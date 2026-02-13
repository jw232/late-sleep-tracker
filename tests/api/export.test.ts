import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockSupabase, mockUser } from '../helpers/mock-supabase';

// Module-level mocks
let mockSupabase: any;
let mockQueryBuilder: any;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

beforeEach(() => {
  vi.clearAllMocks();
  const result = createMockSupabase(mockUser);
  mockSupabase = result.supabase;
  mockQueryBuilder = result.queryBuilder;
});

import { GET, DELETE } from '@/app/api/export/route';

// ---------------------------------------------------------------------------
// GET /api/export — JSON export  (4 tests)
// ---------------------------------------------------------------------------
describe('GET /api/export (JSON)', () => {
  it('returns 401 when not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const req = new NextRequest('http://localhost/api/export');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('format=json returns JSON data', async () => {
    const records = [
      { id: '1', record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'test', mood_score: 3, created_at: '2026-01-01T23:00:00Z' },
    ];
    mockQueryBuilder.then = (resolve: any) => resolve({ data: records, error: null });

    const req = new NextRequest('http://localhost/api/export?format=json');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(records);
  });

  it('format missing defaults to JSON', async () => {
    const records = [{ id: '1' }];
    mockQueryBuilder.then = (resolve: any) => resolve({ data: records, error: null });

    const req = new NextRequest('http://localhost/api/export');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(records);
  });

  it('applies user_id filter (data isolation)', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });

    const req = new NextRequest('http://localhost/api/export');
    await GET(req);

    expect(mockSupabase.from).toHaveBeenCalledWith('sleep_records');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUser.id);
  });
});

// ---------------------------------------------------------------------------
// GET /api/export — CSV export  (6 tests)
// ---------------------------------------------------------------------------
describe('GET /api/export (CSV)', () => {
  const mockRecords = [
    {
      id: 'r1',
      record_date: '2026-01-01',
      sleep_time: '23:00',
      reason_text: 'Working late',
      mood_score: 3,
      created_at: '2026-01-01T23:00:00Z',
    },
  ];

  beforeEach(() => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: mockRecords, error: null });
  });

  it('returns correct CSV header row', async () => {
    const req = new NextRequest('http://localhost/api/export?format=csv');
    const res = await GET(req);
    const text = await res.text();
    const firstLine = text.split('\n')[0];
    expect(firstLine).toBe('id,record_date,sleep_time,reason_text,mood_score,created_at');
  });

  it('Content-Type is text/csv', async () => {
    const req = new NextRequest('http://localhost/api/export?format=csv');
    const res = await GET(req);
    expect(res.headers.get('Content-Type')).toBe('text/csv');
  });

  it('Content-Disposition is attachment', async () => {
    const req = new NextRequest('http://localhost/api/export?format=csv');
    const res = await GET(req);
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename=sleep-records.csv');
  });

  it('double quotes escaped (" becomes "")', async () => {
    const recordsWithQuotes = [
      {
        id: '1',
        record_date: '2026-01-01',
        sleep_time: '23:00',
        reason_text: 'said "hello"',
        mood_score: 3,
        created_at: '2026-01-01T23:00:00Z',
      },
    ];
    mockQueryBuilder.then = (resolve: any) => resolve({ data: recordsWithQuotes, error: null });

    const req = new NextRequest('http://localhost/api/export?format=csv');
    const res = await GET(req);
    const text = await res.text();
    const dataLine = text.split('\n')[1];
    // The value with escaped quotes: "said ""hello"""
    expect(dataLine).toContain('"said ""hello"""');
  });

  it('all field values wrapped in double quotes', async () => {
    const req = new NextRequest('http://localhost/api/export?format=csv');
    const res = await GET(req);
    const text = await res.text();
    const dataLine = text.split('\n')[1];
    // Each value should be quoted: "r1","2026-01-01","23:00",...
    expect(dataLine).toMatch(/^".*"$/);
    expect(dataLine).toContain('"r1"');
    expect(dataLine).toContain('"2026-01-01"');
    expect(dataLine).toContain('"23:00"');
  });

  it('null field values output as empty string', async () => {
    const recordsWithNull = [
      {
        id: '1',
        record_date: '2026-01-01',
        sleep_time: '23:00',
        reason_text: 'test',
        mood_score: null,
        created_at: '2026-01-01T23:00:00Z',
      },
    ];
    mockQueryBuilder.then = (resolve: any) => resolve({ data: recordsWithNull, error: null });

    const req = new NextRequest('http://localhost/api/export?format=csv');
    const res = await GET(req);
    const text = await res.text();
    const dataLine = text.split('\n')[1];
    // mood_score is null => output as "" between reason_text and created_at
    expect(dataLine).toContain('"test","","2026-01-01T23:00:00Z"');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/export  (4 tests — total file: 14 tests)
// ---------------------------------------------------------------------------
describe('DELETE /api/export', () => {
  it('returns 401 when not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const res = await DELETE();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('only deletes current user records (user_id filter — security critical)', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: null, error: null });

    await DELETE();

    expect(mockSupabase.from).toHaveBeenCalledWith('sleep_records');
    expect(mockQueryBuilder.delete).toHaveBeenCalled();
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUser.id);
  });

  it('returns { success: true }', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: null, error: null });

    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  it('returns 500 when delete fails', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: null, error: { message: 'Delete failed' } });

    const res = await DELETE();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Delete failed');
  });
});
