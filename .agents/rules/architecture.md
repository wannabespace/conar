# Architecture constraints

| Topic | Rule |
| --- | --- |
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. Live queries are `useLiveQuery({ query })`; `queryKey` only for `.fn.where`/opaque queries or a measured hot path. |
| Table page state | Two seitu stores per `{id, schema, table}`: `tablePageStore` (localStorage) and `tableSessionStore` (memory). **Selection and drafts never persist** — they are large, change per click, and every cell subscribes, so persisting them makes each notify re-read and re-compare the stored JSON. |
| Persisted collections | `persistedCollectionOptions` takes `schemaVersion: PERSISTED_SCHEMA_VERSION`, never a literal — mixed versions reset each other's tables on every boot. Bump the const to invalidate all local data. |
| Cloud DB ORM | Drizzle (`packages/db`) — not raw SQL, not Prisma. |
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
| Page code | Single-page files live next to the route in `-`-prefixed folders (`-components/`, `-lib/`, `-utils/`). `entities/` is only for code shared across pages. |

## ArkType config ordering

Every app's entry imports `@tamery/shared/arktype-config` first. ArkType scopes snapshot that config at construction, so `configure()` must run before the `arktype` module body. Source import order suffices for the Bun apps, but bundlers hoist cross-chunk imports above the importing chunk's body — so in `apps/app` the real entry is `src/entry.ts`: configure, then `import('./main')`. The dynamic import *is* the ordering guarantee; never make `main.tsx` the entry.

## App startup graph (`apps/app`)

- `lib/database.ts` opens the OPFS wa-sqlite database in a **top-level await**, so anything transitively importing it waits for WASM + OPFS before evaluating. Anything reachable from `main.tsx`/`routeTree.gen.ts` blocks first paint, signed-out users included.
- Route modules are all imported eagerly by the generated tree and the splitter only moves `component`/`loader`, so `beforeLoad` and its imports stay eager. Keep the data layer off that path: reach collections through the parent route's context, `await import()` them inside `beforeLoad`, and import the leaf module that owns the symbol (`entities/*` has no barrels — `code-style.md`).
- `entities/connection` must stay acyclic: `queries/*` call `createQuery` at module scope, so a cycle back into `runtime/query.ts` surfaces as `Cannot access 'createQuery' before initialization`. Shared config therefore lives in leaf modules that reach no queries. `import/no-cycle` enforces this repo-wide.
- `main.tsx` exports nothing — it only creates the router and renders. Shared singletons live in leaves so no route or `lib/*` module imports the entry; library code that needs the current URL or a redirect uses the stored history, never the router instance (components use `useRouter()`).
- The window paints app chrome before any of that: `src/shell.tsx` is server-rendered into `index.html` markers by `@tamery/vite-inline-html/react`, wired in `vite.config.ts` for dev and build alike. Design rules in the `tamery-ui` skill.
- `src/lib/warmup.ts` is the entry's first import and the only module that deliberately kicks off heavy chunks. Monaco and `lib/database` must never be static-imported from the entry; posthog-js stays behind its lazy facade. Import faker from `@faker-js/faker/locale/en`, never the all-locales barrel.
- Verify by walking the dev module graph from `/src/main.tsx`, not by reading imports.

## Connection routes

Exactly two routes: `$resourceId/index.tsx` (empty state, redirecting to the active tab when it still exists) and `$resourceId/$tabId.tsx` switching on parsed tab type; the layout owns navigator, tab bar and query logger. Runner state is per **tab** (`runnerPageStore({ resourceId, tabId })` via `RunnerTabContext`), never off the resource store. The visualizer has no page store — its state is keyed by resource id alone. **Keep `visualizerViewports` optional**: seitu repairs schema-invalid stored values against defaults and drops keys whose stored `typeof` differs, so adding a *required* key to `connectionResourceType` silently resets tabs state for existing users.

## Connection introspection queries

`entities/connection/queries/<subject>/` — one folder per thing the UI edits, plus `shared/` for what crosses subjects. Inside a folder the subject prefix is dropped (`list.ts`, `create.ts`, `drop.ts`, `rename.ts`, `recreate.ts`, `shape.ts`). **No barrels** — import the leaf file. A helper used by two subjects moves to `shared/`; a subject folder never imports another subject's.

Each file is one statement, as a `createQuery` covering every dialect — what a dialect that cannot run it does is `dialects.md`.

- **A catalog query that returns one row per column must ORDER BY key position.** The definitions sections rebuild `CREATE INDEX`/`ADD CONSTRAINT` from the arrival order of those rows, so an unordered join hands back `(a, b)` for an index declared `(b, a)`. Each engine has its own ordering column, and SQL Server's also excludes `INCLUDE` columns.
- User-authored SQL expressions (a policy's `USING`, a function body) go through `sql.raw` like a runner query; every identifier and value a *form* produces goes through `sql.id`/`sql.lit`.
- A `memoize`d query factory takes the values its SQL reads, not the whole `ConnectionResource` — memoza keys structurally, so the record means a fresh entry on every unrelated field change. The `...QueryOptions` wrapper is not worth memoizing unless it carries a `select` whose identity must hold.
- The query client defaults to `placeholderData: keepPreviousData`, so on a connection switch a resource-keyed query paints the previous connection's data. Where that is visible (the navigator tree), `placeholderData` drops the previous data unless the resource id matches, so the skeleton shows instead; the smoothing still applies to same-resource key changes.

## Reach for the library before writing machinery

Retry, fallback, queueing, ordering, id generation, streaming state — if a dependency owns the concern, use its API. Genuinely unsupported → drop the feature, move to a provider that does it, or ask; **not** hand-roll a wrapper.

- **A cast is a smell.** Model the shape in ArkType instead of `as` — a schema deletes both the cast and the validation gap. A surviving cast sits at a wire boundary with a comment saying why.
- **Numbers need a reason.** A magic bound gets a comment explaining the trade-off; no reason → no constant.
- **Simplify on the way out.** A hook keeping cached state + a comparison key + a stale guard usually wants one derived value; two render paths for the same content usually want one normalized shape.
