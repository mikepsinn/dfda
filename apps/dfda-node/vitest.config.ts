import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'], // Only include the general setup for unit tests
    include: ['**/tests/unit/**/*.[jt]s?(x)'], // Default to unit tests, can be overridden by CLI arg
    testTimeout: 10000, // Default timeout for unit tests
    // reporters: ['default', 'html'], // Optional: for HTML report
    // coverage: { // Optional: configure coverage
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html'],
    //   reportsDirectory: './coverage'
    // },
    // minWorkers and maxWorkers might not be supported here directly in v3.1.3
    // They might be command-line only or configured differently.
  },
}); 