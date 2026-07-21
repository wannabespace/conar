---
name: tamery-ui
description: Tamery's UI design system and hard rules — native macOS look, three-level color system, typography tokens, motion recipes, and the kit's known gotchas. Use whenever building, restyling, or reviewing any UI in this repo (components, pages, popovers, menus, animations), before writing the first className.
---

# Tamery UI

Native-feeling macOS database client (Electron + React + Tailwind v4 + base-ui kit in `packages/ui`). Every screen should read like an Apple app, not a web page. Owner-established rules; hard rules are review blockers.

Topic files — read the ones your task touches; record new decisions in the matching file (split to avoid git conflicts):

| File | When |
|---|---|
| [colors.md](colors.md) | Colors, surfaces, glass, shadows, cell highlights |
| [typography.md](typography.md) | Fonts, type scale, row heights, radius |
| [patterns.md](patterns.md) | Chrome: menus, tabs, tooltips, toasts, icons, badges, filter field, shortcuts |
| [motion.md](motion.md) | Any animation |
| [gotchas.md](gotchas.md) | Before debugging kit components |
| [reference.md](reference.md) | Reference implementations, companion skills |

## Hard rules

1. **No `dark:` selectors.** Use theme tokens that resolve in both themes. No new theme-pair vars either (rejected). Cross-theme constructions when a token pair lacks contrast:
   - neutral tints: `bg-foreground/5` (groove), `bg-foreground/3` (zebra); elevation: `bg-input` sits above `bg-background` in both themes
   - alpha over a resolving token: `ring-destructive/30`, `bg-destructive/15`
   - `bg-input/N`: white in light, translucent lift in dark
   - dual hairline: `shadow-[0_1px_--theme(--color-black/6%),0_-1px_--theme(--color-white/6%)]`
   - `color-mix` with `--background` for tinted fills; plain `bg-white`/`border-white/10` where both themes want white
2. **No pixel font sizes.** Tokens only: `text-2xs`/`text-xs`/`text-sm`/`text-base`+. Missing size → add rem token to `@theme`.
3. **No `cursor-pointer`.** `cursor-default` on link-based controls; I-beam and col-resize are the only exceptions.
4. **Kit-level fixes** in `packages/ui` for systemic sizing/color problems; page overrides only for page-specific design.
5. **No bare interactive icons.** Hover bg + color shift + tooltip, always — pattern in [patterns.md](patterns.md).
6. **No `sidebar-*` color tokens.** Regular tokens everywhere.
7. **Global anchor rule:** `a { text-primary }` in globals — row-styled `Link`s must set `text-foreground` or they render blue.
8. **Verify heights in a row.** After touching any control that shares a line with others (toolbar, controls row, dock), measure every element's `getBoundingClientRect().height` in the browser — they must be equal to the pixel. Watch the classic traps: `py-*` + fixed-height children exceeding `min-h`, borders without `bg-clip-padding`, and hand-set `h-*` instead of size props.
