import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts', './tests/shared/integration-setup.ts'],
    include: ['**/tests/integration/**/*.[jt]s?(x)'],
    testTimeout: 120000, // Longer timeout for integration tests
    // minWorkers: 1, // Consider if needed for DB contention
    // maxWorkers: 1, // Consider if needed for DB contention
  },
}); 