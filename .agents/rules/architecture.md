# Architecture constraints

| Topic | Rule |
| --- | --- |
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. Live queries are `useLiveQuery({ query })`; `queryKey` only for `.fn.where`/opaque queries or a measured hot path. |
| Table page state | Two seitu stores per `{id, schema, table}`: `tablePageStore` (localStorage) and `tableSessionStore` (memory). **Selection and drafts never persist** — they are large, change per click, and every cell subscribes, so persisting them makes each notify re-read and re-compare the stored JSON. |
| Persisted collections | `persistedCollectionOptions` takes `schemaVersion: PERSISTED_SCHEMA_VERSION`, never a literal — mixed versions reset each other's tables on every boot. Bump the const to invalidate all local data. |
| Cloud DB ORM | Drizzle (`packages/db`) — not raw SQL, not Prisma. |
| Permissions | Permix, defined once in `packages/shared/permissions.ts`: `permissionsOf({ subscription, user })` maps the user and their active subscription to rules (anonymous = guest, else subscription = pro, else free). Server procedures `.use(permissionsMiddleware)` then `permix.checkMiddleware('<entity>.<action>')`, or check `context.permissions` inline when the refusal needs its own declared error. The client instance (`core/user/permissions.ts`) starts as Pro and `usePermissionsSync` sets the real rules once the session arrives (a pending subscription counts as Pro) — nothing is persisted, so a guest's locked controls show undimmed for a moment after boot; a route guard that gates guests awaits `loadGuestPermissions()` first, since it runs before that effect. **Render reads `usePermissions().check`** (a plain `permix.check` in render never sees the real access arrive); `permix.check` is for actions, route guards and lazily built menus. Only user/plan grants live here — what a database engine supports stays the `capabilities.ts` record. |
| Auth | Better Auth — not custom JWT, not NextAuth. Client plugins come from `better-auth/client/plugins` or a plugin's own subpath; `better-auth/plugins` is the **server** barrel and drags the schema builders into the browser. |
| Secrets | Infisical via `@tamery/infisical` — not `.env` files in production. |
| Runtime | Bun — not Node for server processes. Node 22+ supported as fallback. |
| Testing | Bun test for unit tests, Playwright for E2E. |
| Schemas | ArkType everywhere — oRPC inputs, env validation, stores, **form validators** (`validators: { onChange: schema, onMount: schema }`; TanStack Form reads the issues only, so a schema covering the checked fields is enough, and `.configure({ message })` replaces ArkType's generated wording). Zod is legacy, surviving only inside frozen chat v1 (`api.md`). |
| UI components | shadcn registry first — search before writing markup, vendor missing pieces into `packages/ui` in kit style. Hand-rolled re-implementations are a review blocker (`tamery-ui` skill, hard rule 0). |
| Markdown | Kit `Response` (streamdown) — never react-markdown or a bespoke pipeline. |
| Ids | uuid v7 everywhere (`baseTable.id`). A library that mints its own format is mapped in the persistence layer, never by widening a column. |
| Styles | TailwindCSS v4 — no inline `style=` for layout or theme values, except where a library hard-codes inline styles no class can beat. |
| Memoization | React Compiler is on in `apps/app` + `apps/main` and reaches `packages/*`. No `useMemo`/`useCallback` — derive inline. **The compiler bails out of any component calling TanStack Virtual's `useVirtualizer` directly**, so never import it: use the `@tamery/ui/hooks/use-virtualizer` wrapper, which isolates the bailout behind `'use no memo'`. Verify a suspected bailout by running `babel-plugin-react-compiler` on the file with a `logger`, not by reading source. |
| Feature code | A feature is a module folder (see Modules). Core single-page files live next to the route in `-`-prefixed folders (`-components/`, `-lib/`, `-utils/`); `core/<domain>/` holds data and code shared across modules (see Core layout). |

## Modules

`apps/app` and `apps/main` are a core plus `src/modules/<name>/` folders. **Deleting a module folder removes the feature and the app still compiles** — that is the contract every change keeps.

- Modules are found by eager `import.meta.glob`, never listed anywhere. Core is everything outside `src/modules/`.
- **A module imports only core and its own folder** (`src/lib/modules.test.ts` fails otherwise). Code two modules need moves into core; core never names a module. Cross-feature wiring goes through a slot or a core contract (table tab ids in `core/tabs/ids.ts`, `definitionKey`, `lib/panels.ts`).
- **Never read a registry at module top level.** The globs import every module eagerly, and modules import the registries back, so a registry's value exists only once evaluation finishes — read it inside a function or render.
- A module owns its state under its own storage key. The resource store keeps only `activeTabId`, `tabs` and `showSystem`.
- `apps/app` contracts are `src/lib/module.ts`, one entry file per host, each globbed where that host's chunk loads:
  - `module.ts` — the entry chunk, so it must stay off `lib/database`: tab kinds, schema items, new-tab actions, root mounts.
  - `protected.tsx` — the signed-in layout: titlebar items, banners, mounts, command-palette entries.
  - `workspace.tsx` — the connection workspace: panels (one per region), tab views, header, tab-bar items, empty pane, the FK reference table.
  - `collections.ts` — a factory whose keys augment `Collections` in `core/collections`.
- `apps/main` contracts are `src/lib/module.ts`: `module.tsx` fills header/footer links, the auth footer, account nav and home sections. A module's pages live in its own `routes/`, mirroring where they mount (`routes/account/billing.lazy.tsx` nests under `/account`); `vite.config.ts` mounts every `modules/*/routes` through `virtualRouteConfig`, read once at startup, so restart dev after adding or deleting one.

## Core layout (`apps/app/src/core`)

One folder per domain; a file goes in the domain it is about, never in a technical bucket. Infrastructure with no domain stays in `lib/`, generic UI in `components/`.

| Folder | Holds |
| --- | --- |
| `collections.ts` | The collection registry modules augment |
| `workspace/`, `user/` | Workspace records and hooks; the user's subscription |
| `connection/` | Connection and resource records, connection strings, fetching and password gating, the connection and resource stores, icon, resource link |
| `runtime/` | Running SQL: `createQuery`, the proxy, per-engine Kysely dialects, the query log |
| `catalog/` | Per-engine vocabulary: capabilities, column types, definition sections, definition keys, table types |
| `queries/<subject>/` | One file per catalog or row statement (see below) |
| `tabs/` | Tab ids, kind resolution, open/close/rename actions |
| `table/` | Data-grid cells, the table session store, the table and column forms |
| `transformers/` | Per-type value display and parsing |
| `codegen/` | Generating SQL and ORM/type code from columns |

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

Exactly two routes: `$resourceId/index.tsx` (empty state, redirecting to the active tab when it still exists) and `$resourceId/$tabId.tsx`, which resolves the id through the registered tab kinds (`core/tabs/kinds.ts`) and renders that kind's `workspace.tsx` view; the layout renders the registered panels by region and the header. Runner state is per **tab** (`runnerPageStore({ resourceId, tabId })` via `RunnerTabContext`), never off the resource store. The visualizer has no page store — its state is keyed by resource id alone: persisted viewport and node positions on its own store (`modules/visualizer/lib/positions.ts`), pending DDL drafts in a memory seitu store per resource (`modules/visualizer/lib/drafts.ts`) that survives closing the tab but not an app reload, since a draft is a statement nobody has run. A new key on `connectionResourceType` can be required: seitu repairs a schema-invalid stored value by filling missing keys from the defaults and keeping every stored key whose `typeof` matches, so existing tabs survive. Changing an existing key's `typeof` does drop that key.

## Connection introspection queries

`core/queries/<subject>/` — one folder per thing the UI edits, plus `shared/` for what crosses subjects. Inside a folder the subject prefix is dropped and **every query is its own file** (`list.ts`, `create.ts`, `drop.ts`, `rename.ts`, `recreate.ts`), each exporting one `<verb><Subject>Query`; the statement builders they share sit in `shape.ts` (`dialects.md`). **No barrels** — import the leaf file. A helper used by two subjects moves to `shared/`; a subject folder never imports another subject's. Query files hold queries only: a feature that saves several objects at once (the visualizer's Apply) picks and sequences the queries in its own route code.

