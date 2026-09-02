# Architecture constraints

> **When to read:** Before picking a library, adding state, writing a query, or building machinery a dependency already owns.

| Topic | Rule |
| --- | --- |
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. Live queries: `useLiveQuery({ query })` — identity is derived from structured IR, so drop the deprecated `(fn, deps)` form. `queryKey` only for `.fn.where`/opaque queries or a measured hot path. |
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
- Route modules are all imported eagerly by the generated tree; the splitter only moves `component`/`loader`/`*Component`, so `beforeLoad` and its imports stay eager. Keep the data layer off that path: reach collections through the parent route's context, `await import()` them inside `beforeLoad`, and import leaf modules instead of `entities/*` barrels (a barrel re-exporting `fetching` drags kysely in).
- `entities/connection` must stay acyclic: `queries/*` call `createQuery` at module scope, so a cycle back into `runtime/query.ts` surfaces as `Cannot access 'createQuery' before initialization` at whichever module the bundler enters the cycle from. `fetchingConfig` therefore lives in the leaf `utils/fetching-config.ts`; `runtime/dialects` imports it from there, never from `utils/fetching.ts` (which reaches `queries/*`). Cycles through `~/main` are fine; tight ones inside `entities/*` are not.
- The window paints app chrome before any of that: `src/shell.tsx` is prerendered into `index.html` by `@tamery/vite-prerender`, wired in `vite.config.ts` with component/marker pairs (dev and build alike). Keep it hook-free and Node-safe; design rules in the `tamery-ui` skill.
- `src/warmup.ts` is the entry's first import and the only module that deliberately kicks off heavy chunks — `import()` of the database right away, monaco 1s after `load`. Monaco and `lib/database` must never be static-imported from the entry; posthog-js stays behind the lazy `lib/posthog.ts` facade.
- Verify by walking the dev module graph from `/src/main.tsx`, not by reading imports. The `@remixicon/react` barrel via `packages/ui` `sonner.tsx` is eager in dev only (prod treeshakes it).

## Connection routes

Exactly two routes: `$resourceId/index.tsx` (empty state, redirects to the active tab when it still exists) and `$resourceId/$tabId.tsx` switching on parsed tab type; the layout owns navigator, tab bar, query logger. Runner state per **tab** in `runnerPageStore({ resourceId, tabId })` via `RunnerTabContext` — never off the resource store. Visualizer has no page store — state keyed by resource id alone: pan/zoom in `connectionResourceStore.visualizerViewports`, restored via `defaultViewport`, `fitView` only as first-visit fallback. **Keep `visualizerViewports` optional** — seitu repairs schema-invalid stored values against defaults and drops keys whose stored `typeof` differs, so adding a *required* key to `connectionResourceType` silently resets tabs state for existing users.

## Reach for the library before writing machinery

Retry, fallback, queueing, ordering, id generation, streaming state — dependency owns the concern → use its API. Genuinely unsupported → drop the feature, move to a provider that does it (gateway adapter for model failover), or ask — **not** hand-roll a wrapper.

Related smells:

- **A cast is a smell.** Model the shape in ArkType instead of `as` — schema deletes both cast and validation gap. Surviving cast sits at a wire boundary with a comment saying why.
- **Numbers need a reason.** Magic bound gets a comment explaining the trade-off. No reason → no constant.
- **Simplify on the way out.** Hook keeping cached state + comparison key + stale guard usually wants one derived value; two render paths for same content usually want one normalized shape.
