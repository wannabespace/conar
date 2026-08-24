# UI design rules

> **When to read:** Before writing or reviewing any UI — components, styles, popovers, menus, animations — before the first className.

**Load the `tamery-ui` skill before the first className** (`.agents/skills/tamery-ui/` — `SKILL.md` = hard rules + index; read every topic file the task touches). Owner's design decisions: native macOS look, three-level color system, typography tokens, motion recipes, kit traps. **Hard rules are review blockers**; they live only in `SKILL.md`.

Companion skills for deeper design work: `apple-design`, `emil-design-eng`, `design-an-interface`, `design-taste-frontend` (marketing/landing only — never app chrome) — `tamery-ui` wins on conflicts.

Per-file hygiene for touched UI files: `pnpm oxlint --fix <paths>` + `pnpm oxfmt <paths>` (lint enforces Tailwind class order + canonical class names). Never hand-edit `apps/app/src/routeTree.gen.ts` — Vite plugin regenerates it.
