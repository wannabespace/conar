# Code standards (Ultracite)

Lint + format = **Ultracite** (Oxlint + Oxfmt preset): `pnpm run check` (read-only), `pnpm run fix` (autofix) at root, or per-file `pnpm oxlint --fix <paths>` + `pnpm oxfmt <paths>`. Most style issues autofixable — run `fix`, spend attention on what it can't check: naming, business logic, architecture, edge cases.

## Repo-specific, not linted

- React 19: `ref` as prop, no `forwardRef`. No `useMemo`/`useCallback` — React Compiler on (`architecture.md`).
- Type narrowing over assertions — a cast is a smell (`architecture.md`).
- Magic number gets a name **and** a reason; no reason → no constant.
- Modern built-ins (`toSorted`, `at(-1)`, `Object.groupBy`, `Array.fromAsync`, …) over hand-rolled loops and copy-then-mutate — every runtime here (Bun, Node 22+, Electron/Chromium) supports them. Only when shorter *and* clearer; don't chain five methods where `for...of` reads better.
- No `.only`/`.skip` in committed tests.
- Swallowing a failure on purpose (cleanup, best-effort side effect) goes through `silently()` from `@tamery/shared/utils/helpers` — no bare empty `catch`. A failure that needs a fallback value uses `tryCatch`/`tryCatchAsync` instead.
- Related operations around one concept — a Redis key and its ops, a model registry, a client's verbs — live in one object (`const activeStream = { claim, get, key, release }`), not as loose top-level functions: the import site names the concept once and the object is the unit of ownership. Group only where functions share state or a key builder; independent pure helpers and single-function modules stay flat. `sort-keys` is on, so keys go alphabetical (`key` won't be first).
- Name for the thing, not the mechanism: the object is the subject and the method the verb, so the call site reads as a sentence — `lastAnswer.is(chatId, messageId)`, `activeStream.release(chatId, streamId)`. A name that describes the data structure or the plumbing (`pointer`, `map`, `handler`, `chatTurn`) tells a reader nothing about what it holds; if the concept can't be named, the grouping is wrong. No stutter — the object already carries the noun, so `lastAnswer.isAnswered` and `activeStream.streamKey` repeat it; drop the repeat from the method.
