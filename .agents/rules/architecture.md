# Architecture constraints

| Topic | Rule |
| --- | --- |
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. Live queries are `useLiveQuery({ query })`; `queryKey` only for `.fn.where`/opaque queries or a measured hot path. |
| Table page state | Two seitu stores per `{id, schema, table}`: `tablePageStore` (localStorage) and `tableSessionStore` (memory). **Selection and drafts never persist** — they are large, change per click, and every cell subscribes, so persisting them makes each notify re-read and re-compare the stored JSON. |
| Persisted collections | `persistedCollectionOptions` takes `schemaVersion: PERSISTED_SCHEMA_VERSION`, never a literal — mixed versions reset each other's tables on every boot. Bump the const to invalidate all local data. |
| Cloud DB ORM | Drizzle (`packages/db`) — not raw SQL, not Prisma. |
| Permissions | Permix, defined once in `packages/shared/permissions.ts`: `permissionsOf({ subscription, user })` maps the user and their active subscription to rules (anonymous = guest, else subscription = pro, else free). Server procedures `.use(permissionsMiddleware)` then `permix.checkMiddleware('<entity>.<action>')`, or check `context.permissions` inline when the refusal needs its own declared error. The client instance (`core/user/permissions.ts`) has no rules until `loadPermissions()`, which the `_protected` guard awaits before anything renders. **Render reads `usePermissions().check`** (a plain `permix.check` in render never sees the real access arrive); a press on a locked control goes through `checkOrUpgrade(path, data?)`, which prompts a guest to sign in or opens the subscription dialog for a member; plain `permix.check` is for route guards and lazily built menus. Only user/plan grants live here — what a database engine supports stays the `capabilities.ts` record. Metered free-plan features (AI filters, MCP) take their weekly limit from `FREE_WEEKLY_LIMITS` (`@tamery/shared/usage`), count in Redis through `usage` (`apps/api/lib/usage.ts`), and report through the `usage.get` endpoint (`usage.record` counts what the client runs itself); that file maps each feature to its `unlimited` permission, which skips the count and reports `null`. |
| Auth | Better Auth — not custom JWT, not NextAuth. The client session is mirrored to `localStorage` and fed back through `hydrateSession` at boot (`lib/auth.ts`), so a signed-in user boots offline; read it via `getSessionUser`, not `authClient.getSession`, which always hits the network. Client plugins come from `better-auth/client/plugins` or a plugin's own subpath; `better-auth/plugins` is the **server** barrel and drags the schema builders into the browser. |
| Secrets | Infisical via `@tamery/infisical` — not `.env` files in production. |
| Runtime | Bun — not Node for server processes. Node 22+ supported as fallback. |
| Testing | Bun test for unit tests, Playwright for E2E. |
| Schemas | ArkType everywhere — oRPC inputs, env validation, stores, **form validators** (`validators: { onChange: schema, onMount: schema }`; TanStack Form reads the issues only, so a schema covering the checked fields is enough, and `.configure({ message })` replaces ArkType's generated wording). Zod survives only inside frozen chat v1 (`api.md`) and in MCP tool schemas, the only kind the MCP SDK's `registerTool` accepts. |
| UI components | shadcn registry first — search before writing markup, vendor missing pieces into `packages/ui` in kit style. Hand-rolled re-implementations are a review blocker (`tamery-ui` skill, hard rule 0). |
| Markdown | Kit `Response` (streamdown) — never react-markdown or a bespoke pipeline. |
| Ids | uuid v7 everywhere (`baseTable.id`). A library that mints its own format is mapped in the persistence layer, never by widening a column. |
| Styles | TailwindCSS v4 — no inline `style=` for layout or theme values, except where a library hard-codes inline styles no class can beat. |
| Memoization | React Compiler is on in `apps/app` + `apps/main` and reaches `packages/*`. No `useMemo`/`useCallback` — derive inline. **The compiler bails out of any component calling TanStack Virtual's `useVirtualizer` directly**, so never import it: use the `@tamery/ui/hooks/use-virtualizer` wrapper, which isolates the bailout behind `'use no memo'`. The compiler also skips a `use*` function that calls no hooks — mark it `'use memo'` when its return values feed props or context. Verify a suspected bailout by running `babel-plugin-react-compiler` on the file with a `logger`, not by reading source. |
| Analytics | PostHog through the lazy `~/lib/posthog` facade. A user-facing `useMutation` names its event in `meta: { event: 'object_verb' }` and the `queryClient` mutation cache captures it with `success`; other actions call `posthog.capture` directly. Properties carry enums and counts only — never SQL, names, values or error messages (privacy policy promises anonymized events). The user can turn analytics off (Settings → Privacy, `analyticsStore`): the facade then never loads posthog-js, and a client already loaded is opted out, since its autocapture and session recording bypass the facade — so nothing may import posthog-js except the facade. |
| Feature code | A feature is a module folder (see Modules). Core single-page files live next to the route in `-`-prefixed folders (`-components/`, `-lib/`, `-utils/`); `core/<domain>/` holds data and code shared across modules (see Core layout). |

## Modules

`apps/app` and `apps/main` are a core plus `src/modules/<name>/` folders. Core is everything outside `src/modules/`.

- **No registries.** Whoever renders or runs a feature imports it directly from the module file that defines it — a titlebar button in the titlebar, a panel in the workspace layout, a command in the actions center, a tab kind in `core/tabs/kinds.ts`, a tab view in `core/tabs/views.ts`, a collection in `core/collections.ts`. Deleting a module means deleting its folder and those imports. Never add an `import.meta.glob` module loader or a slot array: it hides the wiring from find-references.
- **Import where the chunk loads.** A module's import lands in its importer's chunk, so wire a feature from the layout that shows it (root, `_protected`, the connection workspace); anything reachable from the entry must stay off `lib/database`.
- A module owns its state under its own storage key. The resource store keeps only `activeTabId`, `tabs` and `showSystem`.
- In `apps/main`, a module's pages live in its own `routes/`, mirroring where they mount (`routes/account/billing.lazy.tsx` nests under `/account`), and each module's `routes/` folder is listed in `vite.config.ts`'s `virtualRouteConfig`.

## Core layout (`apps/app/src/core`)

One folder per domain; a file goes in the domain it is about, never in a technical bucket. Infrastructure with no domain stays in `lib/` (clients, singletons, contracts); stateless helpers with no domain go in `utils/`. `components/` holds only app-global UI that belongs to no feature (app chrome, menus, empty states); UI that several modules share for one feature goes in that feature's core folder. Core holds only what more than one route or module uses: a page's own UI lives in its route file (or a `-components/` folder beside it), never in core.

| Folder | Holds |
| --- | --- |
| `collections.ts` | Every synced collection, core and module alike |
| `workspace/`, `user/` | Workspace records and hooks; the user's subscription |
| `connection/` | Connection and resource records, connection strings, fetching and password gating, the connection and resource stores, icon, resource link, refreshing a resource's cache after a statement runs |
| `runtime/` | Running SQL: `createQuery`, the proxy, per-engine Kysely dialects, the query log |
| `catalog/` | Per-engine vocabulary: capabilities, column types, definition sections, definition keys, table types; the drop confirmation dialog |
| `queries/<subject>/` | One file per catalog or row statement (see below) |
| `tabs/` | Tab ids, kind resolution, open/close/rename actions, the tab refresh button |
| `table/` | Data-grid cells, the table session store, the table and column forms |
| `drafts/` | The staged-changes review drawer and discard button the table and visualizer share |
| `transformers/` | Per-type value display and parsing |
| `codegen/` | Generating SQL and ORM/type code from columns |
| `export/` | Copying and downloading rows as CSV, JSON or Markdown, shared by the table and runner |
| `settings/` | The core Settings sections (one file per page) and the `SettingsGroup`/`SettingsRow` every section is built from. `sections.ts` lists every page, module pages included, each carrying its `component`, rendered by the single `routes/_protected/settings/$section.tsx` route, which 404s on an unlisted slug |

## ArkType config ordering

Every app's entry imports `@tamery/shared/arktype-config` first. ArkType scopes snapshot that config at construction, so `configure()` must run before the `arktype` module body. Source import order suffices for the Bun apps, but bundlers hoist cross-chunk imports above the importing chunk's body — so in `apps/app` the real entry is `src/entry.ts`: configure, then `import('./main')`. The dynamic import *is* the ordering guarantee; never make `main.tsx` the entry.

## App startup graph (`apps/app`)

- `lib/database.ts` opens the OPFS wa-sqlite database in a **top-level await**, so anything transitively importing it waits for WASM + OPFS before evaluating. Anything reachable from `main.tsx`/`routeTree.gen.ts` blocks first paint, signed-out users included.
- Route modules are all imported eagerly by the generated tree and the splitter only moves `component`/`loader`, so `beforeLoad` and its imports stay eager. Keep the data layer off that path: reach collections through the parent route's context, `await import()` them inside `beforeLoad`, and import the leaf module that owns the symbol (`core/*` has no barrels — `code-style.md`).
- `core/queries` and `core/runtime` must stay acyclic: `queries/*` call `createQuery` at module scope, so a cycle back into `runtime/query.ts` surfaces as `Cannot access 'createQuery' before initialization`. Shared config therefore lives in leaf modules that reach no queries. `import/no-cycle` enforces this repo-wide.
- `main.tsx` exports nothing — it only creates the router and renders. Shared singletons live in leaves so no route or `lib/*` module imports the entry; library code that needs the current URL or a redirect uses the stored history, never the router instance (components use `useRouter()`).
- The window paints app chrome before any of that: `src/shell.tsx` is server-rendered into `index.html` markers by `@tamery/vite-inline-html/react`, wired in `vite.config.ts` for dev and build alike. Design rules in the `tamery-ui` skill.
- `src/lib/warmup.ts` is the entry's first import and the only module that deliberately kicks off heavy chunks. Monaco and `lib/database` must never be static-imported from the entry; posthog-js stays behind its lazy facade. Import faker from `@faker-js/faker/locale/en`, never the all-locales barrel.
- Verify by walking the dev module graph from `/src/main.tsx`, not by reading imports.

## Connection routes

Exactly two routes: `$resourceId/index.tsx` (empty state, redirecting to the active tab when it still exists) and `$resourceId/$tabId.tsx`, which resolves the id through the tab kinds in `core/tabs/kinds.ts` and renders that kind's view from `core/tabs/views.ts`; the layout renders the navigator, query-logger and chat panels and the tab bar. Runner state is per **tab** (`runnerPageStore({ resourceId, tabId })` via `RunnerTabContext`), never off the resource store. The visualizer has no page store — its state is keyed by resource id alone: persisted viewport and node positions on its own store (`modules/visualizer/lib/positions.ts`), pending DDL drafts in a memory seitu store per resource (`modules/visualizer/lib/drafts.ts`) that survives closing the tab but not an app reload, since a draft is a statement nobody has run. A new key on `connectionResourceType` can be required: seitu repairs a schema-invalid stored value by filling missing keys from the defaults and keeping every stored key whose `typeof` matches, so existing tabs survive. Changing an existing key's `typeof` does drop that key.

## Connection introspection queries

`core/queries/<subject>/` — one folder per thing the UI edits, plus `shared/` for what crosses subjects. Inside a folder the subject prefix is dropped and **every query is its own file** (`list.ts`, `create.ts`, `drop.ts`, `rename.ts`, `recreate.ts`), each exporting one `<verb><Subject>Query`; the statement builders they share sit in `shape.ts`, or a `shape/` folder once it outgrows one file (`dialects.md`). A helper used by two subjects moves to `shared/`; a subject folder never imports another subject's. Query files hold queries only: a feature that saves several objects at once (the visualizer's Apply) picks and sequences the queries in its own route code.

