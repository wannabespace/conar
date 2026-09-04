# oRPC routers, secrets, and environment

> **When to read:** Before adding or changing an API procedure, middleware, chat behavior, env var, or anything touching encryption secrets.

## oRPC

- Copy the shape from a neighbouring router in `apps/api/orpc/routers/`; register in `routers/index.ts`. `authMiddleware` puts `user`/`session` on context. Clients call through the generated `ORPCRouter` type, never a manual fetch.
- `create` procedures take exactly one item — never `type.or(schema, schema.array())`; collection handlers fan out with `Promise.all`.
- Errors are declared, not constructed: a procedure or middleware lists its codes in `.errors({ CODE: { message } })` and throws `errors.CODE()`, so the code and its default message live in the contract the client is generated from. `new ORPCError(...)` only where no `errors` map exists — global handler interceptors, and helpers outside a procedure (`getWorkspaceSecret`, `lib/chat-persist.ts`, the CLI proxy's cache lookups). Clients narrow with `isDefinedError`.
- `syncDiff`'s `updated` query is optional: an insert-only collection (chat message parts) omits it rather than paying an `OR` branch per client row for a match that cannot happen.

## Chat

- `routers/ai/v1/chat.ts` (`ai.chat`) is **frozen** — shipped desktop builds parse its wire format; never change that format, never import from it. It only gates: clients below 0.32 get a `FORBIDDEN` "update the app" error instead of a stream, since chat moved to `ai.stream` in 0.32. `routers/ai/v2/` holds everything current, chat procedures under `v2/chat/`. Folders only: barrels re-export flat, so procedure paths stay `ai.chat` / `ai.stream` — never nest them into `ai.v1.*` / `ai.v2.*` / `ai.chat.*`. `ai.chat` is a procedure, so the namespace is taken; the send endpoint is therefore `ai.stream`.
- Stack: AI SDK (`ai` v7 + `@ai-sdk/react`) + `ai-retry` (cross-provider fallbacks) + `ai-resumable-stream` (Redis). Not `@tanstack/ai`.
- `ai.stream`: the wire carries only the new turn; the stored transcript is the model context, so a client can never send stale history. Titles generate server-side beside the first answer; the client never asks.
- `ai.attachStream`: answers "what should be streaming into this chat right now" — the live stream when one exists (pointer per chat, not per device), else a fresh stream when the transcript ends on a user turn that never concluded (decided once, on the server). A turn that ended — answered, stopped, or failed — is marked settled in Redis beside the pointer, so only a crash mid-stream leaves a turn eligible for the restart; an aborted or errored turn is never replayed on reopen. Empty = nothing to stream, never an error. Deliberately not named `resume` — it can spend a model call.
- `ai.abortStream`: publishes stop through Redis; a client that merely leaves stops nothing.
- No output schemas on streaming procedures (the chunk union belongs to `ai`); keep `ai.stream`'s `messages` schema loose — `validateUIMessages` is the real check and the loose shape keeps old clients valid.
- `@tamery/ai` vs `apps/api` split is by **dependency, not topic**: db/auth/oRPC stays in the app; models and stream lifecycle live in the package; persistence is handed in as `onFinish`. Chat runs on `chatModel`; `fastModel` is for titles and filters, `sqlModel` for fix/update SQL. Provider fallbacks live only in `models.ts`.
- **Never wire the request signal into `streamText`** — streams are detached on purpose; only `stopChatStream` aborts. A reload is not a cancellation.
- One starter: `claimChatStream` sets the Redis pointer with **NX** and returns `null` to the loser. `ai.stream` turns that into `CONFLICT` (one answer per chat at a time); `ai.attachStream` falls back to resuming the winner's stream. The pointer is released on flush or when a resume fails, and expires after an hour.
- Ids are the idempotency: the user turn's uuid v7 is minted client-side and is the row id (a re-ask lands on `onConflictDoNothing`); assistant ids are minted once server-side. A re-ask therefore leaves the transcript ending on an assistant turn — that is what a regenerate looks like on the wire, so `ai.stream` deletes that answer before building the model context, instead of asking the model to continue it (parts cascade in Postgres; only the message delete is published, like `chatsMessages.remove`). `keepAlive` holds the Redis stream open until the assistant row lands — a reload mid-finish rejoins or finds the row, never neither.
- Errors surface generic; provider errors stay in server logs. Per-instance ownership is the upgrade path for a second api instance.
- Client: one `Chat` instance memoized outside React per chat id — identity never changes under a running send. `useChat` holds only the live exchange; settled turns come from the collections, merged by id, persisted rows win. So a chat reopened from the collections has no live turns and `regenerate()` would throw — Retry re-sends the last user message under its persisted id instead, which the server reads as a re-ask. `resume` is frozen at mount and true only when the synced transcript doesn't end on an assistant turn (assistant rows persist in `onFinish`, so a settled chat skips the round-trip; frozen because the user turn syncing in mid-send must not re-trigger the SDK's resume effect on a live stream). When the transcript is undecided, the server answers — no per-device pointer. The transport maps an empty `attachStream` body to `null`, the SDK's "no active stream" signal; an empty stream would instead run the full request lifecycle (submitted flash, phantom finish).

## Secrets / environment

- Each app's `env.ts` validates env vars with ArkType. In development, service URL vars default dynamically via portless (see `monorepo.md`) — don't add them back to `.env`.
- Encryption secrets in Infisical at `['users', userId]`, created in `databaseHooks.user.create.after`.
- Connection strings encrypted per **workspace**, not per requester: `getWorkspaceSecret(workspaceId)` resolves the workspace owner's secret; every decrypt path passes the row's own `workspaceId`, so shared workspaces decrypt with one key once invites ship.
