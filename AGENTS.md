# Agent instructions

Guidance for AI coding agents working in this repository. Auto-discovered as `AGENTS.md`; `CLAUDE.md` is a symlink to this file.

This file is an **index only**. The rules themselves live in `.agents/rules/` — one file per topic, so a rule change touches a small file instead of this one and parallel tasks stop colliding. Read the rule files the task touches **before** you write code; do not work from this index alone.

## Rule files

| File | Read before |
| --- | --- |
| [`.agents/rules/domain.md`](.agents/rules/domain.md) | Naming anything user-facing, or touching Connections, Workspaces, Tabs, the Navigator, SyncType, or collections |
| [`.agents/rules/monorepo.md`](.agents/rules/monorepo.md) | Adding or moving code between apps/packages, running/wiring dev, build, test, lint commands, or opening the running app in a browser |
| [`.agents/rules/architecture.md`](.agents/rules/architecture.md) | Picking a library, adding state, writing a query, or building machinery a dependency already owns |
| [`.agents/rules/api.md`](.agents/rules/api.md) | Adding or changing an API procedure, middleware, chat version, env var, or encryption-secret path |
| [`.agents/rules/ui.md`](.agents/rules/ui.md) | Writing or reviewing any UI — components, styles, popovers, menus, animations — before the first className |
| [`.agents/rules/code-style.md`](.agents/rules/code-style.md) | Writing non-trivial code, or interpreting a lint/format failure |
| [`.agents/rules/documentation.md`](.agents/rules/documentation.md) | Finishing any change that alters user-visible behavior, features, public APIs, or terminology |

Design detail beyond `ui.md` lives in the `tamery-ui` skill (`.agents/skills/tamery-ui/`), which `ui.md` points into.

## Always applies

- **No code comments unless truly needed** (repo-wide). Write code that explains itself — clear names, small extracted functions, named constants. A comment is justified only for a non-obvious constraint the code cannot express (a workaround for an upstream bug, a deliberate trade-off, math whose intent isn't recoverable from the code). Never comment what the next line does, restate the obvious, or narrate a change.
- **Write as little code as possible.** The smallest change that fully solves the task wins. Reuse what exists before adding anything new, extend a file before creating one, and delete more than you add when you can. No speculative abstractions, options, wrappers, or config for cases nobody asked for; no defensive branches for states that cannot happen. Solve the task that was given, not the generalized version of it.
- **Rules are the source of truth, and they must stay accurate.** If a claim in a rule file no longer matches the code, fix the claim in the same task — do not leave it stale.

## Keeping the rules up to date

Update the matching rule file in the same task as the change. Never duplicate a rule across files, and never inline rule content back into this index.

| Change | File to update |
| --- | --- |
| App or package added, removed, or renamed; dev command, port, or `docker:start` contents changed; browser/preview workflow changed | `monorepo.md` |
| Architecture constraint added or changed (API layer, state, ORM, auth, secrets, runtime, styles) | `architecture.md` |
| oRPC middleware, router pattern, chat version, or secret/env handling changed | `api.md` |
| Core domain concept renamed or reshaped (Connection, Workspace, Tab, SyncType, collections, sync/GC lifecycle) | `domain.md` |
| Lint, format, or code-standard expectation changed | `code-style.md` |
| Doc locations, doc nav, or when-to-document policy changed | `documentation.md` |
| UI design rule added or changed | `ui.md` **and** the `tamery-ui` skill |
| **Any** UI pattern, motion recipe, kit gotcha, or design decision established or refined during a task | the matching `tamery-ui` topic file — even when `ui.md` doesn't change |

The `tamery-ui` skill is the living design system; improvements that stay only in code get lost. It is **split into topic files** (`.agents/skills/tamery-ui/`: `SKILL.md` index + hard rules, `colors.md`, `typography.md`, `patterns.md`, `motion.md`, `gotchas.md`, `reference.md`) to keep parallel edits conflict-free — append to the matching topic file, never grow `SKILL.md` beyond the hard rules and index.

Adding a new rule file: create it in `.agents/rules/` with an H1 title and a `> **When to read:**` line, then add a row to both tables above.
