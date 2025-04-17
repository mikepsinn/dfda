export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  testMatch: ['**/tests/integration/**/*.[jt]s?(x)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  // Longer timeout for integration tests (especially Supabase setup)
  testTimeout: 120000,
  // Fewer workers for integration tests to avoid DB conflicts
  maxWorkers: 1,
} 