# Monorepo map and dev commands

> **When to read:** Before adding or moving code between apps/packages, and before running or wiring dev, build, test, or lint commands.

## Where code goes

`ls apps packages` for the list; each `package.json` names it. Non-obvious placements:

- `apps/proxy` — separate Hono process executing DB queries. Clients connect to **the proxy**, not `apps/api` (query execution close to user's databases: local desktop agent or self-hosted).
- `packages/connection` — driver wrappers, connection-string parsers, SSL/SSH utils. **No Drizzle** (that is `packages/db`, cloud PostgreSQL only).
- `packages/query-proxy` — oRPC router factory shared by `apps/api` + `apps/proxy`.
- `apps/desktop` — Electron wrapper around `apps/app`; `apps/main` = marketing + auth only.

## Dev commands

Root `package.json` holds the full list. Not obvious:

- `pnpm run docker:start` (local Postgres, Redis, Infisical) **required before** `pnpm run dev`.
- `pnpm run dev` = package picker (all pre-selected, Enter accepts); `-a` skips prompt. `pnpm x` picks package + script (`scripts/run-script.ts`), excludes `dev`/`x` (no recursion).
- Local URLs portless, live only while `dev` runs: `https://{api,app,main,proxy}.local.tamery.app`. In a linked git worktree, portless prefixes the branch name (`https://<branch>.api.local.tamery.app`), so worktrees run alongside the main checkout without collisions.
- Cross-service dev URLs are not in `.env` — `setupPortlessEnvs({ API_URL: 'api.local.tamery', … })` (`packages/shared/utils/portless-env.ts`) fills them at startup via `portless get`, worktree-aware. Each app declares its own env-key → portless-name map in its `env.ts` (api, proxy) or `vite.config.ts` (app, main); the helper holds no service names. Precedence: existing env var > portless > optional `.defaults({ … })` chained on the call.

## Opening the running app in a browser

Drive the **user's own Chrome** for any `*.local.tamery.app` URL (trusts the portless CA). In Claude Code: `mcp__claude-in-chrome__*` tools.

`agent-browser` MCP server is wired in `.mcp.json` (`core,debug` tool profiles) for headless driving, console/error reads and a11y audits (add `network`, `react`, `mobile`, `state`, `tabs` or `all` to `--tools` when needed). One-time `pnpm run browser:install` downloads its Chrome for Testing; that Chrome is a separate binary from the user's Chrome, so prefer `mcp__claude-in-chrome__*` for portless HTTPS hosts until agent-browser is confirmed to trust the portless CA.

**Embedded/sandboxed browser pane cannot run them**: document returns 200, then every subresource (`/@vite/client`, `/src/main.tsx`, images, same-origin `fetch('/')`) is cancelled with `net::ERR_BLOCKED_BY_CLIENT` — SPA never boots, blank page with misleading 200. Don't re-debug: ruled out dev server, portless CA/TLS, app CSP, service workers, stale pane state, tab-open method. Block sits in the pane's own request layer, not configurable. Bare `http://localhost:<port>` **does** work there — portless HTTPS hosts specifically fail.