Each file is one statement, as a `createQuery` covering every dialect — what a dialect that cannot run it does is `dialects.md`. To run several queries atomically, open `transaction(queryParams)` from `runtime/query.ts` and pass its `tx` as `run`'s second argument.

- **A catalog query that returns one row per column must ORDER BY key position.** The definitions sections rebuild `CREATE INDEX`/`ADD CONSTRAINT` from the arrival order of those rows, so an unordered join hands back `(a, b)` for an index declared `(b, a)`. Each engine has its own ordering column, and SQL Server's also excludes `INCLUDE` columns.
- User-authored SQL expressions (a policy's `USING`, a function body) go through `sql.raw` like a runner query; every identifier and value a *form* produces goes through `sql.id`/`sql.lit`.
- A `memoize`d query factory takes the values its SQL reads, not the whole `ConnectionResource` — memoza keys structurally, so the record means a fresh entry on every unrelated field change. The `...QueryOptions` wrapper is not worth memoizing unless it carries a `select` whose identity must hold.
- `queryClient` runs queries and mutations with `networkMode: 'always'`: most of them reach the user's database, often a local one (Electron IPC, the web build's local proxy), so the browser's offline state must not pause them. **A query that calls the Tamery API sets `networkMode: 'online'`** — otherwise it fires offline and, under `throwOnError`, fails into the error boundary. `subscriptionQueryClient` holds only API queries and keeps the default.
- The query client defaults to `placeholderData: keepPreviousData`, so on a connection switch a resource-keyed query paints the previous connection's data. Where that is visible (the navigator tree), `placeholderData` drops the previous data unless the resource id matches, so the skeleton shows instead; the smoothing still applies to same-resource key changes.

