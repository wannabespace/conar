# Use Bun as base image
FROM oven/bun:1 as base

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/configs/package.json ./packages/configs/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Prune the workspace for production
RUN pnpm turbo prune @conar/api --docker

# Production stage
FROM oven/bun:1 as production

# Install pnpm
RUN npm install -g pnpm@10.15.0

# Set working directory
WORKDIR /app

# Copy pruned output
COPY --from=base /app/out/json/ ./
COPY --from=base /app/out/full/ ./

# Install production dependencies
RUN pnpm install --frozen-lockfile --prod

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "out/full/apps/api/src/index.ts"]