Each file is one statement, as a `createQuery` covering every dialect — what a dialect that cannot run it does is `dialects.md`. To run several queries atomically, open `transaction(queryParams)` from `runtime/query.ts` and pass its `tx` as `run`'s second argument.

- **A catalog query that returns one row per column must ORDER BY key position.** The definitions sections rebuild `CREATE INDEX`/`ADD CONSTRAINT` from the arrival order of those rows, so an unordered join hands back `(a, b)` for an index declared `(b, a)`. Each engine has its own ordering column, and SQL Server's also excludes `INCLUDE` columns.
- User-authored SQL expressions (a policy's `USING`, a function body) go through `sql.raw` like a runner query; every identifier and value a *form* produces goes through `sql.id`/`sql.lit`.
- A `memoize`d query factory takes the values its SQL reads, not the whole `ConnectionResource` — memoza keys structurally, so the record means a fresh entry on every unrelated field change. The `...QueryOptions` wrapper is not worth memoizing unless it carries a `select` whose identity must hold.
- The query client defaults to `placeholderData: keepPreviousData`, so on a connection switch a resource-keyed query paints the previous connection's data. Where that is visible (the navigator tree), `placeholderData` drops the previous data unless the resource id matches, so the skeleton shows instead; the smoothing still applies to same-resource key changes.

## Reach for the library before writing machinery

Retry, fallback, queueing, ordering, id generation, streaming state — if a dependency owns the concern, use its API. Genuinely unsupported → drop the feature, move to a provider that does it, or ask; **not** hand-roll a wrapper.

- **A cast is a smell.** Model the shape in ArkType instead of `as` — a schema deletes both the cast and the validation gap. A surviving cast sits at a wire boundary with a comment saying why.
- **Numbers need a reason.** A magic bound gets a comment explaining the trade-off; no reason → no constant.
- **Simplify on the way out.** A hook keeping cached state + a comparison key + a stale guard usually wants one derived value; two render paths for the same content usually want one normalized shape.
