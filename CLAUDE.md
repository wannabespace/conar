# Conar — Claude Code context

See [`CONTEXT.md`](CONTEXT.md) for domain terminology (Connection, SyncType, GC, etc.).

## Update documentation when relevant

When you change behavior users rely on, update docs in the same task — do not leave them stale.

**Update when:**
- New or changed features, UI flows, CLI commands, or MCP behavior
- Connection setup, drivers, security, or connection-string handling
- Public APIs, auth, billing, plans, or account settings
- Renamed or removed user-visible concepts (update terminology everywhere)
- New MDX pages: register them in `docs/docs.json`

**Skip when:**
- Internal refactors with no user-visible change
- Tests, tooling, CI, or dev-only scripts
- Typo fixes in code comments or private types

**Where docs live:**

| Area | Location |
|------|----------|
| Product docs (Mintlify MDX) | `docs/**/*.mdx` |
| Doc nav | `docs/docs.json` |
| Doc authoring style | `docs/AGENTS.md` |
| Repo setup / contribution | `README.md` |

After implementing a change: search `docs/` for pages covering the affected area, update them, and wire any new pages into `docs/docs.json`. Follow `docs/AGENTS.md` for Mintlify style (MDX frontmatter, active voice, sentence-case headings).

## Monorepo map

```
apps/
  api/       Hono + oRPC backend. Auth, connections, AI, queries, billing.
  app/       React SPA. Main product UI (TanStack Router + TanStack DB).
  main/      Marketing + auth pages (TanStack Start / Nitro SSR).
  desktop/   Electron wrapper around apps/app.
  proxy/     Hono + oRPC proxy. Executes DB queries on behalf of clients.
  cli/       CLI tool published as `conar` on npm.

packages/
  db/           Drizzle schema + migrations for the cloud PostgreSQL DB.
  connection/   DB driver wrappers, connection-string parsers, SSL/SSH utils. No Drizzle.
  query-proxy/  oRPC router factory shared between apps/api and apps/proxy.
  ai/           Vercel AI SDK tool definitions and provider env helpers.
  ui/           Shared shadcn/base-ui React components and theme.
  table/        TanStack Virtual table component and hooks.
  shared/       Cross-package utils, enums, constants, types.
  infisical/    Secrets client wrapper (@conar/infisical).
  configs/      Shared ESLint / TypeScript configs.
```

## Dev commands

```bash
pnpm run docker:start       # Start local PostgreSQL, MySQL, MSSQL, ClickHouse
pnpm run drizzle:migrate    # Apply DB migrations (packages/db)
pnpm run drizzle:generate   # Generate migration from schema changes
pnpm run dev                # Start all apps via Turbo
pnpm run test               # Bun unit tests
pnpm run test:e2e           # Playwright E2E
pnpm run check-types        # tsc type-check across workspace
pnpm run lint               # ESLint
```

Local URLs (via portless, requires `pnpm run dev`):
- `https://api.local.conar.app`
- `https://app.local.conar.app`
- `https://main.local.conar.app`
- `https://proxy.local.conar.app`

## Architecture constraints

| Topic | Rule |
|-------|------|
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. Routers live in `apps/api/orpc/routers/`. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. |
| Cloud DB ORM | Drizzle (`packages/db`) — not raw SQL, not Prisma. |
| Auth | Better Auth (`apps/api/lib/auth.ts`) — not custom JWT, not NextAuth. |
| Secrets | Infisical via `@conar/infisical` — not `.env` files in production. |
| Runtime | Bun — not Node for server processes. Node 22+ supported as fallback. |
| Testing | Bun test for unit tests. Playwright for E2E. |
| Styles | TailwindCSS v4 — no inline `style=` props for layout/theme values. |

## oRPC router pattern

Adding a new procedure:

```ts
// apps/api/orpc/routers/my-feature.ts
import { authMiddleware, orpc } from '~/orpc'
import { type } from '@orpc/server'

export const myProcedure = orpc
  .use(authMiddleware)        // or subscriptionMiddleware, logMiddleware
  .input(type<{ id: string }>())
  .handler(async ({ input, context }) => {
    // context.user, context.session available after authMiddleware
    return { result: 'ok' }
  })
```

Then register in `apps/api/orpc/routers/index.ts`:

```ts
export const router = { ..., myFeature: { myProcedure } }
```

Available middlewares: `logMiddleware`, `authMiddleware`, `subscriptionMiddleware`, `optionalAuthMiddleware`, `optionalSubscriptionMiddleware`, `cacheMiddleware(ttl)`.

## Secrets / environment

- `apps/api/env.ts`, `apps/proxy/env.ts` etc. validate env vars with ArkType.
- Per-user encryption secrets stored in Infisical at path `['users', userId]`.
- `getUserSecret(userId)` is memoized (5 min TTL) and available on context after `authMiddleware`.
