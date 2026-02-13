import { vi } from 'vitest';

/**
 * Creates a chainable mock query builder that resolves to the given value when awaited.
 * Mimics Supabase's thenable query builder pattern.
 */
export function createMockQueryBuilder(resolveWith: { data?: any; error?: any; count?: any } = {}) {
  const result = {
    data: resolveWith.data !== undefined ? resolveWith.data : null,
    error: resolveWith.error !== undefined ? resolveWith.error : null,
    count: resolveWith.count !== undefined ? resolveWith.count : null,
  };

  const builder: any = {};
  const methods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'gte', 'lte', 'ilike', 'order', 'single'];

  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Make the builder thenable so `await query` works
  builder.then = (resolve: (value: any) => void) => resolve(result);

  return builder;
}

/**
 * Creates a mock Supabase client with configurable auth and query builder.
 */
export function createMockSupabase(user: { id: string; email?: string } | null = null) {
  const queryBuilder = createMockQueryBuilder();

  const supabase: any = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: 'Not authenticated' },
      }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => queryBuilder),
  };

  return { supabase, queryBuilder };
}

/** Default test user */
export const mockUser = { id: 'user-123', email: 'test@example.com' };
