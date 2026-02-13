import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockSupabase, createMockQueryBuilder, mockUser } from '../helpers/mock-supabase';

// Module-level mocks that get reconfigured per test
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

// Import after mock setup (vi.mock is hoisted)
import { GET, POST, PUT, DELETE } from '@/app/api/records/route';

// ---------------------------------------------------------------------------
// GET /api/records  (11 tests)
// ---------------------------------------------------------------------------
describe('GET /api/records', () => {
  it('returns 401 when not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const req = new NextRequest('http://localhost/api/records');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns records for current user (data isolation)', async () => {
    const records = [
      { id: 'r1', record_date: '2026-01-15', sleep_time: '23:30', reason_text: 'work', user_id: mockUser.id },
    ];
    mockQueryBuilder.then = (resolve: any) => resolve({ data: records, error: null });

    const req = new NextRequest('http://localhost/api/records');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(records);
  });

  it('filters by days param (default 30)', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });

    const req = new NextRequest('http://localhost/api/records?days=7');
    await GET(req);

    expect(mockQueryBuilder.gte).toHaveBeenCalledWith('record_date', expect.any(String));
    const dateArg = mockQueryBuilder.gte.mock.calls[0][1];
    const expected = new Date();
    expected.setDate(expected.getDate() - 7);
    expect(dateArg).toBe(expected.toISOString().split('T')[0]);
  });

  it('searches with ilike when search param provided', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });

    const req = new NextRequest('http://localhost/api/records?search=gaming');
    await GET(req);

    expect(mockQueryBuilder.ilike).toHaveBeenCalledWith('reason_text', '%gaming%');
  });

  it('returns empty array when no matching records', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });

    const req = new NextRequest('http://localhost/api/records');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('results ordered by record_date descending', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });

    const req = new NextRequest('http://localhost/api/records');
    await GET(req);

    expect(mockQueryBuilder.order).toHaveBeenCalledWith('record_date', { ascending: false });
  });

  it('verifies user_id filter is called (security critical)', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });

    const req = new NextRequest('http://localhost/api/records');
    await GET(req);

    expect(mockSupabase.from).toHaveBeenCalledWith('sleep_records');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUser.id);
  });

  it('returns 500 when Supabase query fails', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: null, error: { message: 'DB error' } });

    const req = new NextRequest('http://localhost/api/records');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('DB error');
  });

  it('days param missing defaults to 30', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });

    const req = new NextRequest('http://localhost/api/records');
    await GET(req);

    const dateArg = mockQueryBuilder.gte.mock.calls[0][1];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    expect(dateArg).toBe(thirtyDaysAgo.toISOString().split('T')[0]);
  });

  it('days param NaN defaults to 30', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });

    const req = new NextRequest('http://localhost/api/records?days=abc');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const dateArg = mockQueryBuilder.gte.mock.calls[0][1];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    expect(dateArg).toBe(thirtyDaysAgo.toISOString().split('T')[0]);
  });

  it('date format is YYYY-MM-DD', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: [], error: null });

    const req = new NextRequest('http://localhost/api/records');
    await GET(req);

    const dateArg = mockQueryBuilder.gte.mock.calls[0][1] as string;
    expect(dateArg).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// POST /api/records  (8 tests)
