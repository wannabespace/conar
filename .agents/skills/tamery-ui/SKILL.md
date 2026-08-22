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

## Hard rules

0. **Search the registry before writing markup.** `pnpm dlx shadcn@latest search @shadcn -q <term>` (the full `ui` list is ~60 items). A `div` stack that re-implements `Item`, `Empty`, `InputGroup`, `Field`, `ButtonGroup`, `Attachment` or `Questionnaire` is a review blocker — including "just this once, it's only a row". Missing from `packages/ui`? Vendor it (`shadcn view @shadcn/<name>`), rewrite the imports to kit conventions (`@tamery/ui/lib/utils`, arrow components, sorted props), then use it. Registry components carry the density, focus rings, hover states and data-slots the rest of the app already relies on; hand-rolled copies drift from all four. Long-form text is never hand-parsed either — prose renders through the kit `Response`, fenced code through the kit `CodeBlock` ([patterns.md](patterns.md)).

1. **No `dark:` selectors.** Use theme tokens that resolve in both themes. No new theme-pair vars either (rejected). When a token pair lacks contrast, reach for the cross-theme constructions in [colors.md](colors.md) — alpha tints, neutral `bg-foreground/*` steps, `color-mix` fills — and remember the test that lives there: **if several call sites each dial their own alpha on one token, the token is wrong.**
2. **No pixel font sizes.** Tokens only: `text-2xs`/`text-xs`/`text-sm`/`text-base`+. Missing size → add rem token to `@theme`.
3. **No `cursor-pointer`.** `cursor-default` on link-based controls; I-beam and col-resize are the only exceptions.
4. **Kit-level fixes** in `packages/ui` for systemic sizing/color problems; page overrides only for page-specific design.
5. **No bare interactive icons.** Hover bg + color shift + tooltip, always — pattern in [patterns.md](patterns.md).
6. **No `sidebar-*` color tokens.** Regular tokens everywhere.
7. **Global anchor rule:** `a { text-primary }` in globals — row-styled `Link`s must set `text-foreground` or they render blue.
8. **`data-mask` on all user data.** Any element rendering user values — connection names/labels/hosts, connection strings, resource/schema/table/column names, cell values, SQL, filter values — gets the `data-mask` attribute so screen-recording tools can blur it. App chrome (static labels, buttons) never. Put it on the closest element that wraps only the user value.
9. **Verify heights in a row.** After touching any control that shares a line with others (toolbar, controls row, dock), measure every element's `getBoundingClientRect().height` in the browser — they must be equal to the pixel. Watch the classic traps: `py-*` + fixed-height children exceeding `min-h`, borders without `bg-clip-padding`, and hand-set `h-*` instead of size props.
