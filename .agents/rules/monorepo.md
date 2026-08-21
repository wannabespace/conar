# Monorepo map and dev commands

> **When to read:** Before adding or moving code between apps/packages, and before running or wiring dev, build, test, or lint commands.
>
> Part of the Tamery rule set indexed in `AGENTS.md`. Keep this file accurate when you change what it describes.

## Where code goes

`ls apps packages` for the list; each `package.json` names it. Non-obvious placements:

- `apps/proxy` — separate Hono process that executes DB queries. Clients connect to **the proxy**, not to `apps/api`, so query execution can run close to the user's databases (local desktop agent or self-hosted).
- `packages/connection` — driver wrappers, connection-string parsers, SSL/SSH utils. **No Drizzle** (that is `packages/db`, cloud PostgreSQL only).
- `packages/query-proxy` — the oRPC router factory shared by `apps/api` and `apps/proxy`.
- `apps/desktop` — Electron wrapper around `apps/app`; `apps/main` is marketing + auth only.

## Dev commands

Root `package.json` holds the full list. Worth knowing:

- `pnpm run docker:start` — local Postgres, Redis, Infisical (`docker-compose.dev.yml`). Required before `dev`.
- `pnpm run dev` — package picker (all pre-selected, Enter accepts); `-a` skips the prompt.
- `pnpm x` — interactive package + script picker (`scripts/run-script.ts`, `--help`-level flags documented there). It excludes `dev`/`x` from discovery so it cannot recurse.
- `pnpm run check` / `pnpm run fix` — Ultracite, see `code-style.md`.

Local URLs (portless, only while `pnpm run dev` runs): `https://{api,app,main,proxy}.local.tamery.app`.

## Opening the running app in a browser

Use **Claude in Chrome** (`mcp__claude-in-chrome__*`) for any `*.local.tamery.app` URL — demos, screenshots, checking a UI change against the real app. Navigate the user's Chrome, which already trusts the portless CA.

The in-app **Browser pane** (`mcp__Claude_Browser__*`) cannot run them. The document returns 200, then every subresource — `/@vite/client`, `/src/main.tsx`, images, even a same-origin `fetch('/')` — is cancelled with `net::ERR_BLOCKED_BY_CLIENT`, so the SPA never boots and you get a blank page with a misleading 200 in the network list.

Don't re-debug it. Ruled out by test: dev server (`curl` returns 200 for `/` and `/@vite/client`), portless CA/TLS (`curl` succeeds without `-k`), app CSP (CSP blocks log "Refused to load…", and `/@vite/client` is same-origin), service workers (none registered), stale pane state, and how the tab is opened. The block is in the Browser pane's own request layer and isn't configurable from a session. Bare `http://localhost:<port>` origins **do** work there — it's the portless HTTPS hosts specifically that fail.
