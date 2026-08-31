# Agent instructions

Index only — rules live in `.agents/rules/`, one file per topic (small diffs, no parallel-task collisions). `CLAUDE.md` symlinks here. Read rule files the task touches **before** writing code; never work from this index alone; update the same file in the task that changes what it describes.

## Rule files

| File | Read before / update when |
| --- | --- |
| [`domain.md`](.agents/rules/domain.md) | Naming anything user-facing; core concepts — Connections, Workspaces, Tabs, Navigator, SyncType, collections, sync/GC lifecycle |
| [`monorepo.md`](.agents/rules/monorepo.md) | Adding/moving/renaming an app or package; dev/build/test/lint commands, ports, `docker:start`, browser/preview workflow |
| [`architecture.md`](.agents/rules/architecture.md) | Picking a library, adding state, writing a query, building machinery a dependency owns; architecture constraints (API layer, state, ORM, auth, secrets, runtime, styles) |
| [`api.md`](.agents/rules/api.md) | API procedures, oRPC middleware, router patterns, chat versions, env vars, encryption-secret paths |
| [`ui.md`](.agents/rules/ui.md) | Any UI — components, styles, popovers, menus, animations — before first className |
| [`code-style.md`](.agents/rules/code-style.md) | Non-trivial code; interpreting lint/format failures; lint/format/code-standard expectations |
| [`documentation.md`](.agents/rules/documentation.md) | Finishing changes to user-visible behavior, features, public APIs, terminology; doc locations, nav, policy |

New rule file: H1 title + `> **When to read:**` line in `.agents/rules/`, add row above.

## Design decisions go in the skill

`ui.md` = process; design system = `tamery-ui` skill (`.agents/skills/tamery-ui/`): `SKILL.md` (hard rules + index) + topic files `colors.md`, `typography.md`, `patterns.md`, `motion.md`, `gotchas.md`.

Record **any** UI pattern, motion recipe, kit gotcha, or design decision established during a task in the matching topic file, same task — even when no rule file changes. Improvements that stay only in code get lost. Append to topic file; never grow `SKILL.md` beyond hard rules + index.

## Always applies

- **No code comments unless truly needed** (repo-wide). Self-explaining code: clear names, small extracted functions, named constants. Comment only for a non-obvious constraint code can't express (upstream-bug workaround, deliberate trade-off, opaque math). Never narrate the next line, restate the obvious, or narrate a change.
- **Write as little code as possible.** Smallest change that fully solves the task wins. Reuse before adding, extend a file before creating one, delete more than you add when possible. No speculative abstractions/options/wrappers/config; no defensive branches for impossible states. Solve the given task, not the generalized version.
- **Simplest mechanism that works.** A library's built-in option beats a hand-rolled effect; an iterator/one-liner beats reimplementing a stream or primitive a dependency already provides. When a fix grows guards to defend its own complexity, step back and pick the plainer mechanism — accept a documented edge over machinery.
- **Rules are source of truth; keep accurate.** Claim no longer matching code → fix in same task. Never duplicate a rule across files; never inline rule content into this index — cross-reference. **Rules record project-level knowledge only** — decisions, domain terms, tried-and-reverted approaches, constraints invisible from the code. A localized implementation detail an agent can rederive by reading the code it sits in (a clever gate, a library idiom, a per-function trick) does not go into a rule file; if an existing claim becomes stale because of such a change, correct or delete the stale part rather than growing it.
