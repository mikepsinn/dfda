const nextJest = require("next/jest")
const path = require('path')

const createJestConfig = nextJest({
  dir: "./",
})

const customJestConfig = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFiles: ["./jest.polyfills.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: [
    "<rootDir>/tests/unit/**/*.test.ts",
    "<rootDir>/tests/unit/**/*.test.tsx",
    "<rootDir>/app/**/*.test.ts",
    "<rootDir>/app/**/*.test.tsx"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/tests/ai/",
    "<rootDir>/tests/integration/"
  ],
  transformIgnorePatterns: [
    "/node_modules/(?!(nanoid|@ai-sdk|ai|exa-js|@upstash|@vercel|@tanstack|@tryvital|@radix-ui)/.*)"
  ],
  // Always output reports
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'unit-junit.xml',
      includeConsoleOutput: true,
      classNameTemplate: '{filepath}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
    }],
    ['github-actions', {silent: false}],
    ['jest-html-reporter', {
      pageTitle: 'Unit Test Report',
      outputPath: 'unit-test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      includeConsoleLog: true,
      includeStackTrace: true,
      sort: 'status',
    }]
  ]
}

module.exports = createJestConfig(customJestConfig)
