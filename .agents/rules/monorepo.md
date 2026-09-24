# Monorepo map and dev commands

## Where code goes

`ls apps packages` for the list. Non-obvious placements:

- `apps/proxy` — separate Hono process executing DB queries; clients connect to **the proxy**, not `apps/api`. `packages/query-proxy` holds the oRPC router factory both share.
- `packages/sql` — the SQL language behind the editor: per-dialect tokenizer (also Monaco's tokens provider), statement splitter, catalog-aware diagnostics and completion, destructive-keyword check. Pure and Monaco-free; `entities/connection/sql-language.ts` is the only place that binds it to Monaco.
- `packages/connection` — driver wrappers, connection-string parsers, SSL/SSH utils. **No Drizzle** (that is `packages/db`, cloud PostgreSQL only).
- `packages/ai` — everything AI that needs no db/auth/oRPC: models, resumable chat stream, `UIMessage` helpers, one module per generation feature. New prompts and models go here, not `apps/api`. Folder barrels only, each re-exporting by name (`code-style.md`), so the client never pulls server-only modules.
- `@tamery/vite-inline-html` — Vite plugins that fill `index.html` markers in dev and build (the root entry inlines bundled IIFE scripts, the `/react` entry server-renders components). It knows nothing about shells, boot or CSS; every target is passed from the app's `vite.config.ts`.
- `apps/desktop` — Electron wrapper around `apps/app`; `apps/main` is marketing + auth only.
- `motion-panels` — the resizable pane mechanics (framework-agnostic core plus a React adapter, animated with motion). An **external npm package** developed in its own repo (`~/Projects/Own/motion-panels`), not a workspace package; the catalog pins the version. To test local changes, add a `pnpm-workspace.yaml` `overrides` entry (`link:` paths resolve from the workspace root; catalogs reject the protocol), `pnpm install`, restart Vite, and rebuild the package for each change — then **drop the override before merging**, or the branch installs a checkout CI does not have. It ships unstyled and has no `cn`, so the kit wraps it (`packages/ui/components/custom/resizable.tsx`) and the app imports those. Behaviour and rules in the `tamery-ui` skill.

## Dev commands

Setup and the command list live in `README.md` and the root `package.json`. Not obvious:

- `pnpm x` picks package + script; `pnpm run dev`'s picker takes `-a` to skip the prompt.
- Portless dev URLs live only while `dev` runs. In a linked git worktree portless prefixes the branch name, so worktrees run alongside the main checkout.
- `.env` files are gitignored and created by `scripts/setup-dev.ts` on install, never overwritten. A linked worktree copies them from the main checkout, because `.env.example` points at localhost services that don't run here. To resync a stale `.env`, delete it and re-run `bun scripts/setup-dev.ts`.
- Cross-service dev URLs are not in `.env` — `setupPortlessEnvs(...)` fills them at startup, worktree-aware, and each app declares its own env-key map. Precedence: existing env var > portless > declared default.

## Opening the running app in a browser

Two CLIs share one command vocabulary (`open`, `snapshot`, `click`, `fill`, `eval`, `console`), so the driving commands are the same either way — neither is an MCP server or a project dependency:

- **`agent-browser`** (install in `README.md`) — its own Chrome window. Trusts the portless CA, so portless HTTPS hosts load.
- **`terminal-browser`** (`brew install --cask terminal-browser`) — renders in a terminal pane (`terminal-browser open --split right`), driven with `terminal-browser action -- <agent-browser command>`. The user watches it live in their terminal and can take the pointer themselves.

**Which one is the user's call, not a default** — when the session runs in a terminal they are watching, say which you intend to use and let them redirect you; when there is no answer to be had, `agent-browser` is the safe pick. Dev app: `https://app.local.tamery.app`.

Either profile is **signed out**: anything behind auth needs the user's own Chrome (`mcp__claude-in-chrome__*`), since entering credentials is not an agent's to do. That is also the fallback when a binary is missing or the task needs their real profile. Playwright for scripted multi-step runs.

**The user's Chrome traps** — each one looks like an app bug and is not:

- The MCP tab usually sits behind another window with `visibilityState: hidden`. rAF never runs, so animations and CSS transitions freeze mid-way (computed colours included), rAF-scheduled opens stay shut (base-ui `Combobox.Trigger` on click; `ArrowDown` still opens it), and ⌘-hotkeys do nothing. Check the tab's visibility before calling a control broken.
- It shares localStorage with the user's own tab on the same origin: pane sizes and preferences changed there change theirs. Restore them, close the MCP tab when done, and ask the user to reload.
- A first-time chunk load can make Vite re-optimize deps mid-session and crash the page with `Cannot read properties of null (reading 'useMemoCache')`. That is a dev artifact: navigate to the same URL once and continue.

**A sandboxed/embedded browser pane cannot load portless HTTPS hosts** — every subresource is cancelled with `net::ERR_BLOCKED_BY_CLIENT` by the pane's own request layer (not TLS, CSP or service workers). Bare `http://localhost:<port>` works there.
