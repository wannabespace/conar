# UI design rules

> **When to read:** Before writing or reviewing any UI — components, styles, popovers, menus, animations — and before the first className.
>
> Part of the Tamery rule set indexed in `AGENTS.md`. Keep this file accurate when you change what it describes.

**Before writing or reviewing any UI (components, styles, popovers, menus, animations), load the `tamery-ui` skill** (`.agents/skills/tamery-ui/` — `SKILL.md` holds the hard rules plus an index of topic files; read every topic file the task touches). It encodes the owner's design decisions: the native macOS look, the three-level color system, typography tokens, motion recipes, and the UI kit's known traps.

Non-negotiables (enforced in review):

- **No `dark:` selectors** — colors come from theme tokens that resolve in both themes (`packages/ui/src/styles/globals.css`); fix the token choice, not the theme.
- **No pixel font sizes** (`text-[13px]`) — tokens only: `text-2xs` / `text-xs` / `text-sm` / `text-base`. Add rem tokens to `globals.css` if one is missing.
- **No `cursor-pointer`** — arrow cursor everywhere except text inputs and resize handles; `cursor-default` on link-based controls.
- **Three darkness levels** — `bg-body` canvas → `bg-background`/`bg-card` panes → `bg-input`/`bg-popover` controls; glass floating chrome is `bg-background/75-80` + `backdrop-blur-xl`.
- **Motion library for interactive animation** (interruptible; CSS transitions snap under frame drops), house curve `[0.32, 0.72, 0, 1]`, no layout shifts on hover.
- **No `sidebar-*` color tokens** — regular tokens everywhere (`bg-accent`, `text-foreground`, …).
- **No bare interactive icons** — every clickable icon gets a visible hover state and a tooltip.
- **Registry components before markup** — see the constraints table; `Item`, `Empty` and `InputGroup` cover most of what gets hand-rolled.
- **Kit-level fixes** in `packages/ui` when a sizing/color problem is systemic.

Companion skills for deeper design work: `apple-design`, `emil-design-eng`, `design-an-interface`, `design-taste-frontend` (marketing/landing surfaces only — never app chrome) — `tamery-ui` wins on conflicts.

Per-file hygiene for touched UI files: `pnpm oxlint --fix <paths>` and `pnpm oxfmt <paths>` (lint enforces Tailwind class order and canonical class names). Never hand-edit `apps/app/src/routeTree.gen.ts` — the Vite plugin regenerates it.

