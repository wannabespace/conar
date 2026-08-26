# Monorepo map and dev commands

> **When to read:** Before adding or moving code between apps/packages, and before running or wiring dev, build, test, or lint commands.

## Where code goes

`ls apps packages` for the list; each `package.json` names it. Non-obvious placements:

- `apps/proxy` — separate Hono process executing DB queries. Clients connect to **the proxy**, not `apps/api` (query execution close to user's databases: local desktop agent or self-hosted).
- `packages/connection` — driver wrappers, connection-string parsers, SSL/SSH utils. **No Drizzle** (that is `packages/db`, cloud PostgreSQL only).
- `packages/query-proxy` — oRPC router factory shared by `apps/api` + `apps/proxy`.
- `packages/ai` — all AI building blocks: model adapters (`adapters.ts`), per-feature system prompts (`prompts/`), and chat versions mirrored as `v1/` (frozen AI SDK blocks — `api.md`) and `v2/` (`prompt.ts`, `message.ts`). New prompts/adapters go here, not in `apps/api`.
- `apps/desktop` — Electron wrapper around `apps/app`; `apps/main` = marketing + auth only.

## Dev commands

Root `package.json` holds the full list. Not obvious:

- `pnpm run docker:start` (local Postgres, Redis, Infisical) **required before** `pnpm run dev`.
- `pnpm run dev` = package picker (all pre-selected, Enter accepts); `-a` skips prompt. `pnpm x` picks package + script (`scripts/run-script.ts`), excludes `dev`/`x` (no recursion).
- Local URLs portless, live only while `dev` runs: `https://{api,app,main,proxy}.local.tamery.app`. In a linked git worktree, portless prefixes the branch name (`https://<branch>.api.local.tamery.app`), so worktrees run alongside the main checkout without collisions.
- Cross-service dev URLs are not in `.env` — `setupPortlessEnvs({ API_URL: 'api.local.tamery', … })` (`packages/shared/utils/portless-env.ts`) fills them at startup via `portless get`, worktree-aware. Each app declares its own env-key → portless-name map in its `env.ts` (api, proxy) or `vite.config.ts` (app, main); the helper holds no service names. Precedence: existing env var > portless > optional `.defaults({ … })` chained on the call.

## Opening the running app in a browser

**Default: `agent-browser` CLI via Bash** — not the user's Chrome. It is deliberately *not* registered as an MCP server and *not* a project dependency; install globally per machine (`npm install -g agent-browser && agent-browser install`, see `README.md`).

`agent-browser open <url>`, then `snapshot`, `click @ref`, `type`, `console`, `errors`, `screenshot`. Its Chrome for Testing **does** trust the portless CA — `https://app.local.tamery.app` loads, boots and keeps its logged-in session across runs (verified 2026-08-26). Do not re-test this before reaching for another browser.

Only fall back to the user's own Chrome (`mcp__claude-in-chrome__*`) when the binary is missing, or when the task needs the user's real profile (their logins, their extensions). Playwright for scripted multi-step runs.

**Embedded/sandboxed browser pane cannot run them**: document returns 200, then every subresource (`/@vite/client`, `/src/main.tsx`, images, same-origin `fetch('/')`) is cancelled with `net::ERR_BLOCKED_BY_CLIENT` — SPA never boots, blank page with misleading 200. Don't re-debug: ruled out dev server, portless CA/TLS, app CSP, service workers, stale pane state, tab-open method. Block sits in the pane's own request layer, not configurable. Bare `http://localhost:<port>` **does** work there — portless HTTPS hosts specifically fail.