// ---------------------------------------------------------------------------
describe('POST /api/records', () => {
  const makePostRequest = (body: Record<string, any>) =>
    new NextRequest('http://localhost/api/records', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  it('returns 401 when not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const req = makePostRequest({ record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'work' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates record with required fields', async () => {
    const created = { id: 'r1', record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'work', user_id: mockUser.id };
    mockQueryBuilder.then = (resolve: any) => resolve({ data: created, error: null });

    const req = makePostRequest({ record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'work' });
    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        record_date: '2026-01-01',
        sleep_time: '23:00',
        reason_text: 'work',
      }),
    );
  });

  it('user_id set to current user not from request body (security critical)', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: {}, error: null });

    const req = makePostRequest({
      record_date: '2026-01-01',
      sleep_time: '23:00',
      reason_text: 'work',
      user_id: 'attacker-id',
    });
    await POST(req);

    const insertArg = mockQueryBuilder.insert.mock.calls[0][0];
    expect(insertArg.user_id).toBe(mockUser.id);
  });

  it('mood_score defaults to null when not provided', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: {}, error: null });

    const req = makePostRequest({ record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'work' });
    await POST(req);

    const insertArg = mockQueryBuilder.insert.mock.calls[0][0];
    expect(insertArg.mood_score).toBeNull();
  });

  it('analysis defaults to null when not provided', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: {}, error: null });

    const req = makePostRequest({ record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'work' });
    await POST(req);

    const insertArg = mockQueryBuilder.insert.mock.calls[0][0];
    expect(insertArg.analysis).toBeNull();
  });

  it('mood_score passed correctly when provided', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: {}, error: null });

    const req = makePostRequest({ record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'work', mood_score: 4 });
    await POST(req);

    const insertArg = mockQueryBuilder.insert.mock.calls[0][0];
    expect(insertArg.mood_score).toBe(4);
  });

  it('returns the created record via .select().single()', async () => {
    const created = { id: 'r1', record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'work' };
    mockQueryBuilder.then = (resolve: any) => resolve({ data: created, error: null });

    const req = makePostRequest({ record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'work' });
    const res = await POST(req);
    const body = await res.json();

    expect(body).toEqual(created);
    expect(mockQueryBuilder.select).toHaveBeenCalled();
    expect(mockQueryBuilder.single).toHaveBeenCalled();
  });

  it('returns 500 when insert fails', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: null, error: { message: 'Insert failed' } });

    const req = makePostRequest({ record_date: '2026-01-01', sleep_time: '23:00', reason_text: 'work' });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Insert failed');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/records  (3 tests)
// ---------------------------------------------------------------------------
describe('PUT /api/records', () => {
  const makePutRequest = (body: Record<string, any>) =>
    new NextRequest('http://localhost/api/records', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  it('returns 401 when not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const req = makePutRequest({ id: 'r1', reason_text: 'updated' });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it('updates matching both id AND user_id (ownership verification)', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: { id: 'r1', reason_text: 'updated' }, error: null });

    const req = makePutRequest({ id: 'r1', reason_text: 'updated' });
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const eqCalls = mockQueryBuilder.eq.mock.calls;
    expect(eqCalls).toEqual(
      expect.arrayContaining([
        ['id', 'r1'],
        ['user_id', mockUser.id],
      ]),
    );
  });

  it('returns 500 when update fails', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: null, error: { message: 'Update failed' } });

    const req = makePutRequest({ id: 'r1', reason_text: 'updated' });
    const res = await PUT(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Update failed');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/records  (4 tests — total file: 26 tests)
// ---------------------------------------------------------------------------
describe('DELETE /api/records', () => {
  it('returns 401 when not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const req = new NextRequest('http://localhost/api/records?id=r1', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when id param missing', async () => {
    const req = new NextRequest('http://localhost/api/records', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing id');
  });

  it('deletes matching both id AND user_id (ownership verification)', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: null, error: null });

    const req = new NextRequest('http://localhost/api/records?id=r1', { method: 'DELETE' });
    await DELETE(req);

    expect(mockQueryBuilder.delete).toHaveBeenCalled();
    const eqCalls = mockQueryBuilder.eq.mock.calls;
    expect(eqCalls).toEqual(
      expect.arrayContaining([
        ['id', 'r1'],
        ['user_id', mockUser.id],
      ]),
    );
  });

  it('returns { success: true } on success', async () => {
    mockQueryBuilder.then = (resolve: any) => resolve({ data: null, error: null });

    const req = new NextRequest('http://localhost/api/records?id=r1', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });
});
