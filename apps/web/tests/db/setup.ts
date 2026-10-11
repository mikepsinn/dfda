// Settings that lib/env.ts requires. The database tests do not send email or
// call outside services; DATABASE_URL and the S3_* settings come from the environment.
process.env.BETTER_AUTH_SECRET ??= 'test-better-auth-secret-with-at-least-32-characters'
process.env.SMTP_URL ??= 'smtp://127.0.0.1:2525'
process.env.EMAIL_FROM ??= 'test@example.com'
