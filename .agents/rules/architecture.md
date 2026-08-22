# Architecture constraints

> **When to read:** Before picking a library, adding state, writing a query, or building machinery a dependency already owns.

| Topic | Rule |
| --- | --- |
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. |
| Cloud DB ORM | Drizzle (`packages/db`) — not raw SQL, not Prisma. |
| Auth | Better Auth — not custom JWT, not NextAuth. |
| Secrets | Infisical via `@tamery/infisical` — not `.env` files in production. |
| Runtime | Bun — not Node for server processes. Node 22+ supported as fallback. |
| Testing | Bun test for unit tests. Playwright for E2E. |
| Schemas | ArkType everywhere — oRPC inputs, env validation, stores. Zod is legacy and survives only inside frozen chat v1 (`api.md`). |
| UI components | The shadcn registry first — search it before writing markup, vendor what is missing into `packages/ui` in kit style. Hand-rolled re-implementations are rejected in review; details in the `tamery-ui` skill (hard rule 0). |
| Markdown | The kit `Response` (streamdown) — never react-markdown or a bespoke pipeline. Behavior and setup traps in the `tamery-ui` skill. |
| Ids | uuid v7 everywhere (`baseTable.id`). When a library mints its own id format, map it in the persistence layer — never widen a column to accommodate it. |
| Styles | TailwindCSS v4 — no inline `style=` props for layout/theme values. |
| Memoization | React Compiler is on in the `apps/app` + `apps/main` vite configs, and reaches `packages/*` (workspace sources resolve outside `node_modules`). Do not write `useMemo`/`useCallback` — derive inline; `react/jsx-no-constructed-context-values` is off for the same reason. Caveat: the compiler skips any component calling TanStack Virtual's `useVirtualizer` directly (incompatible-library bailout, enforced by the `react/incompatible-library` lint rule) — never import it; use the `@tamery/ui/hooks/use-virtualizer` wrapper, which isolates the bailout behind `'use no memo'` and returns compiler-safe values: `virtualItems`/`totalSize` snapshots for render, stable `measure`/`scrollToIndex` for imperative calls. Verify a suspected bailout by running `babel-plugin-react-compiler` on the file with a `logger`, not by reading the source. |
| Page code | Files used by a single page live next to its route in `-`-prefixed folders (`-components/`, `-lib/`, `-utils/`). `entities/` is only for code shared across pages. |
| Connection routes | A connection resource has exactly two routes: `$resourceId/index.tsx` (empty state, redirects to the active tab when it still exists) and `$resourceId/$tabId.tsx`, which switches on the parsed tab type; the layout owns navigator, tab bar, and query logger. Runner state is per **tab** in `runnerPageStore({ resourceId, tabId })` reached through `RunnerTabContext` — never off the resource store. The visualizer has no page store because its state is keyed by resource id alone: pan/zoom lives in `connectionResourceStore.visualizerViewports`, restored via `defaultViewport` with `fitView` only as the first-visit fallback. **Keep `visualizerViewports` optional** — seitu repairs a schema-invalid stored value against the defaults and drops any key whose stored `typeof` differs from the default's, so adding a *required* key to `connectionResourceType` silently resets tabs state for existing users. |

## Reach for the library before writing machinery

Retry, fallback, queueing, ordering, id generation, streaming state — if a dependency owns the concern, use its API. If it genuinely does not support what is needed, the honest options are to drop the feature, move it to a provider that does it (a gateway adapter for model failover), or ask — **not** to hand-roll a wrapper. A bespoke `streamWithFallback` generator that buffered chunks to fake cross-provider failover lived here for exactly one review.

Related smells, all corrected in review:

- **A cast is a smell.** Model the shape in ArkType instead of `as` — a wire payload modelled as a schema deletes both the cast and the validation gap. A cast that survives sits at a wire boundary and carries a comment saying why.
- **Numbers need a reason.** A magic bound gets a comment explaining the trade-off it encodes. If there is no reason, there is no constant.
- **Simplify on the way out.** A hook that keeps cached state, a key to compare it against, and a stale guard usually wants one derived value instead; two render paths for the same content usually want one normalized shape.
