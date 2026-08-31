# Architecture constraints

> **When to read:** Before picking a library, adding state, writing a query, or building machinery a dependency already owns.

| Topic | Rule |
| --- | --- |
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. Live queries: `useLiveQuery({ query })` — identity is derived from structured IR, so drop the deprecated `(fn, deps)` form. `queryKey` only for `.fn.where`/opaque queries or a measured hot path. |
| Persisted collections | `persistedCollectionOptions` takes `schemaVersion: PERSISTED_SCHEMA_VERSION` (`lib/sync.ts`) — never a literal: mixed versions reset each other's tables on every boot (cache wiped each reload, forever). Bump the const to invalidate all local data. |
| Cloud DB ORM | Drizzle (`packages/db`) — not raw SQL, not Prisma. |
| Auth | Better Auth — not custom JWT, not NextAuth. |
| Secrets | Infisical via `@tamery/infisical` — not `.env` files in production. |
| Runtime | Bun — not Node for server processes. Node 22+ supported as fallback. |
| Testing | Bun test for unit tests. Playwright for E2E. |
| Schemas | ArkType everywhere — oRPC inputs, env validation, stores. Zod is legacy, survives only inside frozen chat v1 (`api.md`). |
| UI components | shadcn registry first — search before writing markup, vendor missing pieces into `packages/ui` in kit style. Hand-rolled re-implementations rejected in review; details in `tamery-ui` skill (hard rule 0). |
| Markdown | Kit `Response` (streamdown) — never react-markdown or a bespoke pipeline. Behavior + setup traps in `tamery-ui` skill. |
| Ids | uuid v7 everywhere (`baseTable.id`). Library mints its own format → map in persistence layer, never widen a column. |
| Styles | TailwindCSS v4 — no inline `style=` props for layout/theme values. |
| Memoization | React Compiler on in `apps/app` + `apps/main` vite configs, reaches `packages/*` (workspace sources resolve outside `node_modules`). No `useMemo`/`useCallback` — derive inline; `react/jsx-no-constructed-context-values` off for same reason. Caveat: compiler skips any component calling TanStack Virtual's `useVirtualizer` directly (incompatible-library bailout, enforced by `react/incompatible-library` lint) — never import it; use the `@tamery/ui/hooks/use-virtualizer` wrapper, which isolates the bailout behind `'use no memo'` and returns compiler-safe values. Verify a suspected bailout by running `babel-plugin-react-compiler` on the file with a `logger`, not by reading source. |
| Page code | Single-page files live next to the route in `-`-prefixed folders (`-components/`, `-lib/`, `-utils/`). `entities/` only for code shared across pages. |
| Connection routes | Exactly two routes: `$resourceId/index.tsx` (empty state, redirects to active tab when it still exists) and `$resourceId/$tabId.tsx` switching on parsed tab type; layout owns navigator, tab bar, query logger. Runner state per **tab** in `runnerPageStore({ resourceId, tabId })` via `RunnerTabContext` — never off the resource store. Visualizer has no page store — state keyed by resource id alone: pan/zoom in `connectionResourceStore.visualizerViewports`, restored via `defaultViewport`, `fitView` only first-visit fallback. **Keep `visualizerViewports` optional** — seitu repairs schema-invalid stored values against defaults and drops keys whose stored `typeof` differs, so adding a *required* key to `connectionResourceType` silently resets tabs state for existing users. |

## Reach for the library before writing machinery

Retry, fallback, queueing, ordering, id generation, streaming state — dependency owns the concern → use its API. Genuinely unsupported → drop the feature, move to a provider that does it (gateway adapter for model failover), or ask — **not** hand-roll a wrapper. (A bespoke `streamWithFallback` buffering chunks to fake cross-provider failover survived exactly one review.)

Related smells, all corrected in review:

- **A cast is a smell.** Model the shape in ArkType instead of `as` — schema deletes both cast and validation gap. Surviving cast sits at a wire boundary with a comment saying why.
- **Numbers need a reason.** Magic bound gets a comment explaining the trade-off. No reason → no constant.
- **Simplify on the way out.** Hook keeping cached state + comparison key + stale guard usually wants one derived value; two render paths for same content usually want one normalized shape.
