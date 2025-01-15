# Base image
FROM node:20-slim AS base

# Install pnpm and prisma
RUN npm install -g pnpm prisma

# Install dependencies required for Prisma and other tools
RUN apt-get update && apt-get install -y apt-transport-https ca-certificates curl python3 make g++

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy package files and lockfile
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN prisma generate

# Copy source code
COPY . .

# Build the app
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create .next directory and set permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Create cache directory with proper permissions
RUN mkdir -p .next/cache
RUN chown -R nextjs:nodejs .next

# Copy built files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 