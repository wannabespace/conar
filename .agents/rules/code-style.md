# Code standards (Ultracite)

Lint + format = **Ultracite** (Oxlint + Oxfmt preset): `pnpm run check` (read-only), `pnpm run fix` (autofix) at root, or per-file `pnpm oxlint --fix <paths>` + `pnpm oxfmt <paths>`. Most style issues autofixable — run `fix`, spend attention on what it can't check: naming, business logic, architecture, edge cases.

`oxlint.config.ts` turns rules **off** only where a preset rule contradicts how this repo works, each with the reason inline. A rule that merely fails is a defect to fix, not an entry to add.

## No import cycles, no star barrels

`import/no-cycle` and `oxc/no-barrel-file` are on repo-wide and the tree satisfies both — keep it that way rather than adding an override.

- **A module that composes children must not also define what they import.** That mix is what produced every cycle here: an entry/registry/barrel exporting a contract or singleton its own children reach back for. Put the shared piece in a leaf below both — contracts in `types.ts` (`packages/table`, `generators`, `seeds`), a driver toolkit beside its registry (`runtime/dialects/driver.ts`), stores beside their helpers (`store/stores.ts`), infrastructure beside the router that composes it (`challenge/code-challenge.ts`, `apps/api/variables.ts`).
- **A factory takes what it depends on; it does not look itself up.** `createConnectionsCollection(connectionStrings)` is wired in `entities/collections`, and a collection's own `utils` close over the collection rather than reading it back out of `getCollections()`. Operations that *do* need the registry live outside the factory module (`core/create-connection.ts`, `workspace/create.ts`).
- **No `export *` anywhere; re-export by name.** Star exports trip `no-barrel-file` once a folder pulls >100 modules, and they hide what a path actually offers. A package's public folder API stays a barrel of explicit names (`packages/db/schema`, `@tamery/ai/models`, `@tamery/table`); oRPC router groups list their procedures (`orpc/routers/account/index.ts`). App code has no `entities/*` re-export barrels — import the leaf that owns the symbol (`architecture.md` explains the bundling cost). `entities/collections/index.ts` is the collection registry, not a barrel.
- Type-only imports count. `import type` still closes a cycle for the linter.
- The tanstack preset turns `sort-keys` **off** under `**/routes/**`, so code moved from a route into `entities/` or `packages/` can surface fresh `sort-keys` errors it never had.

## Repo-specific, not linted

- React 19: `ref` as prop, no `forwardRef`. No `useMemo`/`useCallback` — React Compiler on (`architecture.md`).
- Type narrowing over assertions — a cast is a smell (`architecture.md`).
- Magic number gets a name **and** a reason; no reason → no constant.
- Modern built-ins (`toSorted`, `at(-1)`, `Object.groupBy`, `Array.fromAsync`, …) over hand-rolled loops and copy-then-mutate — every runtime here (Bun, Node 22+, Electron/Chromium) supports them. Only when shorter *and* clearer; don't chain five methods where `for...of` reads better.
- No `.only`/`.skip` in committed tests.
- `useState` used only to freeze a first-render value keeps the setter plus a `void setThing` line — `hook-use-state` rejects a lone `const [thing] =`. Dropping the setter is a lint error, not a cleanup.
- Swallowing a failure on purpose (cleanup, best-effort side effect) goes through `silently()` from `@tamery/shared/utils/helpers` — no bare empty `catch`. A failure that needs a fallback value uses `tryCatch`/`tryCatchAsync` instead.
- Related operations around one concept — a Redis key and its ops, a model registry, a client's verbs — live in one object (`const activeStream = { claim, get, key, release }`), not as loose top-level functions: the import site names the concept once and the object is the unit of ownership. Group only where functions share state or a key builder; independent pure helpers and single-function modules stay flat. `sort-keys` is on, so keys go alphabetical (`key` won't be first).
- Name for the thing, not the mechanism: the object is the subject and the method the verb, so the call site reads as a sentence — `lastAnswer.is(chatId, messageId)`, `activeStream.release(chatId, streamId)`. A name that describes the data structure or the plumbing (`pointer`, `map`, `handler`, `chatTurn`) tells a reader nothing about what it holds; if the concept can't be named, the grouping is wrong. No stutter — the object already carries the noun, so `lastAnswer.isAnswered` and `activeStream.streamKey` repeat it; drop the repeat from the method.
