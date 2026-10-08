import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    // PostgreSQL connection used by Prisma (lib/db) for all table queries,
    // and by Better Auth (lib/auth.ts) for users and sessions. Required, so
    // that a deployment without it fails at build time instead of failing
    // every query at run time. The build does not connect to it.
    DATABASE_URL: z.string().url(),
    // S3-compatible bucket for uploaded files (lib/storage). Optional here so
    // that builds run without it; lib/storage throws on first use when
    // S3_BUCKET is missing. Without access keys the AWS default credentials apply.
    S3_BUCKET: z.string().min(1).optional(),
    S3_REGION: z.string().min(1).optional(),
    S3_ENDPOINT: z.string().url().optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    S3_FORCE_PATH_STYLE: z.enum(['true', 'false']).optional(),
    // AI-assisted features degrade gracefully when no provider key is set.
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
    // Sign-in (lib/auth.ts). The secret signs session cookies and OAuth
    // queries; make one with `openssl rand -base64 32`.
    BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long'),
    // Outgoing email (magic links and password resets), for example
    // smtps://user:password@smtp.example.com:465.
    SMTP_URL: z.string().url(),
    EMAIL_FROM: z.string().min(3),
    // Google sign-in. Optional: without both values the Google button is hidden.
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1).optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    // Site metadata configuration
    NEXT_PUBLIC_SITE_NAME: z.string().min(1).default("Open Treatment Evidence Network"),
    NEXT_PUBLIC_SITE_DESCRIPTION: z.string().min(1).default("Revolutionizing Clinical Trials Through Decentralization"),
    NEXT_PUBLIC_SITE_URL: z.string().url().default("https://prototype.dfda.earth"),
    NEXT_PUBLIC_TWITTER_HANDLE: z.string().min(1).default("@dfda"),
    NEXT_PUBLIC_GOOGLE_VERIFICATION: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    SMTP_URL: process.env.SMTP_URL,
    EMAIL_FROM: process.env.EMAIL_FROM,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    // Site metadata configuration
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_SITE_DESCRIPTION: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_TWITTER_HANDLE: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
    NEXT_PUBLIC_GOOGLE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
