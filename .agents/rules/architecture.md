# Architecture constraints

| Topic | Rule |
| --- | --- |
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. Live queries: `useLiveQuery({ query })` — identity is derived from structured IR, so drop the deprecated `(fn, deps)` form. `queryKey` only for `.fn.where`/opaque queries or a measured hot path. |
| Table page state | Two seitu stores per `{id, schema, table}`: `tablePageStore` (localStorage: filters, order, sizes, hidden columns) and `tableSessionStore` (memory: `selected`, `drafts`, shift-selection). Selection and drafts never persist — they are large and change per click, and every cell subscribes; persisting them made each notify re-read and re-compare the stored JSON. |
| Persisted collections | `persistedCollectionOptions` takes `schemaVersion: PERSISTED_SCHEMA_VERSION` (`lib/sync.ts`) — never a literal: mixed versions reset each other's tables on every boot. Bump the const to invalidate all local data. |
| Cloud DB ORM | Drizzle (`packages/db`) — not raw SQL, not Prisma. |
| Auth | Better Auth — not custom JWT, not NextAuth. Client plugins come from `better-auth/client/plugins` or a plugin's own subpath — `better-auth/plugins` is the **server** barrel and drags the schema builders into the browser. |
| Secrets | Infisical via `@tamery/infisical` — not `.env` files in production. |
| Runtime | Bun — not Node for server processes. Node 22+ supported as fallback. |
| Testing | Bun test for unit tests. Playwright for E2E. |
| Schemas | ArkType everywhere — oRPC inputs, env validation, stores. Zod is legacy, survives only inside frozen chat v1 (`api.md`). Config ordering below. |
| UI components | shadcn registry first — search before writing markup, vendor missing pieces into `packages/ui` in kit style. Hand-rolled re-implementations are a review blocker; details in `tamery-ui` skill (hard rule 0). |
| Markdown | Kit `Response` (streamdown) — never react-markdown or a bespoke pipeline. Behavior + setup traps in `tamery-ui` skill. |
| Ids | uuid v7 everywhere (`baseTable.id`). Library mints its own format → map in persistence layer, never widen a column. |
| Styles | TailwindCSS v4 — no inline `style=` for layout/theme values. Exceptions only where a library hard-codes inline styles that no class can beat (`tamery-ui` gotchas). |
| Memoization | React Compiler on in `apps/app` + `apps/main` vite configs, reaches `packages/*` (workspace sources resolve outside `node_modules`). No `useMemo`/`useCallback` — derive inline; `react/jsx-no-constructed-context-values` off for same reason. Caveat: compiler skips any component calling TanStack Virtual's `useVirtualizer` directly (incompatible-library bailout, enforced by `react/incompatible-library` lint) — never import it; use the `@tamery/ui/hooks/use-virtualizer` wrapper, which isolates the bailout behind `'use no memo'`. Verify a suspected bailout by running `babel-plugin-react-compiler` on the file with a `logger`, not by reading source. |
| Page code | Single-page files live next to the route in `-`-prefixed folders (`-components/`, `-lib/`, `-utils/`). `entities/` only for code shared across pages. |

## ArkType config ordering

Every app's entry imports `@tamery/shared/arktype-config` first (`exactOptionalPropertyTypes: false`, so `'k?': 'string'` accepts an explicit `undefined`). ArkType scopes snapshot that config at construction, so `configure()` must run before the `arktype` module body. Source import order suffices for the Bun apps, but bundlers hoist cross-chunk imports above the importing chunk's body, so in `apps/app` the real entry is `src/entry.ts`: configure, then `import('./main')` — the dynamic import is the ordering guarantee; never make `main.tsx` the entry.

## App startup graph (`apps/app`)

- `lib/database.ts` opens the OPFS wa-sqlite database in a **top-level await** — `lib/sync.ts`, every collection, and anything transitively importing it waits for WASM + OPFS before evaluating. Anything reachable from `main.tsx`/`routeTree.gen.ts` blocks first paint, for signed-out users too.
- Route modules are all imported eagerly by the generated tree; the splitter only moves `component`/`loader`/`*Component`, so `beforeLoad` and its imports stay eager. Keep the data layer off that path: reach collections through the parent route's context, `await import()` them inside `beforeLoad`, and import the leaf module that owns the symbol — `entities/*` has no barrels to re-export `fetching` and drag kysely in (`code-style.md`).
- `entities/connection` must stay acyclic: `queries/*` call `createQuery` at module scope, so a cycle back into `runtime/query.ts` surfaces as `Cannot access 'createQuery' before initialization` at whichever module the bundler enters the cycle from. `fetchingConfig` therefore lives in the leaf `utils/fetching-config.ts`; `runtime/dialects` imports it from there, never from `utils/fetching.ts` (which reaches `queries/*`). `import/no-cycle` enforces this repo-wide (`code-style.md`).
- `main.tsx` exports nothing — it only creates the router and renders. Shared singletons live in leaves so no route or `lib/*` module imports the entry: query clients in `lib/query-client.ts`, the router history in `lib/last-location.ts`. Library code that needs the current URL or a redirect uses that history (`isAuthLocation()`, `history.push`), never the router instance; components use `useRouter()`.
- The window paints app chrome before any of that: `src/shell.tsx` is server-rendered into `index.html` markers by `@tamery/vite-inline-html/react`, wired in `vite.config.ts` with component/marker pairs (dev and build alike). Keep it hook-free and Node-safe; design rules in the `tamery-ui` skill.
- `src/lib/warmup.ts` is the entry's first import and the only module that deliberately kicks off heavy chunks — `import()` of the database right away, monaco 1s after `load`. Monaco and `lib/database` must never be static-imported from the entry; posthog-js stays behind the lazy `lib/posthog.ts` facade.
- npm packages imported only from lazy islands (`@faker-js/faker/locale/en` and `@base-ui/react/number-field` in the seed panel) belong in `optimizeDeps.include` (`apps/app/vite.config.ts`). First `import()` otherwise 504s `Outdated Optimize Dep` and React.lazy's error boundary swallows Vite's reload. Import faker from `locale/en`, never the all-locales barrel.
- Verify by walking the dev module graph from `/src/main.tsx`, not by reading imports. The `@hugeicons/core-free-icons` barrel via `packages/ui` `sonner.tsx` is eager in dev only (prod treeshakes it).

