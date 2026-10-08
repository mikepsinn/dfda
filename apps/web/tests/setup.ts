import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import { vi } from 'vitest';

// Developers can override these defaults with an uncommitted .env.test file.
// Unit tests mock sign-in, so they should not require local secrets or a
// running database just to load the test environment.
dotenv.config({ path: '.env.test' });

process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://127.0.0.1:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.BETTER_AUTH_SECRET ??= 'test-better-auth-secret-with-at-least-32-characters';
process.env.SMTP_URL ??= 'smtp://127.0.0.1:2525';
process.env.EMAIL_FROM ??= 'test@example.com';
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

// Mock the Better Auth browser client
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signOut: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
  },
}));
