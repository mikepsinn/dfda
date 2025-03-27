import '@testing-library/jest-dom'
import fs from 'fs'
import path from 'path'

// Check for required test configuration
function validateTestConfig() {
  const envTestPath = path.join(process.cwd(), '.env.test')
  if (!fs.existsSync(envTestPath)) {
    throw new Error('.env.test file is missing. Please create one from .env.test.example')
  }
}

// Run config validation
validateTestConfig()

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  }),
  createServerClient: jest.fn(),
})) 