## Connection routes

Exactly two routes: `$resourceId/index.tsx` (empty state, redirects to the active tab when it still exists) and `$resourceId/$tabId.tsx` switching on parsed tab type; the layout owns navigator, tab bar, query logger. Runner state per **tab** in `runnerPageStore({ resourceId, tabId })` via `RunnerTabContext` — never off the resource store. Visualizer has no page store — state keyed by resource id alone: pan/zoom in `connectionResourceStore.visualizerViewports`, restored via `defaultViewport`, `fitView` only as first-visit fallback. **Keep `visualizerViewports` optional** — seitu repairs schema-invalid stored values against defaults and drops keys whose stored `typeof` differs, so adding a *required* key to `connectionResourceType` silently resets tabs state for existing users.

## Connection introspection queries

`entities/connection/queries/<subject>/` — one folder per thing the UI edits (`enums`, `indexes`, `constraints`, `policies`, `triggers`, `functions`, `tables`, `rows`, `connection`), plus `shared/` for what crosses subjects (`sql-fragments`, `definition`). Inside a folder the subject prefix is dropped: the catalog read is `list.ts`, the statements are `create.ts`/`drop.ts`/`rename.ts`/`recreate.ts`, and a shape builder shared by that subject's statements is `shape.ts`. **No barrels** — import the leaf file, like everywhere else in `entities/` (`code-style.md`).

Each file is one statement, as a `createQuery` covering every dialect — what a dialect that cannot run it does, and how the UI keeps users away from it, is `dialects.md`.

- **A catalog query that returns one row per column must ORDER BY key position.** The definitions sections rebuild `CREATE INDEX`/`ADD CONSTRAINT` from the arrival order of those rows, so an unordered join hands back `(a, b)` for an index declared `(b, a)`. Postgres orders by `array_position` over `indkey`/`conkey`, MySQL by `SEQ_IN_INDEX`/`ORDINAL_POSITION`, SQL Server by `ic.key_ordinal` (which also excludes `INCLUDE` columns — they carry ordinal 0).
- User-authored SQL expressions (a policy's `USING`/`WITH CHECK`, a function body) go through `sql.raw` like a runner query; every identifier and value a *form* produces goes through `sql.id`/`sql.lit`.
- A `memoize`d query factory takes the values its SQL reads, not the `ConnectionResource` — memoza keys structurally, so the whole record means a fresh entry on every unrelated field change. The `...QueryOptions` wrapper around it is not worth memoizing unless it carries a `select` whose identity must hold; where it does (`rows`), it keeps the record so a renamed resource cannot serve a stale closure.
- The query client defaults to `placeholderData: keepPreviousData`, so on a connection switch a resource-keyed query paints the previous connection's data until the new fetch lands. Where that is visible — the navigator tree (`tables/list.ts`) — `placeholderData` drops the previous data unless the resource id at key position 1 matches, so the skeleton shows instead; the smoothing still applies to same-resource key changes (`showSystem`, filters, pagination).
- A helper used by two subjects moves to `shared/`; one used by a single subject stays in that subject's folder (`functions/routine-kind.ts`, `constraints/shape.ts`). A subject folder never imports another subject's.

## Reach for the library before writing machinery

Retry, fallback, queueing, ordering, id generation, streaming state — dependency owns the concern → use its API. Genuinely unsupported → drop the feature, move to a provider that does it (gateway adapter for model failover), or ask — **not** hand-roll a wrapper.

Related smells:

- **A cast is a smell.** Model the shape in ArkType instead of `as` — schema deletes both cast and validation gap. Surviving cast sits at a wire boundary with a comment saying why.
- **Numbers need a reason.** Magic bound gets a comment explaining the trade-off. No reason → no constant.
- **Simplify on the way out.** Hook keeping cached state + comparison key + stale guard usually wants one derived value; two render paths for same content usually want one normalized shape.
