import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockUser: any = null;

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: { user: mockUser } })
      ),
    },
  })),
}));

// Set env vars
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

import { updateSession } from '@/lib/supabase/middleware';

const createRequest = (pathname: string) => {
  return new NextRequest(`http://localhost${pathname}`);
};

describe('updateSession middleware', () => {
  beforeEach(() => {
    mockUser = null;
    vi.clearAllMocks();
  });

  it('authenticated user on protected route passes through', async () => {
    mockUser = { id: 'user-123', email: 'test@example.com' };
    const res = await updateSession(createRequest('/history'));
    expect(res.status).toBe(200);
  });

  it('unauthenticated user on /history redirects to /login', async () => {
    mockUser = null;
    const res = await updateSession(createRequest('/history'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('unauthenticated user on /insights redirects to /login', async () => {
    mockUser = null;
    const res = await updateSession(createRequest('/insights'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('unauthenticated user on /billing redirects to /login', async () => {
    mockUser = null;
    const res = await updateSession(createRequest('/billing'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('unauthenticated user on /settings redirects to /login', async () => {
    mockUser = null;
    const res = await updateSession(createRequest('/settings'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('unauthenticated user on / passes through', async () => {
    mockUser = null;
    const res = await updateSession(createRequest('/'));
    expect(res.status).toBe(200);
  });

  it('unauthenticated user on /login passes through', async () => {
    mockUser = null;
    const res = await updateSession(createRequest('/login'));
    expect(res.status).toBe(200);
  });

  it('authenticated user on /login redirects to /', async () => {
    mockUser = { id: 'user-123', email: 'test@example.com' };
    const res = await updateSession(createRequest('/login'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/');
  });
});