## MCP server (desktop)

`apps/desktop/src/main/lib/mcp.ts` serves MCP over HTTP on `127.0.0.1:PORTS.MCP`, on by default unless turned off in Settings.

- **The main process holds no connections.** Connections, the key that decrypts their strings and the query runtime live in the renderer, so main only serves HTTP, checks the token, registers tools and forwards each call over a `MessageChannelMain` port to the windows in turn until one answers, through the `McpSource` the `mcp` module serves (`@tamery/shared/mcp`). A window with no source (signed out, still loading) replies idle rather than leaving the request hanging.
- **An MCP call is an ordinary app query** — through `connection(Resource)ToQueryParams`, so proxy routing, `fetchingConfig` gating, the query logger and cancellation apply unchanged. Schema tools reuse the app's catalog `queryOptions` with a few-second `staleTime`, since the app's cache is otherwise infinite and an agent often migrates from its own shell. `execute` goes through `statementQuery` and `refreshAfterRun`, the runner's own path.
- **Agents add connections, never change them**: `create_connection` goes through `createConnection` (`core/connection/create.ts`), the create page's own path, after `testConnectionQuery`; no tool edits, renames or removes a connection.
- **Access is per connection, per device, and main is the only gate**: one `McpAccess` per connection in main's store (`off`, `read`, `ask`, `write`; absent means `ask`), and main refuses a call the access does not allow before asking a window, so the window runs whatever it is asked. `execute` is always registered and access is read on every call, since a session's server outlives an access change.
- **Nothing an agent sends runs before an `ask` is approved**, and approval happens in the window, never in main. The only query before it is the planner's row estimate (`estimateQuery`), an `EXPLAIN` of a single statement that opens with a data verb, so no `ANALYZE` or procedure call can make the statement execute; it is cancelled after a few seconds, since a lock can stall it on the pool's only connection. Planning can still call a function the statement names — Postgres evaluates `IMMUTABLE` and `STABLE` ones, MySQL a stored function with constant arguments — so a function already in the database can act before approval. Accepted: Postgres plans read-only, both engines roll back, so only an effect outside the transaction survives, and an agent cannot create such a function without an approved write. MySQL's estimate takes the plan row of a target alone in its join and is empty otherwise, since a joined row counts per row of the tables before it. A rollback is not a safe preview: SQL Server's batch can `COMMIT` mid-statement, and `COPY … TO PROGRAM`, `dblink` or `INTO OUTFILE` act outside the transaction.
- **Read-only is two layers**: `readsOnly` (`@tamery/sql`) admits one statement that starts with a read verb and carries no write, permission, transaction-control or session word and no listed side-effect function (`dblink`, `OPENQUERY`, advisory locks, `GET_LOCK`), then the transaction itself is read-only (ClickHouse: `readonly=2`; SQL Server: none) and always rolled back. The access mode only stops writes to the connected database — a function can still reach another server, hold a lock or signal another session — and the check is a denylist, so a hard guarantee on any engine needs a read-only database login.
- **Sessions are the SDK's stateful Streamable HTTP mode**, one transport and server per session, kept in memory: a restart or half an hour idle drops them and clients start a new session on the 404. A client that drops its HTTP request never sends `notifications/cancelled`, so main sends it for them and the tool call's signal aborts. Clients are known only by the name they report at `initialize`, so that name is never an access control — the token is.
- **Free plans get `FREE_WEEKLY_LIMITS.mcp` runs of `query` and `execute` a week, counted only by the API** (`modules/mcp/usage.ts`): each run checks the account's `usage.get` and reports through `usage.record`, which returns the fresh quota into the same cache. With the API unreachable a run is neither checked nor counted — fail open, so local connections keep working offline. A refused call opens the limit dialog.
- Requests need the bearer token stored beside the toggle; without it any local process or a DNS-rebound web page could query the user's databases.

