# Build stage
FROM node:20-slim AS builder
RUN npm install -g pnpm

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Only install dependencies needed for building
RUN pnpm install --frozen-lockfile --prod=false

COPY . .
RUN pnpm build

# Production stage
FROM node:20-slim AS runner
RUN npm install -g pnpm

WORKDIR /app
ENV NODE_ENV=production

# Copy only necessary files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod=true

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000
CMD ["pnpm", "start"] 