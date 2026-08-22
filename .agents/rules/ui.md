# UI design rules

> **When to read:** Before writing or reviewing any UI — components, styles, popovers, menus, animations — and before the first className.

**Load the `tamery-ui` skill before the first className** (`.agents/skills/tamery-ui/` — `SKILL.md` holds the hard rules plus an index of topic files; read every topic file the task touches). It encodes the owner's design decisions: the native macOS look, the three-level color system, typography tokens, motion recipes, and the kit's known traps. Its **hard rules are review blockers**, and they live in `SKILL.md` so there is exactly one copy to keep accurate.

Companion skills for deeper design work: `apple-design`, `emil-design-eng`, `design-an-interface`, `design-taste-frontend` (marketing/landing surfaces only — never app chrome) — `tamery-ui` wins on conflicts.

Per-file hygiene for touched UI files: `pnpm oxlint --fix <paths>` and `pnpm oxfmt <paths>` (lint enforces Tailwind class order and canonical class names). Never hand-edit `apps/app/src/routeTree.gen.ts` — the Vite plugin regenerates it.
