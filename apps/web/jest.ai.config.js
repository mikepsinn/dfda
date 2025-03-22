const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testMatch: [
    "**/tests/ai/**/*.[jt]s?(x)",
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/.next/"
  ],
  testTimeout: 300000, // 5 minutes timeout for AI tests
  verbose: true,
  // Always output reports
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'ai-junit.xml',
      includeConsoleOutput: true,
      classNameTemplate: '{filepath}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
    }],
    ['github-actions', {silent: false}],
    ['jest-html-reporter', {
      pageTitle: 'AI Test Report',
      outputPath: 'ai-test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      includeConsoleLog: true,
      includeStackTrace: true,
      sort: 'status',
    }]
  ]
}

module.exports = createJestConfig(customJestConfig) 