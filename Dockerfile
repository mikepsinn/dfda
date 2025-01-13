FROM node:18-slim

# Install pnpm
RUN npm install -g pnpm

# Install necessary build tools
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/autonomous-researcher/package.json ./packages/autonomous-researcher/
COPY packages/database/package.json ./packages/database/

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the app
RUN cd apps/web && pnpm build

# Expose the port
EXPOSE 3000

# Start command
CMD ["pnpm", "--filter", "web", "start"] 