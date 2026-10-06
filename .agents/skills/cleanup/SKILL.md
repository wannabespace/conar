---
name: cleanup
description: Review the current branch's diff against its base (tamery, else main), then shrink it — delete code that carries no logic, make new code look like the code around it, replace per-page styling with kit props, strip every comment that is not a warning, fix bugs the pass surfaces, and re-check keyboard flow and DX. Use before opening or updating a PR, or when the user says the branch got messy.
---

# Cleanup

Shrink a branch's diff without changing what it does. **Fewer lines, fewer overrides, fewer comments** — every change here is behaviour-preserving unless it fixes a real bug found on the way.

Read first: `.agents/rules/code-style.md`, `.agents/rules/ui.md`, and the `tamery-ui` skill's hard rules. They define what "clean" means here; this skill is the pass that enforces them.

## 1. Get the diff

```sh
git fetch -q origin tamery main
BASE=$(for b in $(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo tamery main); do m=$(git merge-base HEAD origin/$b) && echo "$(git rev-list --count $m..HEAD) $m"; done | sort -n | head -1 | cut -d' ' -f2)
git diff --stat $BASE           # keep for the report
git diff $BASE                  # committed + uncommitted work
git status --short              # untracked files are part of the review
```

The base is the PR's base, else whichever of `tamery`/`main` the branch is nearer to. Read every changed file **whole**, not only the hunks — a hunk hides the helper above it that is now unused.

## 2. Delete

In rough order of payoff:

- **Dead code the branch created**: unused exports, props never passed, state never read, helpers with one caller (inline them). `grep` each new symbol repo-wide before keeping it.
- **Imagined states**: a guard or `try`/`catch` the surrounding module would not write, protecting a state that cannot occur; compatibility shims, aliases, retries and fallbacks — the app is unreleased, so none are owed; casts that launder types (`as any`, `as unknown as T`, `!` where narrowing works); intermediate variables that name nothing.
- **Reinvention**: a `div` stack that is a registry component, a hand-rolled effect where a library option exists, a loop where a built-in reads better. Kit search: `pnpm dlx shadcn@latest search @shadcn -q <term>`.
- **Speculative shape**: an abstraction with one implementation, an option nobody sets, a wrapper that forwards. Collapse it.
- **Duplicate logic** added next to an existing helper — reuse the helper (a hand-rolled `n > 1 ? 's' : ''` is `plural()` from `~/lib/plural`; a query key rebuilt by slicing another helper's `queryOptions(...).queryKey` is the exported `*QueryKey` builder). Two dialect branches of one `createQuery` that are character-for-character identical are one statement written twice. The same inline object type in two files is one named type exported by the file that owns it.
- **No-op code**: a prop set to the kit's default (`side="top"` on `TooltipContent`, `variant="outline"` on `AlertDialogCancel` — read the component's default before keeping it); an `onClick` re-checking the condition that already sets `disabled`; branches that all return the same value; a merge/spread over an object every caller passes whole; a caller spelling out `undefined`/`false` fields that are only read truthily; recomputing a value already in scope.
- **Unused lint escapes**: `pnpm exec oxlint -c oxlint.config.ts --report-unused-disable-directives $(git diff --name-only --diff-filter=d $BASE -- '*.ts' '*.tsx')` lists every `oxlint-disable` in the changed files that suppresses nothing — delete them; a moved or rewritten line often leaves its directive behind.
- **Orphan files**: a patch nothing lists in `pnpm-workspace.yaml`, an asset nothing imports, a fixture no test reads. Check the registry a file needs to be in, not just imports.

Do **not** delete a behaviour a rule file or the `tamery-ui` skill describes on purpose — an unused *option* is speculation, an unused *behaviour* someone wrote down is a decision. Speculation goes; a decision gets asked about. Either way, **the doc describing what you deleted is updated in the same pass**.

## 3. Match the house shape

