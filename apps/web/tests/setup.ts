import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import { vi } from 'vitest';

// Developers can override these defaults with an uncommitted .env.test file.
// Unit tests mock Supabase, so they should not require local secrets or a
// running Supabase stack just to load the test environment.
dotenv.config({ path: '.env.test' });

process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://127.0.0.1:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';
process.env.SUPABASE_JWT_SECRET ??= 'test-jwt-secret-with-at-least-32-characters';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
process.env.GOOGLE_GENERATIVE_AI_API_KEY ??= 'test-google-generative-ai-key';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  redirect: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies() {
    return {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      getAll: vi.fn(() => []),
    };
  },
  headers() {
    const headerMap = new Map();
    return {
      get: vi.fn((key: string) => headerMap.get(key.toLowerCase()) || null),
      set: vi.fn((key: string, value: string) => headerMap.set(key.toLowerCase(), value)),
      has: vi.fn((key: string) => headerMap.has(key.toLowerCase())),
      delete: vi.fn((key: string) => headerMap.delete(key.toLowerCase())),
      append: vi.fn((key: string, value: string) => {
        const existing = headerMap.get(key.toLowerCase());
        headerMap.set(key.toLowerCase(), existing ? `${existing}, ${value}` : value);
      }),
      forEach: vi.fn((callback: (value: string, key: string, parent: any) => void) => {
        headerMap.forEach((value, key) => callback(value, key, headerMap));
      }),
    };
  },
}));

// Mock Supabase client
vi.mock('@/utils/supabase', async (importOriginal) => {
  const originalModule = await importOriginal<Record<string, unknown>>();
  return {
    ...originalModule,
    createClient: vi.fn(() => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockReturnThis(),
      })),
    })),
    createServerClient: vi.fn(() => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        rpc: vi.fn().mockReturnThis(),
      })),
    })),
  };
});
