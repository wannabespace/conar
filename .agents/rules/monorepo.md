# Monorepo map and dev commands

> **When to read:** Before adding or moving code between apps/packages, and before running or wiring dev, build, test, or lint commands.

## Where code goes

`ls apps packages` for the list; each `package.json` names it. Only the non-obvious placements are worth writing down:

- `apps/proxy` — separate Hono process that executes DB queries. Clients connect to **the proxy**, not to `apps/api`, so query execution can run close to the user's databases (local desktop agent or self-hosted).
- `packages/connection` — driver wrappers, connection-string parsers, SSL/SSH utils. **No Drizzle** (that is `packages/db`, cloud PostgreSQL only).
- `packages/query-proxy` — the oRPC router factory shared by `apps/api` and `apps/proxy`.
- `apps/desktop` — Electron wrapper around `apps/app`; `apps/main` is marketing + auth only.

## Dev commands

Root `package.json` holds the full list. What it doesn't tell you:

- `pnpm run docker:start` (local Postgres, Redis, Infisical) is **required before** `pnpm run dev`.
- `pnpm run dev` is a package picker (all pre-selected, Enter accepts); `-a` skips the prompt. `pnpm x` picks package + script (`scripts/run-script.ts`), excluding `dev`/`x` so it cannot recurse.
- Local URLs are portless and live only while `dev` runs: `https://{api,app,main,proxy}.local.tamery.app`.

## Opening the running app in a browser

Drive the **user's own Chrome** for any `*.local.tamery.app` URL — demos, screenshots, checking a UI change against the real app. It already trusts the portless CA, so the pages just load. (In Claude Code that is the `mcp__claude-in-chrome__*` tools.)

An **embedded/sandboxed browser pane** cannot run them, whichever agent ships it. The document returns 200, then every subresource — `/@vite/client`, `/src/main.tsx`, images, even a same-origin `fetch('/')` — is cancelled with `net::ERR_BLOCKED_BY_CLIENT`, so the SPA never boots and you get a blank page with a misleading 200 in the network list.

Don't re-debug it. Ruled out by test: dev server, portless CA/TLS, app CSP, service workers, stale pane state, and how the tab is opened. The block sits in the pane's own request layer and isn't configurable from a session. Bare `http://localhost:<port>` origins **do** work there — it's the portless HTTPS hosts specifically that fail.
