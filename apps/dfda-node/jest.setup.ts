import '@testing-library/jest-dom'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

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
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    }
  },
  headers() {
    return new Headers()
  },
}))

// Mock Supabase client
jest.mock('@/utils/supabase', () => ({
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