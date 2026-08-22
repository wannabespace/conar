# Agent instructions

Guidance for AI coding agents working in this repository. Auto-discovered as `AGENTS.md`; `CLAUDE.md` is a symlink to this file. Edit this file when changing the rules — do not duplicate the content elsewhere.

## Keep this file up to date

This file is the source of truth for Tamery's architecture, main logic, and conventions — keep it accurate. Whenever you change something it describes, update it in the same task. Update when you:

- Add, remove, or rename an app or package in the monorepo map
- Change dev commands, ports, or what `docker:start` spins up
- Add or change an architecture constraint (API layer, state, ORM, auth, secrets, runtime, styles)
- Add, remove, or change oRPC middlewares or the router pattern
- Rename or reshape a core domain concept (Connection, SyncType, collections, sync/GC lifecycle)
- Add or change a UI design rule — update the `tamery-ui` skill alongside the summary here
- Establish or refine **any** UI pattern, motion recipe, kit gotcha, or design decision during a task — record it in the `tamery-ui` skill in the same task, even when the summary here doesn't change. The skill is the living design system; improvements that stay only in code get lost. The skill is **split into topic files** (`.claude/skills/tamery-ui/`: `SKILL.md` index + hard rules, `colors.md`, `typography.md`, `patterns.md`, `motion.md`, `gotchas.md`, `reference.md`) to keep parallel edits conflict-free — append to the matching topic file, never grow `SKILL.md` beyond the hard rules and index.

If a claim here no longer matches the code, fix the claim — do not leave it stale.

## Update documentation when relevant

When you change behavior users rely on, update docs in the same task — do not leave them stale.

**Update when:**

- New or changed features, UI flows, CLI commands, or MCP behavior
- Connection setup, drivers, security, or connection-string handling
- Public APIs, auth, billing, plans, or account settings
- Renamed or removed user-visible concepts (update terminology everywhere)
- New MDX pages: register them in `docs/docs.json`

**Skip when:**

- Internal refactors with no user-visible change
- Tests, tooling, CI, or dev-only scripts
- Typo fixes in code comments or private types

**Where docs live:**

| Area                        | Location         |
| --------------------------- | ---------------- |
| Product docs (Mintlify MDX) | `docs/**/*.mdx`  |
| Doc nav                     | `docs/docs.json` |
| Doc authoring style         | `docs/AGENTS.md` |
| Repo setup / contribution   | `README.md`      |

After implementing a change: search `docs/` for pages covering the affected area, update them, and wire any new pages into `docs/docs.json`. Follow `docs/AGENTS.md` for Mintlify style (MDX frontmatter, active voice, sentence-case headings). Do not create or expand docs for changes the user explicitly scoped as code-only, unless they ask for documentation.

## What Tamery is

Tamery is an AI-powered desktop/web app for managing database connections. It stores connection metadata and encrypted connection strings locally (SQLite via OPFS) and optionally syncs metadata to the cloud.

## Domain terminology

Use these terms precisely; avoid the listed synonyms.

