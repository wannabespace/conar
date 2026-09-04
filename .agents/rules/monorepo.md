# Monorepo map and dev commands

## Where code goes

`ls apps packages` for the list. Non-obvious placements:

- `apps/proxy` — separate Hono process executing DB queries; clients connect to **the proxy**, not `apps/api`.
- `packages/connection` — driver wrappers, connection-string parsers, SSL/SSH utils. **No Drizzle** (that's `packages/db`, cloud PostgreSQL only).
- `packages/query-proxy` — oRPC router factory shared by `apps/api` + `apps/proxy`.
- `packages/ai` — everything AI needing no db/auth/oRPC: models, resumable chat stream, `UIMessage` helpers, one module per generation feature. New prompts and models go here, not `apps/api`; deep imports only (`@tamery/ai/models`) so the client never pulls server-only modules.
- `@tamery/vite-prerender` (`packages/vite-prerender`) — framework-agnostic Vite plugin: renders React components into `index.html` markers (dev and build) and inlines bundled IIFE scripts. Knows nothing about shells, boot, or CSS — every target is passed from the app's `vite.config.ts`.
- `apps/desktop` — Electron wrapper around `apps/app`; `apps/main` = marketing + auth only.

## Dev commands

Setup and the command list live in `README.md` and root `package.json`. Not obvious:

- `pnpm x` picks package + script; `pnpm run dev`'s picker takes `-a` to skip the prompt.
- Portless dev URLs live only while `dev` runs. In a linked git worktree portless prefixes the branch name, so worktrees run alongside the main checkout.
- Cross-service dev URLs are not in `.env` — `setupPortlessEnvs(...)` (`packages/shared/utils/portless-env.ts`) fills them at startup, worktree-aware; each app declares its own env-key map in its `env.ts` or `vite.config.ts`. Precedence: existing env var > portless > `.defaults(...)`.

## Opening the running app in a browser

**Default: `agent-browser` CLI via Bash** (install in `README.md`) — not the user's Chrome, and deliberately not an MCP server or project dependency. Its Chrome trusts the portless CA and keeps a logged-in session across runs.

Fall back to the user's own Chrome (`mcp__claude-in-chrome__*`) only when the binary is missing or the task needs the user's real profile. Playwright for scripted multi-step runs.

**The embedded/sandboxed browser pane cannot load portless HTTPS hosts** — every subresource is cancelled with `net::ERR_BLOCKED_BY_CLIENT` by the pane's own request layer (not TLS, CSP, or service workers). Bare `http://localhost:<port>` works there.
