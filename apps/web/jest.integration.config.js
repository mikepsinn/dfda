const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: [
    "**/tests/integration/**/*.[jt]s?(x)",
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/.next/"
  ],
  testTimeout: 60000, // 60 seconds timeout for integration tests
  verbose: true,
  // Add reporters for CI environment
  reporters: process.env.CI 
    ? [
        'default',
        ['jest-junit', {
          outputDirectory: 'test-results',
          outputName: 'integration-junit.xml',
        }]
      ]
    : ['default'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 