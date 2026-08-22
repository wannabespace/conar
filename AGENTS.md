# Agent instructions

Guidance for AI coding agents working in this repository. Auto-discovered as `AGENTS.md`; `CLAUDE.md` is a symlink to this file.

This file is an **index only**. The rules themselves live in `.agents/rules/` — one file per topic, so a rule change touches a small file instead of this one and parallel tasks stop colliding. Read the rule files the task touches **before** you write code; do not work from this index alone, and update the same file in the task that changes what it describes.

## Rule files

| File | Read before / update when |
| --- | --- |
| [`domain.md`](.agents/rules/domain.md) | Naming anything user-facing, or renaming or reshaping a core concept — Connections, Workspaces, Tabs, the Navigator, SyncType, collections, sync/GC lifecycle |
| [`monorepo.md`](.agents/rules/monorepo.md) | Adding, moving, or renaming an app or package; changing dev/build/test/lint commands, ports, `docker:start`, or the browser/preview workflow |
| [`architecture.md`](.agents/rules/architecture.md) | Picking a library, adding state, writing a query, or building machinery a dependency already owns; changing an architecture constraint (API layer, state, ORM, auth, secrets, runtime, styles) |
| [`api.md`](.agents/rules/api.md) | Adding or changing an API procedure, oRPC middleware, router pattern, chat version, env var, or encryption-secret path |
| [`ui.md`](.agents/rules/ui.md) | Writing or reviewing any UI — components, styles, popovers, menus, animations — before the first className |
| [`code-style.md`](.agents/rules/code-style.md) | Writing non-trivial code, interpreting a lint/format failure, or changing a lint, format, or code-standard expectation |
| [`documentation.md`](.agents/rules/documentation.md) | Finishing any change that alters user-visible behavior, features, public APIs, or terminology; changing doc locations, doc nav, or when-to-document policy |

Adding a rule file: create it in `.agents/rules/` with an H1 title and a `> **When to read:**` line, then add a row above.

## Design decisions go in the skill

`ui.md` covers process; the design system itself is the `tamery-ui` skill (`.agents/skills/tamery-ui/`), split into `SKILL.md` (hard rules + index) plus topic files — `colors.md`, `typography.md`, `patterns.md`, `motion.md`, `gotchas.md`.

Record **any** UI pattern, motion recipe, kit gotcha, or design decision established or refined during a task in the matching topic file, in that same task — even when no rule file changes. It is the living design system, and improvements that stay only in code get lost. Append to the topic file; never grow `SKILL.md` beyond the hard rules and index.

## Always applies

- **No code comments unless truly needed** (repo-wide). Write code that explains itself — clear names, small extracted functions, named constants. A comment is justified only for a non-obvious constraint the code cannot express (a workaround for an upstream bug, a deliberate trade-off, math whose intent isn't recoverable from the code). Never comment what the next line does, restate the obvious, or narrate a change.
- **Write as little code as possible.** The smallest change that fully solves the task wins. Reuse what exists before adding anything new, extend a file before creating one, and delete more than you add when you can. No speculative abstractions, options, wrappers, or config for cases nobody asked for; no defensive branches for states that cannot happen. Solve the task that was given, not the generalized version of it.
- **Rules are the source of truth, and they must stay accurate.** If a claim in a rule file no longer matches the code, fix the claim in the same task — do not leave it stale. Never duplicate a rule across files, and never inline rule content back into this index; cross-reference instead.
