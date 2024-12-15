import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: '.env',
});

export default defineConfig({
  schema: './app/(fdai)/fdai/lib/db/schema.ts',
  out: './app/(fdai)/fdai/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint: Forbidden non-null assertion.
    url: process.env.FDAI_POSTGRES_URL!,
  },
});
