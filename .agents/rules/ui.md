# UI design rules

**Load the `tamery-ui` skill before the first className** (`.agents/skills/tamery-ui/` — `SKILL.md` = hard rules + index; read every topic file the task touches). **Hard rules are review blockers**; they live only in `SKILL.md`.

Companion skills for deeper design work: `apple-design`, `emil-design-eng`, `design-an-interface`, `design-taste-frontend` (marketing/landing only — never app chrome) — `tamery-ui` wins on conflicts.

Lint/format every touched file per `code-style.md` (lint enforces Tailwind class order + canonical class names). Never hand-edit `apps/app/src/routeTree.gen.ts` — the Vite plugin regenerates it.
