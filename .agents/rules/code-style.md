# Code standards (Ultracite)

> **When to read:** Before writing non-trivial code, and when a lint or format failure needs interpreting.

Lint + format = **Ultracite** (Oxlint + Oxfmt preset): `pnpm run check` (read-only), `pnpm run fix` (autofix) at root, or per-file `pnpm oxlint --fix <paths>` + `pnpm oxfmt <paths>`. Most style issues autofixable — run `fix`, spend attention on what it can't check: naming, business logic, architecture, edge cases.

## Repo-specific, not linted

- React 19: `ref` as prop, no `forwardRef`. No `useMemo`/`useCallback` — React Compiler on (`architecture.md`).
- Type narrowing over assertions — a cast is a smell (`architecture.md`).
- Magic number gets a name **and** a reason; no reason → no constant.
- Modern built-ins (`toSorted`, `at(-1)`, `Object.groupBy`, `Array.fromAsync`, …) over hand-rolled loops and copy-then-mutate — every runtime here (Bun, Node 22+, Electron/Chromium) supports them. Only when shorter *and* clearer; don't chain five methods where `for...of` reads better.
- No `.only`/`.skip` in committed tests.
- Related operations around one concept — a Redis key and its ops, a model registry, a client's verbs — live in one object (`const pointer = { claim, get, key, release }`), not as loose top-level functions: the import site names the concept once and the object is the unit of ownership. Group only where functions share state or a key builder; independent pure helpers and single-function modules stay flat. `sort-keys` is on, so keys go alphabetical (`key` won't be first).