## Reach for the library before writing machinery

Retry, fallback, queueing, ordering, id generation, streaming state — if a dependency owns the concern, use its API. A well-known format or algorithm (CSV/TSV, diff, glob, semver) goes to a small, maintained package rather than a hand-written parser; adding the dependency is the user's call, so propose it. Genuinely unsupported → drop the feature, move to a provider that does it, or ask; **not** hand-roll a wrapper.

What already owns a concern here — a dependency resolves only in a workspace that declares it:

| Hand-rolled | Owner |
| --- | --- |
| An effect copying fetched or derived data into `useState` | Derive inline; TanStack Query `select`; `useLiveQuery` |
| Loading / error / pending flags around a call | `useQuery` / `useMutation` state |
| An async function cached by its arguments | `memoize` (`memoza`) |
| UI state shared across components or persisted locally | seitu `createStore` / `createWebStorageValue`, read with `useSubscription` |
| A `keydown` listener or container `onKeyDown` | `useHotkey` / `useHotkeys` (`@tanstack/react-hotkeys`) |
| An app-wide event (save, refresh pressed) | `globalHooks` (`~/lib/global-hooks`, hookable) |
| `try`/`catch` returning a fallback, or an empty `catch` | `tryCatch` / `tryCatchAsync` / `silently` (`@tamery/shared/utils`) |
| A runtime check followed by `as` | An ArkType schema |
| `pick`, `omit`, typed `Object.entries`, list equality, case-insensitive search, push-if-absent | `@tamery/shared/utils` (`pick`, `omit`, `objectEntries`, `sameList`, `matchesSearch`, `pushUnique`) |
| `n === 1 ? '' : 's'` | `plural` (`~/utils/plural`) |
| CSV / TSV | `d3-dsv` |
| Identifier casing | `change-case` |
| Date math or formatting | `date-fns`, `@date-fns/tz` for zones |
| SQL pretty-printing | `formatSql` (`~/utils/formatter`) |
| A long list | `@tamery/ui/hooks/use-virtualizer` |
| Scroll pinned to the bottom | `use-stick-to-bottom` |
| An animated number | Kit `NumberFlow` |
| A class string switched on props | A `cva` variant in `<component>.utils.ts`, `cn` at the call site |
| Markup a registry component covers | The kit, else `pnpm dlx shadcn@latest search @shadcn -q <term>` |
