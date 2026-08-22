# oRPC routers, secrets, and environment

> **When to read:** Before adding or changing an API procedure, middleware, chat version, env var, or anything touching encryption secrets.

## oRPC router pattern

Copy the shape from a neighbouring router in `apps/api/orpc/routers/`, then register it in `routers/index.ts`. Middlewares live in `apps/api/orpc`; `authMiddleware` puts `user`/`session` on context. Clients call procedures through the generated `ORPCRouter` type — never a manual fetch.

`create` procedures take **exactly one item** — never `type.or(schema, schema.array())`. Collection `onInsert` handlers fan out with `Promise.all(transaction.mutations.map(...))`, matching `onUpdate`/`onDelete`.

## Chat is versioned and v1 is frozen

`routers/chats/v1/` is the frozen AI SDK implementation; its wire format is what shipped desktop builds parse — **never port it**. `routers/index.ts` keeps `ai.chat` as an alias of `chats.v1.chat` so those clients keep working; no app in this repo ships a chat UI. v1 is self-contained, so the AI SDK packages and `zod` are dependencies of `apps/api` alone and exist **only** for it — nothing new may reach for them.

Every other AI procedure runs on `@tanstack/ai` through the adapters in `apps/api/lib/ai.ts` — Anthropic only. TanStack AI has no cross-provider failover and a hand-rolled one is not worth owning; route through a gateway adapter if that changes.

## Secrets / environment

- Each app's `env.ts` validates env vars with ArkType.
- Encryption secrets live in Infisical at path `['users', userId]`, created in `databaseHooks.user.create.after`.
- Connection strings are encrypted per **workspace**, not per requester: `getWorkspaceSecret(workspaceId)` (memoized 5 min, on context after `authMiddleware`) resolves the workspace's owner member and reads that owner's secret. Every decrypt path passes the row's own `workspaceId`, so a shared workspace decrypts with one key once invites ship. Moving the secret to `['workspaces', workspaceId]` only changes that lookup — no call site moves.
