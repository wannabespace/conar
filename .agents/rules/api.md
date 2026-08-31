# oRPC routers, secrets, and environment

> **When to read:** Before adding or changing an API procedure, middleware, chat behavior, env var, or anything touching encryption secrets.

## oRPC

- Copy the shape from a neighbouring router in `apps/api/orpc/routers/`; register in `routers/index.ts`. `authMiddleware` puts `user`/`session` on context. Clients call through the generated `ORPCRouter` type, never a manual fetch.
- `create` procedures take exactly one item — never `type.or(schema, schema.array())`; collection handlers fan out with `Promise.all`.

## Chat

- `routers/ai/chat-legacy.ts` (`ai.chat`) and `ai.generateTitle` are **frozen** — shipped desktop builds parse their wire format; never change them, never import from them. No v1/v2 split anywhere; don't reintroduce one — a frozen file marked legacy says the same thing without versioning every module.
- Stack: AI SDK (`ai` v7 + `@ai-sdk/react`) + `ai-retry` (cross-provider fallbacks) + `ai-resumable-stream` (Redis). `@tanstack/ai` is gone; do not reach for it.
- `ai.stream`: the wire carries only the new turn; the stored transcript is the model context, so a client can never send stale history. Titles generate server-side beside the first answer; the client never asks.
- `ai.attachStream`: answers "what should be streaming into this chat right now" — the live stream when one exists (pointer per chat, not per device), else a fresh stream when the transcript ends on a user turn (the decision is made once, on the server). Empty = nothing to stream, never an error. Deliberately not named `resume` — it can spend a model call.
- `ai.abortStream`: publishes stop through Redis; a client that merely leaves stops nothing.
- No output schemas on streaming procedures (the chunk union belongs to `ai`); keep `ai.stream`'s `messages` schema loose — `validateUIMessages` is the real check and the loose shape keeps old clients valid.
- `@tamery/ai` vs `apps/api` split is by **dependency, not topic**: db/auth/oRPC stays in the app; models and stream lifecycle live in the package; persistence is handed in as `onFinish`. Chat runs on `fastModel` while the feature is exercised; raise to `chatModel` when answer quality is the point.
- **Never wire the request signal into `streamText`** — streams are detached on purpose; only `stopChatStream` aborts. A reload is not a cancellation.
- The Redis stream pointer's takeover rule is why there are two starters: `restartChatStream` claims with **NX** and returns `null` to the loser (racing mounts answer a question once); `startChatStream` overwrites plainly (a send must never be blocked by a stale pointer).
- Ids are the idempotency: the user turn's uuid v7 is minted client-side and is the row id (a re-ask lands on `onConflictDoNothing`); assistant ids are minted once server-side. `keepAlive` holds the Redis stream open until the assistant row lands — a reload mid-finish rejoins or finds the row, never neither.
- Errors surface generic; provider errors stay in server logs. Boot clears leftover pointers; per-instance ownership is the upgrade path for a second api instance.
- Client: one `Chat` instance memoized outside React per chat id — identity never changes under a running send. `useChat` holds only the live exchange; settled turns come from the collections, merged by id, persisted rows win. `resume` is frozen at mount and true only when the synced transcript doesn't end on an assistant turn (assistant rows persist in `onFinish`, so a settled chat skips the round-trip; frozen because the user turn syncing in mid-send must not re-trigger the SDK's resume effect on a live stream). A per-device pointer was tried and reverted — when the transcript is undecided, the server answers. The transport peeks `attachStream` and maps an empty body to `null` — the SDK's "no active stream" signal; an empty stream instead runs the full request lifecycle (submitted flash, phantom finish).

## Secrets / environment

- Each app's `env.ts` validates env vars with ArkType. In development, service URL vars default dynamically via portless (see `monorepo.md`) — don't add them back to `.env`.
- Encryption secrets in Infisical at `['users', userId]`, created in `databaseHooks.user.create.after`.
- Connection strings encrypted per **workspace**, not per requester: `getWorkspaceSecret(workspaceId)` resolves the workspace owner's secret; every decrypt path passes the row's own `workspaceId`, so shared workspaces decrypt with one key once invites ship.
