---
name: tamery-ui
description: Tamery's UI design system and hard rules — native macOS look, three-level color system, typography tokens, motion recipes, and the kit's known gotchas. Use whenever building, restyling, or reviewing any UI in this repo (components, pages, popovers, menus, animations), before writing the first className.
---

# Tamery UI

Native-feeling macOS database client (Electron + React + Tailwind v4 + base-ui kit in `packages/ui`). Every screen reads like an Apple app, not a web page. Owner-established rules; hard rules are review blockers.

Topic files — read what the task touches; record new decisions in the matching file:

| File | When |
|---|---|
| [colors.md](colors.md) | Colors, surfaces, glass, shadows, cell highlights |
| [typography.md](typography.md) | Fonts, type scale, row heights, radius |
| [patterns.md](patterns.md) | Chrome: menus, tabs, panes, tooltips, toasts, icons, filter field, shortcuts |
| [motion.md](motion.md) | Any animation |
| [gotchas.md](gotchas.md) | Before debugging kit components |

## Hard rules

0. **Search the registry before writing markup.** `pnpm dlx shadcn@latest search @shadcn -q <term>`. A `div` stack re-implementing a registry component (`Item`, `Empty`, `InputGroup`, `Field`, `ButtonGroup`, `Attachment`…) is a review blocker — including "just this once". Missing from `packages/ui` → vendor it (`shadcn view @shadcn/<name>`), rewrite imports to kit conventions (`@tamery/ui/lib/utils`, arrow components, sorted props), then use. Registry components carry the density, focus rings, hover states and data-slots the app relies on. Long-form text never hand-parsed: prose via kit `Response`, fenced code via kit `CodeBlock` (bare `pre`) or `ResponseCodeBlock` (chat chrome) ([patterns.md](patterns.md)).
1. **No `dark:` selectors.** Theme tokens resolving in both themes. No new theme-pair vars. Token pair lacks contrast → cross-theme constructions in [colors.md](colors.md) (alpha tints, `bg-foreground/*` steps, `color-mix` fills). Test: **several call sites each dialing their own alpha on one token = the token is wrong.**
2. **No pixel font sizes.** Tokens only: `text-2xs`/`text-xs`/`text-sm`/`text-base`+. Missing size → add rem token to `@theme`.
3. **No `cursor-pointer`.** `cursor-default` on link-based controls; I-beam and col-resize only exceptions.
4. **Kit-level fixes** in `packages/ui` for systemic sizing/color problems; page overrides only for page-specific design. Sizes via size props, never per-page `h-*`.
5. **No bare interactive icons.** Hover bg + color shift + tooltip, always — [patterns.md](patterns.md).
6. **No `sidebar-*` color tokens.** Regular tokens everywhere.
7. **Global anchor rule:** `a { text-primary }` in globals — row-styled `Link`s must set `text-foreground` or render blue.
8. **`data-mask` on all user data.** Any element rendering user values (connection names/labels/hosts, connection strings, resource/schema/table/column names, cell values, SQL, filter values) gets `data-mask` so screen-recording tools can blur it. App chrome never. Put on the closest element wrapping only the user value.
9. **Verify heights in a row.** After touching any control sharing a line with others (toolbar, controls row, dock), measure every element's `getBoundingClientRect().height` in the browser — equal to the pixel. Classic traps: `py-*` + fixed-height children exceeding `min-h`, borders without `bg-clip-padding`, hand-set `h-*` instead of size props.
10. **Refresh belongs to the tab bar, never to the page.** `TabRefresh` (`connection/$resourceId/-components/tab-bar.tsx`) owns refreshing the active tab: a tab type that can refresh gets a branch there — invalidate its query keys, `useRefreshHotkey`, render `TabRefreshButton` — and its page ships **no** refresh control of its own. A tab type that genuinely cannot refresh keeps the button mounted and `disabled`. Two buttons for one dataset read as two different refreshes and both fire on ⌘R.
11. **A className on a kit component is a missing prop.** Call sites pass `size`/`variant` and own only layout — position, flex sizing, `min-h-0`, a width, an animation, a behaviour utility like `scroll-fade`. The moment a page re-dials a kit component's *surface* — padding, radius, background, border, font size, height — the kit is wrong for that context and gets a variant (`Drawer size="sm"` for pane-density chrome, `Command`/`CommandInput variant="flat"` for a command list in a flat pane, `Alert size="sm"`). One override is a smell; a stack of them on one element, or the same override at two call sites, is a review blocker. Rule 4 says where a fix lives; this says what a call site may write.
12. **Every feature is operable from the keyboard, and Escape always walks back to the Navigator.** A new surface ships its keyboard flow in the same task, not later: arrows move *within* a surface, Enter (or Right, entering a detail pane) descends into the next one, Escape ascends. **Escape is a ladder, never a jump** — it undoes the innermost state first (clear a search, then leave the field, then close the panel), one step per press, so pressing it enough times from anywhere in the app lands on the Navigator; that is the app's home focus and the guarantee users lean on. A handler that swallows Escape must have actually consumed a step (`stopPropagation` only after handling it), or the ladder breaks above it. An opening surface puts focus somewhere useful (base-ui `initialFocus`) and closing returns it to the trigger. Nothing may trap focus in a leaf with no way out. **Keys are registered with `useHotkey`/`useHotkeys` from `@tanstack/react-hotkeys`** — never a hand-rolled `addEventListener` and never a container's `onKeyDown` (which also drags a11y roles onto plain wrappers): `target` scopes a binding to one element's ref, so in-surface navigation and app-wide shortcuts use the same hook and show up together in its devtools.
13. **Holding ⌘ reveals the shortcuts.** Every shortcut a surface answers to becomes visible when the user holds ⌘ for a beat and disappears on release — hints sit on the controls they fire, drawn with the kit `shortcuts.tsx` glyphs ([patterns.md](patterns.md)), never gathered into a separate cheatsheet the user has to go find. A shortcut with nowhere to appear is undiscoverable and does not count as shipped. Show only what fires in the current context (gate Electron-only ones on `window.electron`, hide what is disabled), and reserve or overlay the space — revealing a hint must not reflow the row it sits in.
