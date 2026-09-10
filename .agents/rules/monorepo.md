# Monorepo map and dev commands

## Where code goes

`ls apps packages` for the list. Non-obvious placements:

- `apps/proxy` — separate Hono process executing DB queries; clients connect to **the proxy**, not `apps/api`.
- `packages/connection` — driver wrappers, connection-string parsers, SSL/SSH utils. **No Drizzle** (that's `packages/db`, cloud PostgreSQL only).
- `packages/query-proxy` — oRPC router factory shared by `apps/api` + `apps/proxy`.
- `motion-panels` — the resizable pane layout mechanics (framework-agnostic core plus a React adapter, animated with motion, no third-party layout library). An external npm dependency, developed in its own repo (`~/Projects/Own/motion-panels`), not a workspace package. Published on npm; the catalog pins the version and consuming packages say `catalog:`. To test local changes to it, `pnpm-workspace.yaml` gets an `overrides` entry `motion-panels: 'link:../../Own/motion-panels/motion-panels'` (override `link:` paths resolve from the workspace root; catalogs reject the `link:` protocol) followed by `pnpm install` and a Vite restart (`touch apps/app/vite.config.ts`); tamery then sees the package's `dist`, so a change there needs `pnpm --filter motion-panels run build` before it shows up here. Drop the override before merging, or the branch installs a checkout that CI does not have. It ships unstyled and has no `cn`: the kit wraps it as `ResizableGroup`/`ResizablePanel`/`ResizableSeparator` (`packages/ui/components/custom/resizable.tsx`, importing `motion-panels/react`) and the app imports those. Behaviour and rules in the `tamery-ui` skill (patterns → Pane splits, motion → Pane folds).
- `packages/ai` — everything AI needing no db/auth/oRPC: models, resumable chat stream, `UIMessage` helpers, one module per generation feature under `features/`, with `models/` (list, price, health) and `usage/` alongside. New prompts and models go here, not `apps/api`; folder barrels only (`@tamery/ai/models`) so the client never pulls server-only modules, and each barrel re-exports by name — never `export *` (`code-style.md`).
- `@tamery/vite-prerender` (`packages/vite-prerender`) — framework-agnostic Vite plugin: renders React components into `index.html` markers (dev and build) and inlines bundled IIFE scripts. Knows nothing about shells, boot, or CSS — every target is passed from the app's `vite.config.ts`.
- `apps/desktop` — Electron wrapper around `apps/app`; `apps/main` = marketing + auth only.

## Dev commands

Setup and the command list live in `README.md` and root `package.json`. Not obvious:

- `pnpm x` picks package + script; `pnpm run dev`'s picker takes `-a` to skip the prompt.
- Portless dev URLs live only while `dev` runs. In a linked git worktree portless prefixes the branch name, so worktrees run alongside the main checkout.
- Cross-service dev URLs are not in `.env` — `setupPortlessEnvs(...)` (`packages/shared/utils/portless-env.ts`) fills them at startup, worktree-aware; each app declares its own env-key map in its `env.ts` or `vite.config.ts`. Precedence: existing env var > portless > `.defaults(...)`.

## Opening the running app in a browser

**Default: `agent-browser` CLI via Bash** (install in `README.md`) — not the user's Chrome, and deliberately not an MCP server or project dependency. Its Chrome trusts the portless CA, so portless HTTPS hosts load, but its profile is signed out: anything behind auth needs the user's own Chrome, since entering credentials is not an agent's to do. Dev app: `https://app.local.tamery.app`.

Fall back to the user's own Chrome (`mcp__claude-in-chrome__*`) only when the binary is missing or the task needs the user's real profile. Playwright for scripted multi-step runs.

**The embedded/sandboxed browser pane cannot load portless HTTPS hosts** — every subresource is cancelled with `net::ERR_BLOCKED_BY_CLIENT` by the pane's own request layer (not TLS, CSP, or service workers). Bare `http://localhost:<port>` works there.
