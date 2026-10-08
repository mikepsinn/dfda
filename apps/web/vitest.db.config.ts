import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Database tests run against a real PostgreSQL database that
// scripts/db-plain-setup.ts has built. DATABASE_URL must point to it.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/db/**/*.test.ts'],
    setupFiles: ['tests/db/setup.ts'],
    testTimeout: 30000,
    fileParallelism: false,
  },
});
