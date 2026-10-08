---
name: cleanup
description: Manual-only (/cleanup). Shrinks a diff without changing what it does — maps the project's stack and replaces hand-rolled code with what a built-in, project helper, shared component or installed dependency already provides, deletes code that carries no logic (tool-assisted: knip, jscpd, unused-locals), collapses duplication and indirection, splits files that hold more than one subject, strips comments that are not warnings, and fixes bugs the pass surfaces; repeats until a pass stops paying and fans out to parallel subagents per module on large diffs. Targets the current branch's diff (its open PR's base, else the default branch) plus uncommitted work; an argument (ref or path) overrides. Works in any repo.
disable-model-invocation: true
---

# Cleanup

Make the branch's diff as small as it can be **while every observable behaviour stays identical**. The bar is not "tidier" — it is "could this be written in half the lines with what the project already has?" The only behaviour change allowed is a real bug found on the way, reported as one.

## 1. Setup

- Read the project's agent instructions (`CLAUDE.md`, `AGENTS.md`, …) and every rule file they index that the diff touches. They outrank this skill.
- Compatibility code (shims, aliases, fallbacks, migrations) is owed **only** to consumers outside the repo — a published package, a public API, persisted data, a released app. Find out which exist.
- Pick `BASE`, first match wins. `git diff $BASE` includes uncommitted work. An argument overrides it (a ref becomes `BASE`) or narrows it (a path).
  1. **The branch has an open PR**: `BASE=$(git merge-base HEAD origin/$(gh pr view --json baseRefName -q .baseRefName))`.
  2. **The branch has commits ahead of the default branch**: `BASE=$(git merge-base HEAD $(git rev-parse --abbrev-ref origin/HEAD))`.
  3. **Only uncommitted changes**: `BASE=HEAD`.
  4. None: say so and stop.

```sh
git fetch -q origin
git diff --shortstat $BASE   # the number to beat
git status --short           # untracked files are part of the target
```

- Run typecheck and tests **before any edit** and note what already fails, so a later failure can be attributed.
- Read every changed file **whole** — the branch may have made code outside its hunks dead.
- Write a **behaviour ledger**: each thing the branch makes the program do (outputs, side effects, error paths, UI and keyboard states). Every cut is checked against it.

## 2. Map the stack

Code is only shorter if the agent knows what it may reuse. Build an **inventory** — one line per owner, *concern → owner* — before cutting anything:

- **The project's stack map**, if its rules have one (a "use X for Y" table). It is the starting inventory and outranks anything discovered below.
- **Dependencies per workspace**: the manifest (`package.json`, `pyproject.toml`, `go.mod`, …) of each workspace a changed file lives in. Only those resolve in that file; a dependency of a sibling workspace is a proposal, not a reuse.
- **The project's own toolbox**: the exports of its shared utility modules, hooks, and UI kit components with their variants — names, not just paths.
- **Options of what the diff already imports**: for each dependency the changed files use, read the **installed** version's types or docs (`node_modules/<pkg>/**/*.d.ts`) for options and helpers that replace surrounding code. Memory describes some other version.

## 3. Scan with tools

Tools find dead code and copies a read-through misses. Their output is a list of leads, never verdicts — keep only findings in changed files or in code the diff orphaned, and verify each against step 6's dynamic-use search and architecture check.

```sh
pnpm dlx knip --reporter compact --no-progress                     # unused files, exports, types, dependencies
pnpm dlx jscpd --reporters console --min-tokens 50 <touched dirs>  # copies, including against untouched code
tsc --noEmit --noUnusedLocals --noUnusedParameters -p <tsconfig>   # one-off; not a config change
<linter> --report-unused-disable-directives <changed files>
```

Use the ecosystem's equivalents outside JS/TS. Known noise: knip misses entries reached by globs, filename routes, CSS and test runners; jscpd flags per-variant code a project duplicates on purpose.

## 4. Fan out on large diffs

Under ~15 files / 600 lines, or one module: do steps 5–9 yourself. Otherwise partition the changed files into **disjoint** groups by module (a file travels with its tests and styles) and spawn one subagent per group in a single message. Each prompt carries: the base ref, its file list, the inventory, the tool findings for its files, the applicable rule files and ledger lines, steps 5–9 and the traps in step 11, and these constraints —

- *Edit only your files. A change needed elsewhere (shared helper, a missing component variant, caller in another module, cross-module duplicate) goes in your report.*
- *No repo-wide autofix or formatters; lint/typecheck only your files and ignore errors in others — they are mid-edit.*
- *Report per-file net lines, replaced / deleted / split / bugs fixed / left alone, and cross-module findings.*

When all return, act on the cross-module findings, hand-review any file two agents touched, then run steps 10–11 over the tree.

## 5. Replace with what exists

Walk every hand-written mechanism in the diff — an effect, loop, parser, state sync, cache, retry, listener, formatter, validation, cast, class switch, block of markup — and ask what already owns it, in this order:

1. A language or runtime built-in.
2. The project's own helper.
3. A shared component, or a new variant on it. A call site restyling a shared component's surface means the component lacks a variant: add the variant where the component lives, and the call site keeps layout only. If the project uses a component registry, search it before writing markup.
4. An option or helper of an installed dependency.
5. A well-known format or algorithm with no dependency yet: name a package in the report — adding one is the user's call.

The owner must do the **same** thing: check its edge cases (empty input, rounding, locale, ordering, the error it throws) against the ledger before swapping.

## 6. Delete

- **Dead code the branch created or orphaned** — including the old helper or path its new code supersedes, and a dependency nothing imports any more. Search each symbol for dynamic use too (registries, filename routes, config, string keys) before killing it; orphan files, fixtures, flags and env vars count, and tests that only covered deleted code go with it.
- **Imagined states**: guards, `try`/`catch`, null checks and defaults for states the types or callers rule out; compat code nobody outside needs. Validate once at the boundary, then trust the type.
- **Indirection**: a helper, wrapper, variable, type or option with one use or no setter; an abstraction with one implementation. Inline it.
- **Duplication and derivable state**: near-identical blocks that differ only in data become one block over a table. For each new function, grep the repo for the key call it makes — an existing function of the same shape wins and the new one goes. A value or state that mirrors something computable is computed where read, and its sync code deleted.
- **No-ops**: an argument equal to the callee's default (read it first), a re-check of an already-gated condition, branches returning the same thing, casts and annotations the compiler doesn't need, lint-disable directives that suppress nothing.

**Architecture is not cruft.** Before replacing, deleting, inlining or merging anything in steps 5–7, check whether it is a pattern the project uses on purpose: a layer boundary, a module's public entry, an adapter or port, a registry, a wrapper every sibling has, a split the rules require. It is architecture if the project's rules or docs describe it, or if most siblings follow the same shape. A one-use wrapper that sits on a layer boundary stays even when inlining would be shorter. Only what this diff introduces *against* that pattern goes.

An unused *option* is speculation and goes; an unused *behaviour* a project doc describes is a decision — ask. Update any doc describing what you delete.

## 7. Restructure

Line-level deletion stalls; the large wins are shape changes. Ask of each module: *written today, knowing the final behaviour and the inventory, what would it look like?*

- A branch chain over one value's cases → a lookup record; parallel per-variant functions → one function plus per-variant data.
- An adapter unpacking an object into a callee's parameters → the callee takes the object.
- State always set together → one object; calls always made in sequence → one.
- Un-export what only its own file uses.

## 8. One subject per file

For every changed file, **list its subjects** (component, class, stateful hook/service, a branch of a variant switch, an adapter). Anything past the first moves to its own file shaped like its siblings; repoint importers, never re-export, then check what the old file still exports for newly dead values. A split is the one change allowed to add lines.

## 9. Shape, comments, tests, bugs

- **Read like a person wrote it.** Compression is not golf: plain branches over clever one-liners. Where siblings disagree, use the majority spelling everywhere. A linter's demand outranks taste.
- **Comments**: keep one only if, without it, the next reader would misunderstand or break the code. A comment explaining *what* is a naming problem — rename until the code says it, then delete.
- **Tests** the diff adds or changes are held to the project's test-quality skill or rules if it has one (e.g. `test-audit`).
- **Stand-ins**: copies the project keeps in sync with real UI (boot shells, skeletons, snapshots — its instructions name them) mirror any chrome the cleanup changed.
- **Bugs** the pass finds are fixed and listed separately.

## 10. Repeat

Shape changes open new deletions. Re-run steps 3 and 5–9 on the new diff until a pass saves under ~2% of its lines. Measure each rewrite against the original: one that needs new types, constants or lint escapes to stand up, or that did not shrink the diff (splits aside), is reverted.

## 11. Verify

Run lint, typecheck and tests; a failure not in the step-1 baseline is yours. **Never edit a test to make a cleanup pass** — revert the cut instead. Walk the ledger: exercise each entry — keyboard flow and accessibility of every touched surface included — or say which were checked only by tests or types.

Traps that turn a cut into a behaviour change:

- **Defaults are behaviour.** Dropping a parameter default changes every `.map(fn)` caller.
- **Inlining moves evaluation.** Inlined into a loop, callback or render it runs N times; across an `await` or mutation it reads a different value.
- **Identity is behaviour.** Merging selectors, memos or subscriptions into one object changes what dependency arrays and equality checks see.
- **Falsy ≠ nullish.** `||` ↔ `??` differs for `0`, `''`, `false`.
- **Errors move.** Removing a `catch` or going sync → async changes where and when failures surface.
- **A library is not a drop-in.** Its trimming, locale, sort stability or error type can differ from the code it replaces.

## 12. Report

`git diff --shortstat $BASE` before vs after, then **replaced** (what → which owner), **deleted**, **split**, **bugs fixed**, **packages proposed**, **left alone and why** — every kept piece that looks like cruft, and every dismissed tool finding in a changed file, gets a line so the next pass doesn't re-litigate it. A project-specific trap hit on the way goes into the project's rule files; a "use X for Y" the inventory lacked goes into its stack map.
