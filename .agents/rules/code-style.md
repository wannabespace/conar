# Code standards (Ultracite)

> **When to read:** Before writing non-trivial code, and when a lint or format failure needs interpreting.
>
> Part of the Tamery rule set indexed in `AGENTS.md`. Keep this file accurate when you change what it describes.

Lint and format come from **Ultracite** (Oxlint + Oxfmt preset): `pnpm run check` (read-only) and `pnpm run fix` (autofix) at the root, or per-file `pnpm oxlint --fix <paths>` and `pnpm oxfmt <paths>`. Most style issues are autofixable — run `fix` instead of hand-satisfying the linter, and reserve your attention for what it cannot check: naming, business logic, architecture, edge cases.

## What the linter can't enforce

- Explicit types on function signatures where they add clarity; `unknown` over `any`; type narrowing over assertions (a cast is a smell — see `architecture.md`).
- Meaningful names over magic numbers — extract constants with descriptive names, and give each a reason.
- Early returns over nested conditionals; extract complex conditions into well-named booleans.
- Throw `Error` objects with descriptive messages; don't catch just to rethrow.
- Semantic HTML and accessibility: real `<button>`/`<nav>` over divs with roles, labels on inputs, alt text, keyboard handlers alongside mouse events.
- React 19: `ref` as a prop, no `forwardRef`. No `useMemo`/`useCallback` — React Compiler is on (`architecture.md`).
- Modern built-ins (`flatMap`, `toSorted`, `at(-1)`, `Object.groupBy`, `Set` ops, `structuredClone`, `Array.fromAsync`, …) over hand-rolled loops and copy-then-mutate — every runtime here (Bun, Node 22+, Electron/Chromium) supports them. Pick one only when it makes the code shorter *and* clearer; don't chain five methods where a `for...of` reads better.

## Testing

- Assertions inside `it()`/`test()` blocks; async/await, not done callbacks.
- No `.only` or `.skip` in committed code.
- Keep suites reasonably flat — avoid deep `describe` nesting.
