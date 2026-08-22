# Code standards (Ultracite)

> **When to read:** Before writing non-trivial code, and when a lint or format failure needs interpreting.

Lint and format come from **Ultracite** (Oxlint + Oxfmt preset): `pnpm run check` (read-only) and `pnpm run fix` (autofix) at the root, or per-file `pnpm oxlint --fix <paths>` and `pnpm oxfmt <paths>`. Most style issues are autofixable — run `fix` instead of hand-satisfying the linter, and spend your attention on what it cannot check: naming, business logic, architecture, edge cases.

## Repo-specific, not linted

- React 19: `ref` as a prop, no `forwardRef`. No `useMemo`/`useCallback` — React Compiler is on (`architecture.md`).
- Type narrowing over assertions — a cast is a smell (`architecture.md`).
- A magic number gets a name **and** a reason; without a reason there is no constant.
- Modern built-ins (`toSorted`, `at(-1)`, `Object.groupBy`, `Array.fromAsync`, …) over hand-rolled loops and copy-then-mutate — every runtime here (Bun, Node 22+, Electron/Chromium) supports them. Reach for one only when it makes the code shorter *and* clearer; don't chain five methods where a `for...of` reads better.
- No `.only`/`.skip` in committed tests.