New code should be indistinguishable from the code beside it — and read as written by a person, not compressed. Plain branches beat a clever one-liner (`String(v ?? 'null') || 'empty'`, `const [only] = cond ? list : []`, a line opening with `;(`); an `if` chain over one field's values is a lookup record; a class ternary repeating its shared classes is `cn(shared, cond ? a : b)`; several `useState`s always set together are one object state.

 Pick the majority spelling and use it everywhere rather than leaving two conventions in one folder: one hook for one job, one import path, one prop-type style across sibling files. Kit variants live in `<component>.utils.ts` as `cva`, not as a record inside the `.tsx`.

Look at what the repo actually does before "fixing" a file to a rule — `useMemo`/`useCallback` are banned, but `react-hooks(exhaustive-deps)` outranks that: if the linter demands a stable identity, the memo stays.

## 4. De-customize the UI

The hard rule: *a className on a kit component is a missing prop*. For every changed `.tsx`:

- Kit component carrying surface classes (padding, radius, background, border, font size, height) → move it into a `size`/`variant` in `packages/ui`. The same override at two call sites, or a stack on one element, is a blocker.
- Call sites keep layout only: position, flex sizing, `min-h-0`, width, animation.
- No `dark:`, no pixel font sizes, no `cursor-pointer`, no `sidebar-*` tokens. `data-mask` on every element rendering user data.
- Any changed chrome → mirror it in `apps/app/src/shell.tsx` and the matching `*-skeleton.tsx`.

## 5. Comments

Only **warning** comments survive (`CLAUDE.md` → "A comment is a warning or it does not exist"). The test for each one: *without it, would the next reader misunderstand what this code does, or break it?* If not, delete it. Warnings look like a dialect or platform trap, a race or ordering constraint, a lint escape's justification, a sync-with-that-file pointer, a prop's non-obvious contract — one or two lines.

Everything else goes: what the next line does, design rationale, why a value was picked, what changed, a JSDoc restating the name. A comment needed only to explain *what* code does is a naming problem — rename or extract until the code says it, then delete the comment. A magic number keeps its name and gains a warning on one line, or loses the constant.

## 6. Fix what the pass surfaces

A pass over the whole diff finds real defects — a wrong dependency, a missed error path, a stale query key, an `await` that isn't. Fix them here and say so in the report. Verify against official docs rather than memory when a library's behaviour is the question.

## 7. DX and keyboard

- Every surface the branch added answers arrows/Enter/Escape, Escape walks back one step toward the Navigator, and keys are registered with `useHotkey`/`useHotkeys`.
- An opening surface sets `initialFocus`; closing returns focus to the trigger.
- Refresh belongs to the tab bar, never a page.
- Names describe the thing, not the mechanism.

## 8. Verify

```sh
pnpm run fix         # autofix lint + format
pnpm run check       # must be clean
pnpm run check-types # after router changes: cd apps/api && pnpm tsc first
pnpm test            # if the branch touches tested code
```

Then run the app and exercise the changed screens (`monorepo.md` → browser workflow). Behaviour-preserving means verified, not assumed; when the browser is unavailable, say which checks did run instead of implying the screens were seen.

Traps this pass keeps hitting:

- **A default parameter is part of the behaviour.** Re-signing a tiny factory (`createItem(value = '')` → `createItem()`) silently empties every `.map(createItem)` call site. Re-read each caller after touching a signature.
- **Inlining has a lint limit.** Folding a helper into its caller can push the caller past `eslint(complexity)` — then the helper stays.
- **Merging seitu subscriptions is not free.** `useSubscription` deep-compares selector results, so folding separate subscriptions into one `pick` changes which references an effect's deps see — leave subscriptions that feed effect deps separate.
- **Lint vetoes some obvious rewrites.** `no-nested-ternary` is on (a three-way value is an `if` chain); `prefer-array-index-of` rejects `findIndex((x) => x === v)`, so an `indexOf(… as HTMLElement)` cast stays; `hook-use-state` rejects destructuring an object state in the `useState` line — take `[thing, setThing]` and destructure on the next line.
- **A "simpler" rewrite that needs new types, consts or lint escapes to stand up is not simpler.** Measure it against the original and revert if it lost. The point is a shorter diff, not a different one.

## 9. Report

`git diff --stat` before vs after, then three lists: **deleted**, **bugs fixed**, **left alone and why**. Anything intentionally kept that looks like cruft gets a line, so the next pass does not re-litigate it.
