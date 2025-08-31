FROM oven/bun:1.2

RUN bun add -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

EXPOSE 3000

CMD ["sh", "-c", "cd apps/api && bun start"]
