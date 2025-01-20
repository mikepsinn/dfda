# Build stage
FROM node:20-slim AS builder
RUN apt-get update -y && apt-get install -y openssl
RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Only install dependencies needed for building
RUN pnpm install --frozen-lockfile --prod=false
RUN npx prisma generate

COPY . .
RUN pnpm build

# Production stage
FROM node:20-slim AS runner
RUN apt-get update -y && apt-get install -y openssl curl
RUN npm install -g pnpm prisma

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy necessary files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod=true && \
    prisma generate

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

CMD echo "Starting container..." && \
    echo "NODE_ENV: $NODE_ENV" && \
    echo "DATABASE_URL: ${DATABASE_URL:0:30}..." && \
    echo "Starting Next.js..." && \
    pnpm start 