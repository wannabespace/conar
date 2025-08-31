FROM oven/bun:1.2

# Install pnpm globally using bun
RUN bun add -g pnpm

WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install all dependencies before pruning
RUN pnpm install --frozen-lockfile

# Prune the monorepo for the @conar/api app for Docker
RUN pnpm turbo prune @conar/api --docker

# Move into the pruned output directory
WORKDIR /app/out

# Install dependencies for the pruned output
RUN pnpm install --frozen-lockfile

# Expose the port (adjust if needed)
EXPOSE 3000

# Run the API using bun
CMD ["bun", "api"]


