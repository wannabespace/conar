# Code standards (Ultracite)

Lint + format = **Ultracite** (Oxlint + Oxfmt preset): `pnpm run check` (read-only), `pnpm run fix` (autofix), or per-file `pnpm oxlint --fix <paths>` + `pnpm oxfmt <paths>`. Most style issues are autofixable — run `fix` and spend attention on what it cannot check: naming, business logic, architecture, edge cases.

`oxlint.config.ts` turns rules **off** only where a preset rule contradicts how this repo works, each with the reason inline. A rule that merely fails is a defect to fix, not an entry to add.

## No import cycles, no star barrels

`import/no-cycle` and `oxc/no-barrel-file` are on repo-wide and the tree satisfies both — keep it that way rather than adding an override.

- **A module that composes children must not also define what they import.** That mix produced every cycle here: an entry, registry or barrel exporting a contract or singleton its own children reach back for. Put the shared piece in a leaf below both — contracts in `types.ts`, a driver toolkit beside its registry, stores beside their helpers, infrastructure beside the router that composes it.
- **A factory takes what it depends on; it does not look itself up.** A collection's own utils close over the collection rather than reading it back out of `getCollections()`; operations that *do* need the registry live outside the factory module.
- **No `export *` anywhere; re-export by name.** Star exports trip `no-barrel-file` once a folder pulls >100 modules and they hide what a path actually offers. A package's public folder API stays a barrel of explicit names; app code has no `entities/*` re-export barrels — import the leaf that owns the symbol (`architecture.md` explains the bundling cost).
- Type-only imports count: `import type` still closes a cycle for the linter.
- The tanstack preset turns `sort-keys` **off** under `**/routes/**`, so code moved from a route into `entities/` or `packages/` can surface fresh `sort-keys` errors it never had.

## Repo-specific, not linted

- React 19: `ref` as a prop, no `forwardRef`. No `useMemo`/`useCallback` — React Compiler is on (`architecture.md`).
- Type narrowing over assertions — a cast is a smell (`architecture.md`).
- A magic number gets a name **and** a reason; no reason → no constant.
- Modern built-ins (`toSorted`, `at(-1)`, `Object.groupBy`, `Array.fromAsync`, …) over hand-rolled loops and copy-then-mutate — every runtime here supports them. Only when shorter *and* clearer; don't chain five methods where `for...of` reads better.
- No `.only`/`.skip` in committed tests.
- `useState` used only to freeze a first-render value keeps the setter plus a `void setThing` line — `hook-use-state` rejects a lone `const [thing] =`. Dropping the setter is a lint error, not a cleanup.
- Swallowing a failure on purpose (cleanup, best-effort side effect) goes through `silently()` from `@tamery/shared/utils/helpers` — no bare empty `catch`. A failure that needs a fallback value uses `tryCatch`/`tryCatchAsync`.
- **Related operations around one concept live in one object** — a Redis key and its ops, a model registry, a client's verbs (`const activeStream = { claim, get, key, release }`), not loose top-level functions: the import site names the concept once and the object is the unit of ownership. Group only where functions share state or a key builder; independent pure helpers and single-function modules stay flat. `sort-keys` is on, so keys go alphabetical.
- **No one-line function used once — inline it.** A named wrapper around a single expression (a validator, a key builder, a formatter) at one call site buys an extra name and a jump; write the expression where it runs. Name it only when it is reused, recursive, or the branching makes it unreadable in place — and prefer a schema or library option over a hand-rolled helper (`architecture.md`). The exception is a **default prop value**: `no-object-type-as-default-prop` rejects an inline function or object there, so those stay hoisted consts.
- **Name for the thing, not the mechanism.** The object is the subject and the method the verb, so the call site reads as a sentence (`chatStream.resume(chatId)`). A name describing the data structure or the plumbing (`pointer`, `map`, `handler`) tells a reader nothing; if the concept cannot be named, the grouping is wrong. No stutter — the object already carries the noun, so drop the repeat from the method.
