import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// DATABASE_URL is a direct PostgreSQL connection. Prisma Client and the
// Prisma CLI both use it; it is not exposed to the browser.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
