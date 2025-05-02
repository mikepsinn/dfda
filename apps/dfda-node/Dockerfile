FROM node:18-alpine AS base

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# Copy package files and lockfile first
COPY package.json pnpm-lock.yaml* ./
# Install dependencies directly in this stage
RUN apk add --no-cache libc6-compat # Dependencies needed for install/build
RUN corepack enable pnpm && pnpm i --frozen-lockfile # Full install
# Copy the rest of the source code
COPY . .

# Next.js telemetry config
ENV NEXT_TELEMETRY_DISABLED 1

# Run the build
RUN corepack enable pnpm && pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Install necessary packages including curl and gnupg for Doppler CLI download/verification
RUN apk add --no-cache curl libc6-compat gnupg

# Install Doppler CLI for Alpine
RUN curl -Ls https://cli.doppler.com/install.sh | sh -s -- --no-package-manager --install-path /usr/local/bin

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
# Prepend 'doppler run --' to inject secrets.
# It will automatically use the DOPPLER_TOKEN from the environment.
CMD doppler run -- fallback:env -- node server.js -H 0.0.0.0