- **Connection** — a named, typed pointer to a database. Holds metadata (name, label, color, sync type, `workspaceId`) but not the raw connection string. _Avoid_: database, data source.
- **Connection String** — the full URL (including credentials) used to reach a database. Always stored encrypted; never sent to the cloud in plaintext. _Avoid_: credentials, DSN, URL.
- **Workspace** — a named group of connections, backed by Better Auth's `organization` plugin (remapped to `workspace` in `apps/api/lib/auth.ts`; tables `workspaces`/`members`/`invitations`, and `sessions.activeWorkspaceId`). Each user gets a default personal workspace (marked `{"default":true}` in `workspaces.metadata`, helpers in `@tamery/shared/workspace`): existing users got one via the `20260815215351_funny_expediter` data migration, which also backfilled `connections.workspaceId` and set it `NOT NULL`; new users get one lazily via `ensureDefaultWorkspace` in `apps/api/lib/workspace.ts` (wired through `databaseHooks.session.create.before`, with `connections.create` calling it as a fallback so the `NOT NULL` column always resolves). Creating additional workspaces goes through `orpc.workspaces.create` (gated by `subscriptionMiddleware`, publishing the insert like every other collection); Better Auth's own org-create endpoint stays gated by `allowUserToCreateOrganization`; org deletion is disabled (`disableOrganizationDeletion`) because the `connections.workspaceId` FK cascades — no delete flow exists yet. Sync stays per-user; the client scopes connections to the active workspace inside each `useLiveQuery` (`.where(eq(c.workspaceId, activeWorkspace.id))` — never a post-query `.filter()`, which would allocate a new array every render and break downstream memos). Non-React guards (`$resourceId`'s `beforeLoad`) compare against `getActiveWorkspace(workspacesCollection.toArray)` inline. Workspaces reach the client through `workspacesCollection` (SQLite + `orpc.workspaces.events`/`orpc.workspaces.sync`), not Better Auth's `useListOrganizations`, so the list survives going offline; the workspace entity splits into `sync.ts` (collection + `createWorkspace`, which sets the active id and awaits the row through `awaitChange`), `utils.ts` (storage value, `setActiveWorkspace`, pure resolvers) and `hooks.ts` (`useActiveWorkspace`), with `index.ts` a pure barrel; the active workspace is a per-device `localStorage` value (`tamery.active-workspace-id`, resolved against the collection in `useActiveWorkspace`) and is never pushed back to the session — the server does not read `sessions.activeWorkspaceId` at all; the column exists only because Better Auth's `organization` plugin requires the field (its own `setActive` endpoints may write it). Better Auth supports client-only active-organization management: its team endpoints resolve `body.organizationId || session.activeOrganizationId`, so invites and member lists just pass the active id explicitly (only `getActiveMember` is session-bound). `connections.create` accepts the client's `workspaceId` (membership-checked; anything else falls back to the user's default workspace) so connections created offline land in the workspace that was active on the device. Multi-member/invites are not built yet. _Avoid_: organization (in UI copy), team, project. Note: Better Auth's API still calls the logical field `activeOrganizationId`, which the schema remap maps to the `activeWorkspaceId` column.
- **Tab** — every view inside a connection resource is a tab: `table`, `runner`, `definitions`, `visualizer`. Tabs live in `connectionResourceStore.tabs` (`connectionTabType` in `entities/connection/store/tabs.ts`, a discriminated union on `type`), ordered by the tab strip and persisted per resource in `localStorage`. A tab's id is readable and self-describing, and is the single route path param: `table:<schema>:<table>` (percent-encoded parts, one tab per table), `definitions:<section>` (one per section), `visualizer` (singleton), `runner:<nanoid>` (the only multi-instance type — the tab strip's trailing `+` opens a fresh one on every click). Singleton ids are constants/derivations, so `openTab` finds the existing tab instead of adding a second one; only `runnerTabId()` mints a fresh id. `parseTabId` turns an id back into a tab, so a deep link to a never-opened table still works: the `$tabId` route parses the id in `beforeLoad` (pure — `beforeLoad` also runs on hover preload, so it must not touch the store) and the component's effect calls `ensureTab` + `setActiveTab`. Table tabs additionally carry `preview`: a single click in the sidebar opens a preview tab (italic, reused by the next preview), a double click promotes it. Every tab also carries an optional `title` — a user rename, set inline by double-clicking the tab in the strip or via its context menu (`renameTab`, cleared when the input is emptied or set back to the derived label); the strip falls back to the derived label (schema prefix / runner ordinal) when `title` is absent. Helpers (`openTab`, `openTableTab`, `openRunnerTab`, `openDefinitionsTab`, `openVisualizerTab`, `ensureTab`, `removeTab`, `renameTab`, `renameTableTab`, `updateTabs`) live in `entities/connection/store/helpers.ts` and return the tab id so callers can navigate straight to it. _Avoid_: page, view, screen.
- **Navigator** — the only sidebar (the old left icon rail is gone). It carries no action icons of its own — New SQL Runner is the tab strip's trailing `+` button, the query logger toggle and open-in-web both live in the app title bar's trailing cluster (`_protected/-components/protected-titlebar.tsx`, both only while a resource route is active; open-in-web additionally desktop + cloud non-localhost only), and its only chrome is the list switcher pinned above the search field (`-components/navigator/navigator-switcher.tsx`): one full-width row morphing between `Schema ›` and `‹ Tables`. Which list is up is **deliberately not persisted** — it lives in an in-memory `getNavigatorStore(resourceId)` (`setNavigator`, values `tables` | `definitions`) so every reload opens on Tables. The body swaps between the tables tree and the **Schema** list — its own filter field over grouped rows: Overview (Visualizer) / Structure / Types / Logic / Security (`-components/navigator/definitions-section.tsx`) — crossfading with a 12px slide (`AnimatePresence mode="popLayout"`). "Schema" is the user-facing name for that list; the tab ids and store value stay `definitions`/`visualizer`. Open/width live in `navigatorOpenValue`/`navigatorWidthValue` (`-components/navigator/constants.ts`); <kbd>Mod+B</kbd> toggles it.
- **SyncType** — controls how a connection's credentials are handled during cloud sync:
  - `Cloud` — metadata + encrypted password both synced to cloud.
  - `CloudWithoutPassword` — metadata synced; password kept local-only. Use when the user wants cross-device access without trusting the cloud with credentials.
  - `Local` — nothing leaves the device.
  - _Avoid_: sync mode, cloud mode.
- **Collections** — client data lives in TanStack DB collections, defined in `apps/app/src/entities/collections/index.ts`. There are seven: `connectionsCollection`, `connectionsResourcesCollection`, `connectionStringsCollection`, `chatsCollection`, `chatsMessagesCollection`, `queriesCollection`, `workspacesCollection`. All persist to SQLite (OPFS via `@tanstack/browser-db-sqlite-persistence`); the synced ones also stream from the cloud via oRPC event iterators (`syncCollectionOptions` in `~/lib/sync`).
- **Connections Collection** (`connectionsCollection`) — holds `Connection` rows. Backed by SQLite persistence plus a cloud sync stream (`orpc.connections.events` / `orpc.connections.sync`).
- **Connection Strings Collection** (`connectionStringsCollection`) — holds one `ConnectionString` row per `Connection`. Persisted to SQLite, no cloud sync. Populated on demand: `useConnectionStringsSync` runs a `createEffect` whose `onEnter` fires when a `Connection` enters `connectionsCollection`, resolves the string via `connectionStringsCollection.utils.resolve(id)` (cloud, else local decrypt), and inserts/updates the row.
- **Collections lifecycle** — `getCollections()` lazily creates the singleton set of collections and caches it in `current`; `cleanCollections()` drops it (`current = null`). `_protected` route's `beforeLoad` calls `getCollections()` and awaits `stateWhenReady()` for the core collections; `ProtectedLayout` calls `cleanCollections()` on unmount. TanStack DB GCs a collection's in-memory data when `activeSubscribersCount` stays at zero longer than `gcTime` (status becomes `cleaned-up`).

## Monorepo map

```
apps/
  api/       Hono + oRPC backend. Auth, connections, AI, queries, billing.
  app/       React SPA. Main product UI (TanStack Router + TanStack DB).
  main/      Marketing + auth pages (TanStack Start / Nitro SSR).
  desktop/   Electron wrapper around apps/app.
  proxy/     Hono + oRPC proxy. Executes DB queries on behalf of clients.
  cli/       CLI tool published as `tamery` on npm.

packages/
  db/           Drizzle schema + migrations for the cloud PostgreSQL DB.
  connection/   DB driver wrappers, connection-string parsers, SSL/SSH utils. No Drizzle.
  query-proxy/  oRPC router factory shared between apps/api and apps/proxy.
  ai/           Vercel AI SDK tool definitions and provider env helpers.
  ui/           Shared shadcn/base-ui React components and theme.
  table/        TanStack Virtual table component and hooks.
  shared/       Cross-package utils, enums, constants, types.
  infisical/    Secrets client wrapper (@tamery/infisical).
  configs/      Shared TypeScript configs.
```

The **proxy app** (`apps/proxy`) is a separate Hono process that executes DB queries. Clients connect to the proxy rather than having the main API execute queries directly. This isolates query execution and lets the proxy run closer to the user's databases (e.g. as a local desktop agent or self-hosted service).

## Dev commands

```bash
pnpm run docker:start       # Start local Postgres (tamery DB), Redis, and Infisical (secrets) via docker-compose.dev.yml
pnpm run drizzle:migrate    # Apply DB migrations (packages/db)
pnpm run drizzle:generate   # Generate migration from schema changes
pnpm run dev                # Package picker (all pre-selected — Enter accepts), then runs their dev script; `-a` skips the prompt
pnpm run test               # Bun unit tests
pnpm run test:e2e           # Playwright E2E
pnpm run check-types        # tsc on root scripts/ + configs, then turbo run check-types across workspace
pnpm run check              # Ultracite check (Oxlint + Oxfmt), read-only
pnpm run fix                # Ultracite fix (autofix lint + format)
pnpm x                      # Interactive picker: choose packages, then a script to run (scripts/run-script.ts)
```

`pnpm x` (`scripts/run-script.ts`) discovers workspace packages with `@manypkg/get-packages`, prompts via `@clack/prompts` for packages then a script, and runs `pnpm --filter … run <script>` (`--parallel` for multiple), or `turbo run` when the script is a `turbo.json` task. Scripts that invoke the runner itself (root `dev`, `x`) are excluded from discovery so selecting them cannot recurse. Flags: `-a`/`--all` (all packages), `-l`/`--last` (reuse last selection, cached in `node_modules/.cache/tamery-run.json`), `--no-turbo` (force pnpm), `-d`/`--dry-run` (print command only). A positional arg skips the script prompt; args after `--` are forwarded to the script.

Local URLs (via portless, requires `pnpm run dev`):

- `https://api.local.tamery.app`
- `https://app.local.tamery.app`
- `https://main.local.tamery.app`
- `https://proxy.local.tamery.app`

## Architecture constraints

| Topic | Rule |
| --- | --- |
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. Routers live in `apps/api/orpc/routers/`. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. |
| Cloud DB ORM | Drizzle (`packages/db`) — not raw SQL, not Prisma. |
| Auth | Better Auth (`apps/api/lib/auth.ts`) — not custom JWT, not NextAuth. |
| Secrets | Infisical via `@tamery/infisical` — not `.env` files in production. |
| Runtime | Bun — not Node for server processes. Node 22+ supported as fallback. |
| Testing | Bun test for unit tests. Playwright for E2E. |
| Styles | TailwindCSS v4 — no inline `style=` props for layout/theme values. |
| Page code | Files used by a single page live next to its route in `-`-prefixed folders (`-components/`, `-lib/`, `-utils/`). `entities/` is only for code shared across pages. |
| Connection routes | A connection resource has exactly two routes: `$resourceId/index.tsx` (empty state; redirects to `activeTabId` when that tab still exists) and `$resourceId/$tabId.tsx`, which switches on the parsed tab type. The layout `$resourceId.tsx` owns the rail, navigator, tab bar, and query logger. Tab bodies live in `$resourceId/-tabs/{table,runner,definitions,visualizer}/`; shared chrome in `$resourceId/-components/`. Runner state (query text, selected lines, results, chat id, layout) is per tab in `runnerPageStore({ resourceId, tabId })` and reached through `RunnerTabContext` (`useRunnerPageStore`, `useEditorQueriesComputed`, `useRunnerTab`) — never off the resource store. The visualizer keeps its pan/zoom per schema in `connectionResourceStore.visualizerViewports` (`setVisualizerViewport(resourceId, schema, viewport)`), restored via `defaultViewport` with `fitView` only as the first-visit fallback — it has no page store of its own, because its state is keyed by resource id alone, exactly like the resource store (the table and runner stores are keyed finer, so they stay separate). `visualizerViewports` is an **optional** key: seitu repairs a schema-invalid stored value against the defaults, and that repair drops any key whose stored `typeof` differs from the default's (`activeTabId`, a string over a `null` default), so adding a required key to `connectionResourceType` silently resets tabs state for existing users. |

## UI design rules

**Before writing or reviewing any UI (components, styles, popovers, menus, animations), load the `tamery-ui` skill** (`.claude/skills/tamery-ui/` — `SKILL.md` holds the hard rules plus an index of topic files; read every topic file the task touches). It encodes the owner's design decisions: the native macOS look, the three-level color system, typography tokens, motion recipes, and the UI kit's known traps.

Non-negotiables (enforced in review):

- **No `dark:` selectors** — colors come from theme tokens that resolve in both themes (`packages/ui/src/styles/globals.css`); fix the token choice, not the theme.
- **No pixel font sizes** (`text-[13px]`) — tokens only: `text-2xs` / `text-xs` / `text-sm` / `text-base`. Add rem tokens to `globals.css` if one is missing.
- **No `cursor-pointer`** — arrow cursor everywhere except text inputs and resize handles; `cursor-default` on link-based controls.
- **Three darkness levels** — `bg-body` canvas → `bg-background`/`bg-card` panes → `bg-input`/`bg-popover` controls; glass floating chrome is `bg-background/75-80` + `backdrop-blur-xl`.
- **Motion library for interactive animation** (interruptible; CSS transitions snap under frame drops), house curve `[0.32, 0.72, 0, 1]`, no layout shifts on hover.
- **No `sidebar-*` color tokens** — regular tokens everywhere (`bg-accent`, `text-foreground`, …).
- **No bare interactive icons** — every clickable icon gets a visible hover state and a tooltip.
- **Kit-level fixes** in `packages/ui` when a sizing/color problem is systemic.

Companion skills for deeper design work: `apple-design`, `emil-design-eng`, `design-an-interface`, `design-taste-frontend` (marketing/landing surfaces only — never app chrome) — `tamery-ui` wins on conflicts.

Per-file hygiene for touched UI files: `pnpm oxlint --fix <paths>` and `pnpm oxfmt <paths>` (lint enforces Tailwind class order and canonical class names). Never hand-edit `apps/app/src/routeTree.gen.ts` — the Vite plugin regenerates it.

**No code comments unless truly needed** (repo-wide). Write code that explains itself — clear names, small extracted functions, named constants. A comment is justified only for a non-obvious constraint the code cannot express (a workaround for an upstream bug, a deliberate trade-off, math whose intent isn't recoverable from the code). Never comment what the next line does, restate the obvious, or narrate a change.

## oRPC router pattern

Adding a new procedure:

```ts
// apps/api/orpc/routers/my-feature.ts
import { authMiddleware, orpc } from '~/orpc'
import { type } from '@orpc/server'

export const myProcedure = orpc
  .use(authMiddleware) // or subscriptionMiddleware, logMiddleware
  .input(type<{ id: string }>())
  .handler(async ({ input, context }) => {
    // context.user, context.session available after authMiddleware
    return { result: 'ok' }
  })
```

Then register in `apps/api/orpc/routers/index.ts`:

```ts
export const router = { ..., myFeature: { myProcedure } }
```

`create` procedures take **exactly one item** — never `type.or(schema, schema.array())`. Collection `onInsert` handlers fan out with `Promise.all(transaction.mutations.map(...))`, matching `onUpdate`/`onDelete`.

Available middlewares: `logMiddleware`, `authMiddleware`, `subscriptionMiddleware`, `optionalAuthMiddleware`, `optionalSubscriptionMiddleware`, `cacheMiddleware(ttl)`.

Clients call procedures via the generated `ORPCRouter` type — no manual fetch calls.

## Secrets / environment

- `apps/api/env.ts`, `apps/proxy/env.ts` etc. validate env vars with ArkType.
- Encryption secrets are stored in Infisical at path `['users', userId]` and created in `databaseHooks.user.create.after`.
- Connection strings are encrypted per **workspace**, not per requester: `getWorkspaceSecret(workspaceId)` (memoized 5 min, on context after `authMiddleware`) resolves the workspace's owner member and reads that owner's secret. Every decrypt path passes the row's own `workspaceId` (`connections` list/sync/resolve/update/create, `internal/proxy`), so a shared workspace will decrypt with one key once invites ship. Moving the secret itself to `['workspaces', workspaceId]` only changes that lookup — no call site moves.

# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `pnpm dlx ultracite fix`
- **Check for issues**: `pnpm dlx ultracite check`
- **Diagnose setup**: `pnpm dlx ultracite doctor`

Oxlint + Oxfmt (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**

- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**

- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**

- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Oxlint + Oxfmt Can't Help

Oxlint + Oxfmt's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Oxlint + Oxfmt can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Oxlint + Oxfmt. Run `pnpm dlx ultracite fix` before committing to ensure compliance.
