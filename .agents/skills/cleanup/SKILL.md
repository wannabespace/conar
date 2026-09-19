---
name: cleanup
description: Review the current branch's diff against its base (tamery, else main), then shrink it — delete code that carries no logic, make new code look like the code around it, replace per-page styling with kit props, strip comments the code can explain itself, fix bugs the pass surfaces, and re-check keyboard flow and DX. Use before opening or updating a PR, or when the user says the branch got messy.
---

# Cleanup

Shrink a branch's diff without changing what it does. **Fewer lines, fewer overrides, fewer comments** — every change here must be behaviour-preserving unless it fixes a real bug found on the way.

Read first: `.agents/rules/code-style.md`, `.agents/rules/ui.md`, and the `tamery-ui` skill (hard rules 1–13). They define what "clean" means here; this skill is the pass that enforces them.

## 1. Get the diff

```sh
BASE=$(git merge-base HEAD origin/tamery 2>/dev/null || git merge-base HEAD origin/main)
git diff --stat $BASE...HEAD
git diff $BASE...HEAD           # committed work
git status --short && git diff  # uncommitted work — part of the review
```

Also diff against the remote copy of this branch (`git diff origin/<branch>...HEAD`) when one exists, so work already pushed is reviewed too.

Read every changed file **whole**, not only the hunks — a hunk hides the helper above it that is now unused.

## 2. Delete

In rough order of payoff:

- **Dead code the branch created**: unused exports, props never passed, state never read, helpers with one caller (inline them), branches for states that cannot happen. `grep` each new symbol repo-wide before keeping it.
- **Reinvention**: a `div` stack that is a registry component, a hand-rolled effect where a library option exists, a loop where a built-in (`toSorted`, `at(-1)`, `Object.groupBy`) reads better. Kit registry search: `pnpm dlx shadcn@latest search @shadcn -q <term>`.
- **Speculative shape**: an abstraction with one implementation, an option nobody sets, a wrapper that forwards. Collapse it.
- **Duplicate logic** the branch added next to an existing helper — reuse the helper. Two dialect branches of one `createQuery` that are character-for-character the same are one statement written twice: name it once above and point both keys at it.
- **Orphan files**: a patch nothing lists in `pnpm-workspace.yaml`, an asset nothing imports, a fixture no test reads. Check the registry a file needs to be in, not just imports.

Do **not** delete queries listed as intentionally unused in `.agents/rules/`, or a feature a rule file or the `tamery-ui` skill describes on purpose — an unused *option* is speculation, an unused *behaviour* someone wrote down is a decision. Speculation goes; a decision gets asked about. Either way, **the doc that describes what you deleted is updated in the same pass** — a rule file still promising a prop that no longer exists is worse than the prop.

## 3. Match the house shape

New code should be indistinguishable from the code beside it. Pick the majority spelling and make the branch use it everywhere, rather than leaving two conventions in one folder:

- One hook for one job (`useStore`, not `useStore` here and `useSelector` there), one import path, one prop-type style across sibling files.
- Kit variants live in `<component>.utils.ts` as `cva`, not as a record inside the `.tsx`.
- Look at what the repo actually does before "fixing" a file to a rule: `useMemo`/`useCallback` are banned, but `react-hooks(exhaustive-deps)` outranks that rule — if the linter demands a stable identity, the memo stays.

## 4. De-customize the UI

The hard rule: *a className on a kit component is a missing prop*. For every changed `.tsx`:

- Kit component carrying surface classes (padding, radius, background, border, font size, height) → move it into a `size`/`variant` in `packages/ui`. Same override at two call sites, or a stack on one element, is a blocker.
- Call sites keep layout only: position, flex sizing, `min-h-0`, width, animation.
- No `dark:`, no pixel font sizes, no `cursor-pointer`, no `sidebar-*` tokens.
- `data-mask` on every element rendering user data.
- Any changed chrome → mirror it in `apps/app/src/shell.tsx` and the matching `*-skeleton.tsx`.

## 5. Comments

The owner wants code that reads without prose. **Assume a comment goes, and make it earn its place back.** Keep only a non-obvious constraint the code cannot express (an engine's rule, an upstream bug, a deliberate trade-off, opaque math) — and keep it to **one or two lines**: a five-line paragraph restating what the statement below already says is the same narration, just longer. A comment explaining *what* code does is a naming problem — **refactor until the comment is redundant, then delete it**: name the extracted function, name the constant, split the expression. A magic number keeps its name and gains its reason on one line, or loses the constant.

## 6. Fix what the pass surfaces

A cleanup that walks the whole diff finds real defects — wrong dependency, missed error path, stale query key, an `await` that isn't. Fix them in the same pass, and say so in the report. Verify against official docs (Context7) rather than memory when a library's behaviour is the question.

## 7. DX and keyboard

- Every surface the branch added answers arrows/Enter/Escape, Escape walks back one step toward the Navigator, keys registered with `useHotkey`/`useHotkeys` from `@tanstack/react-hotkeys` — never `addEventListener` or container `onKeyDown`.
- Opening surface sets `initialFocus`; closing returns focus to the trigger.
- Refresh belongs to the tab bar, never a page.
- Types and names: no casts where narrowing works, names describe the thing not the mechanism.

## 8. Verify

```sh
pnpm run fix         # autofix lint + format
pnpm run check       # must be clean
pnpm run check-types # after router changes: cd apps/api && pnpm tsc first
pnpm test            # if the branch touches tested code
```

Then run the app and exercise the changed screens (`.agents/rules/monorepo.md` → browser workflow). Behaviour-preserving means verified, not assumed; when the browser is not available, say which checks did run instead of implying the screens were seen.

Two traps this pass keeps hitting:

- **A default parameter is part of the behaviour.** Renaming or re-signing a tiny factory (`createItem(value = '')` → `createItem()`) silently empties every `.map(createItem)` call site. Re-read each caller after touching a signature.
- **A "simpler" rewrite that needs new types, consts or lint escapes to stand up is not simpler.** Measure it against the original and revert if it lost. The point is a shorter diff, not a different one.

## 9. Report

`git diff --stat $BASE...HEAD` before vs after, then three lists: **deleted**, **bugs fixed**, **left alone and why**. Anything intentionally kept that looks like cruft gets a line, so the next pass does not re-litigate it.

Record any UI pattern or design decision established during the pass in the matching `tamery-ui` topic file, same task.
