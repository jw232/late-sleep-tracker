import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabase, mockUser } from '../helpers/mock-supabase';

const { supabase: mockSupabaseClient } = createMockSupabase(mockUser);

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

import { GET } from '@/app/auth/callback/route';

describe('Auth callback route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to success by default
    mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it('code param exists calls exchangeCodeForSession', async () => {
    const req = new Request('http://localhost/auth/callback?code=test-code');
    await GET(req);
    expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
  });

  it('exchange success redirects to /', async () => {
    const req = new Request('http://localhost/auth/callback?code=test-code');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/');
  });

  it('exchange failure redirects to /login?error=auth_failed', async () => {
    mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValueOnce({
      error: { message: 'fail' },
    });
    const req = new Request('http://localhost/auth/callback?code=bad-code');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login?error=auth_failed');
  });

  it('no code param redirects to /login?error=auth_failed', async () => {
    const req = new Request('http://localhost/auth/callback');
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost/login?error=auth_failed');
  });
});
