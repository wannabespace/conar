# Build stage
FROM oven/bun:1.2.20-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN bun install

# Copy source code
COPY apps/api/ ./apps/api/

FROM oven/bun:1.2.20-slim

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages

# Set environment variables
ENV NODE_ENV=production \
    PORT=4000 \
    BUN_ENV=production

# Expose port
EXPOSE 4000
# Start API
WORKDIR /app/apps/api
CMD ["bun", "run", "src/index.ts"]
