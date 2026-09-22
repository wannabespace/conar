# Agent instructions

Index only — rules live in `.agents/rules/`, one file per topic (small diffs, no parallel-task collisions). `CLAUDE.md` symlinks here. Read the rule files the task touches **before** writing code; never work from this index alone; update the same file in the task that changes what it describes.

## Rule files

| File | Read before / update when |
| --- | --- |
| [`domain.md`](.agents/rules/domain.md) | Naming anything user-facing; core concepts — Connections, Workspaces, Tabs, Navigator, SyncType, collections, sync/GC lifecycle |
| [`monorepo.md`](.agents/rules/monorepo.md) | Adding/moving/renaming an app or package; dev/build/test/lint commands, local URLs, backing services, browser workflow |
| [`architecture.md`](.agents/rules/architecture.md) | Picking a library, adding state, writing a query, building machinery a dependency owns; architecture constraints (API layer, state, ORM, auth, secrets, runtime, styles) |
| [`api.md`](.agents/rules/api.md) | API procedures, oRPC middleware, router patterns, chat versions, env vars, encryption-secret paths |
| [`dialects.md`](.agents/rules/dialects.md) | Anything that differs per database engine — a new `createQuery`, a capability gate, a per-dialect form option, a catalog column one engine lacks |
| [`ui.md`](.agents/rules/ui.md) | Any UI — components, styles, popovers, menus, animations — before the first className |
| [`code-style.md`](.agents/rules/code-style.md) | Non-trivial code; interpreting lint/format failures; lint/format/code-standard expectations |
| [`documentation.md`](.agents/rules/documentation.md) | Finishing changes to user-visible behavior, features, public APIs, terminology; doc locations, nav, policy |

New rule file: H1 title in `.agents/rules/`, add a row above — the table is the only when-to-read.

## Design decisions go in the skill

`ui.md` = process; the design system = `tamery-ui` skill (`.agents/skills/tamery-ui/`), whose `SKILL.md` holds the hard rules — **review blockers, load it before any UI work** — and indexes the topic files.

Record **any** UI pattern, motion recipe, kit gotcha or design decision established during a task in the matching topic file, same task — even when no rule file changes. Improvements that stay only in code get lost. Append to the topic file; never grow `SKILL.md` beyond hard rules + index.

## Always applies

- **A comment is a warning or it does not exist** (repo-wide). The only comments allowed are the ones that stop the next reader breaking something: a dialect or platform trap, a race or ordering constraint, a lint/type escape hatch's justification, a sync-with-that-file pointer, a prop's non-obvious contract. Everything else — design rationale, why a value was picked, what the next line does, what changed — goes in the code's names or nowhere. Self-explaining code: clear names, small extracted functions, named constants.
- **Write as little code as possible.** The smallest change that fully solves the task wins. Reuse before adding, extend a file before creating one, delete more than you add. No speculative abstractions, options, wrappers or config; no defensive branches for impossible states. Solve the given task, not the generalized version.
- **Simplest mechanism that works.** A library's built-in option beats a hand-rolled effect; an iterator or one-liner beats reimplementing a primitive a dependency already provides. When a fix grows guards to defend its own complexity, step back and pick the plainer mechanism — accept a documented edge over machinery.
- **Rules are source of truth; keep them accurate.** A claim that no longer matches the code gets fixed in the same task. Never duplicate a rule across files and never inline rule content into this index — cross-reference. **Rules record project-level knowledge only** — decisions, domain terms, constraints invisible from the code. State the current rule and its reason; **never record history** — what was tried, reverted, replaced, or measured on which date. A localized implementation detail an agent can rederive by reading the code it sits in (a clever gate, a library idiom, a per-function trick, exact class lists) does not belong in a rule file; if an existing claim goes stale because of such a change, correct or delete the stale part rather than growing it.
- **Any UI change re-checks its stand-ins.** The pre-JS boot shell (`apps/app/src/shell.tsx`, one per layout) and every Suspense skeleton (`*-skeleton.tsx`) copy the chrome they replace, so a changed header, row, gutter or panel size drifts them silently and the swap stops being invisible. Mirror the change in the same task, keep shared classes coming from the exported consts, and confirm the shell still matches (`tamery-ui` patterns → Boot shell).
