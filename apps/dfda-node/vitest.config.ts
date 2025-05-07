import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts', './tests/shared/integration-setup.ts'], // Updated to new setup file path
    include: ['**/tests/**/*.[jt]s?(x)'], // Include all tests for now
    testTimeout: 120000, // Use the longer timeout for now
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