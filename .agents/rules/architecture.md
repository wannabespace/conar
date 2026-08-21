# Architecture constraints

> **When to read:** Before picking a library, adding state, writing a query, or building machinery a dependency already owns.
>
> Part of the Tamery rule set indexed in `AGENTS.md`. Keep this file accurate when you change what it describes.

| Topic | Rule |
| --- | --- |
| API layer | oRPC (`@orpc/server`) — not REST, not tRPC. Routers in `apps/api/orpc/routers/`. |
| Client state | TanStack DB collections — not Zustand, not React Context for data. |
| Cloud DB ORM | Drizzle (`packages/db`) — not raw SQL, not Prisma. |
| Auth | Better Auth (`apps/api/lib/auth.ts`) — not custom JWT, not NextAuth. |
| Secrets | Infisical via `@tamery/infisical` — not `.env` files in production. |
| Runtime | Bun — not Node for server processes. Node 22+ supported as fallback. |
| Testing | Bun test for unit tests. Playwright for E2E. |
| Schemas | ArkType everywhere — oRPC inputs, env validation, stores. Zod is legacy: it survives only inside frozen chat v1 (`apps/api/orpc/routers/chats/v1/tools.ts`). |
| UI components | The shadcn registry first — search it (`pnpm dlx shadcn@latest search @shadcn -q <term>`) before writing markup, and vendor what is missing into `packages/ui` in kit style. Hand-rolled `div`s that re-implement `Item`, `Empty`, `InputGroup`, `Field` or `ButtonGroup` are rejected in review. |
| Markdown | `Response` (`packages/ui/src/components/response.tsx`, streamdown) — never react-markdown or a bespoke pipeline. It repairs unterminated fences mid-stream, memoizes blocks, fades in per word, and renders fences through the kit's `CodeBlock`. |
| Ids | uuid v7 everywhere (`baseTable.id`). When a library mints its own id format, map it in the persistence layer — never widen a column to accommodate it. |
| Styles | TailwindCSS v4 — no inline `style=` props for layout/theme values. |
| Memoization | React Compiler is on (`reactCompilerPreset()` in the `apps/app` + `apps/main` vite configs; it reaches `packages/*` because workspace sources resolve outside `node_modules`). Do not write `useMemo`/`useCallback` — derive inline; `react/jsx-no-constructed-context-values` is off for the same reason. Sole exception: `packages/ui/src/hookas/use-throttled-callback.ts`, whose dep list spreads caller deps the compiler cannot analyse. |
| Page code | Files used by a single page live next to its route in `-`-prefixed folders (`-components/`, `-lib/`, `-utils/`). `entities/` is only for code shared across pages. |
| Connection routes | A connection resource has exactly two routes: `$resourceId/index.tsx` (empty state; redirects to `activeTabId` when that tab still exists) and `$resourceId/$tabId.tsx`, which switches on the parsed tab type. The layout `$resourceId.tsx` owns the navigator, tab bar, and query logger. Runner state (query text, selection, results, layout) is per tab in `runnerPageStore({ resourceId, tabId })`, reached through `RunnerTabContext` — never off the resource store. The visualizer keeps pan/zoom per schema in `visualizerPageStore(resourceId)`, restored via `defaultViewport` with `fitView` only as the first-visit fallback. |

## Reach for the library before writing machinery

Retry, fallback, queueing, ordering, id generation, streaming state — if a dependency owns the concern, use its API. If it genuinely does not support what is needed, the honest options are to drop the feature, move it to a provider that does it (a gateway adapter for model failover), or ask — **not** to hand-roll a wrapper. A bespoke `streamWithFallback` generator that buffered chunks to fake cross-provider failover lived here for exactly one review.

Related smells, all corrected in review:

- **A cast is a smell.** Model the shape in ArkType instead of `as` — a wire payload modelled as a schema deletes both the cast and the validation gap. A cast that survives sits at a wire boundary and carries a comment saying why.
- **Numbers need a reason.** A magic bound gets a comment explaining the trade-off it encodes. If there is no reason, there is no constant.
- **Simplify on the way out.** A hook that keeps cached state, a key to compare it against, and a stale guard usually wants one derived value instead; two render paths for the same content usually want one normalized shape.
