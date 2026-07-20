---
name: tamery-ui
description: Tamery's UI design system and hard rules — native macOS look, three-level color system, typography tokens, motion recipes, and the kit's known gotchas. Use whenever building, restyling, or reviewing any UI in this repo (components, pages, popovers, menus, animations), before writing the first className.
---

# Tamery UI

Tamery is a native-feeling macOS database client (Electron + React + Tailwind v4 + base-ui kit in `packages/ui`). Every screen should read like an Apple app running on macOS, not a web page. These rules were established with the owner — treat the Hard Rules as non-negotiable review blockers.

## Hard rules (owner-enforced)

1. **Never use `dark:` selectors.** Colors must come from theme tokens that resolve correctly in both themes via CSS variables (`packages/ui/src/styles/globals.css`). If a token pair has no contrast in one theme (e.g. `muted` ≈ canvas in dark), pick a cross-theme construction instead:
   - neutral tint that works everywhere: `bg-foreground/5` (groove), `bg-foreground/3` (zebra)
   - elevation: `bg-input` is above `bg-background` in both themes
2. **Never use pixel font sizes** (`text-[13px]`). Use tokens only: `text-2xs` (0.6875rem, custom token in globals.css) for micro labels, `text-xs` for secondary/chips, `text-sm` for primary UI labels, `text-base`+ for headings. If a size is missing, add a rem token to `@theme` — don't inline arbitrary values.
3. **No `cursor-pointer`.** Native apps use the arrow cursor. Put `cursor-default` on links/buttons that act as controls (router `Link`s especially — the UA gives `<a>` a hand cursor). Only exceptions: text inputs (I-beam) and resize handles (`cursor-col-resize`).
4. **Fix sizing/colors at the kit level** (`packages/ui/src/components/*`) when the problem is systemic — menus, command lists, tabs — so the whole app moves together. Page-level overrides are for page-specific design only.
5. **Watch out for the global anchor rule.** `globals.css` styles `a { text-primary }` — any router `Link` styled as a UI row must explicitly set `text-foreground`/`text-sidebar-foreground` or it renders hyperlink-blue.

## Color system — three levels of darkness

| Level | Tokens | Use |
|---|---|---|
| 1 (canvas) | `bg-body` | App background, tab-bar inset strips, sidebar backdrop (sidebar is *naked* on canvas — no card) |
| 2 (surface) | `bg-background`, `bg-card` | The "window" pane (rounded-xl border shadow), active tab, grouped list containers |
| 3 (elevated) | `bg-input`, `bg-popover` | Buttons, inputs, chips, popovers, menus, active segmented-control pill |

Glass (floating chrome over data): `bg-background/75`–`/80` + `backdrop-blur-xl`, hairline `border`. Used by: sticky table column header, floating command bar, filter chip strip, drafts toolbar.

Shadows: the kit overrides Tailwind's `--shadow-*` scale in `globals.css` `@theme` — larger blur/offset, lower alpha (0.04–0.14) for macOS-style diffuse elevation. Use the standard `shadow-xs`…`shadow-2xl` classes; never inline `shadow-[...]` values or re-densify with `shadow-black/20`-style modifiers.

Accent usage: selection fills use solid `bg-primary text-primary-foreground` (Finder-style sidebar active row); idle sidebar glyphs are `text-primary/75`; everything else stays neutral. Zebra tables: `bg-foreground/3` on odd rows, **no row borders** (borders + zebra is double separation).

## Typography & density

- Primary UI labels (rows, tabs, titles, menu items): `text-sm`
- Secondary/chips/hints: `text-xs`
- Micro labels (uppercase section headers, status counts, badges): `text-2xs`, section headers add `font-semibold tracking-wider uppercase text-muted-foreground`
- Row heights: menus/list rows `min-h-7`/`h-7`, tab bar `h-8`, toolbar rows `h-11`–`h-12`, chips `h-6`
- Counts/numbers: `tabular-nums`; values/hosts/SQL: `font-mono`

## Native macOS patterns (established in this codebase)

- **Right-click context menus** over visible `⋯` buttons (sidebar rows, connection rows, tabs). Keep destructive items last, after a separator, `variant="destructive"`.
- **Menus are compact**: kit defaults are already tuned (`min-h-7 py-1 text-sm`, `rounded-2xl` container). Don't re-inflate; don't shrink further.
- **Popovers size to content**: `w-auto min-w-40` unless a search input needs room; hide `CommandInput` below ~8 items; hide group headings when only one group exists.
- **Grouped lists** (dashboard): one `rounded-xl border bg-card` container, rows with `border-b last:border-b-0`, `hover:bg-accent/50` — not per-row floating cards.
- **Tabs (Finder-style)**: content-width (`shrink-0`, no truncate — full names visible, no tooltip), each tab carries `border-b`, active gets `border-b-transparent bg-background`; bar background `bg-body/50`.
- **Floating bottom command bar** owns table-page actions: info zone (morphs to "N selected · Delete" on selection), centered AI search, 3 primary buttons + `⋯` overflow. Filter chips dock *behind* the bar and reveal on hover (see Motion).
- **Empty states**: centered soft-squircle icon (`rounded-2xl bg-muted/60`), `text-sm font-medium` title, `text-xs text-muted-foreground` hint, gentle fade/scale-in.
- **Tooltips**: plain-text shortcut hints ("⌘ + W"), never `Kbd` chips inside a dark tooltip (invisible). Never nest a tooltip trigger inside another tooltip's trigger — merge into one.
- **Copy affordances**: use `CopyButton` (kit) — it animates copy→check via `ContentSwitch`; it accepts `children` for labeled buttons. Silent `copy(text)` (no toast) when the icon morph is confirmation enough.
- **Count badges** on icon buttons: absolute `-top-1.5 -right-1.5 h-4 min-w-4 rounded-full bg-primary text-2xs` — and the Button **must get `relative overflow-visible`** (Button has no `position` by default).
- **Sidebar nav rows** outside the kit Sidebar (definitions nav, dialog format lists): use `SidebarLink`/`SidebarButton` from `~/components/sidebar-link.tsx` — Finder row `h-7 rounded-md text-sm`, solid `bg-primary text-primary-foreground` active, icons `text-primary/75` → `text-primary-foreground`.
- **Focus-stretch search field** (command bar): search sits **rightmost** (Finder-style), rendered as a right-anchored `absolute` overlay above an invisible fixed-width layout slot (`w-56`). On focus, animate ONE measured value with motion — `animate={{ width: focused ? barClientWidth - padding : REST_WIDTH }}` (px→px, ResizeObserver keeps the target fresh) — so it grows leftward across the whole bar; static clusters just fade `opacity 0.2s` beneath it. Never animate the flex siblings' widths instead: competing `max-width`/`flex-grow` transitions ease independently and look broken, and motion `layout` FLIP would distort the input's text. Blur via `relatedTarget` check + Escape-to-blur on the overlay.

## Motion

- **Use the `motion` library for interactive/interruptible animation**, not CSS transitions. CSS transitions run on wall-clock and snap to the end state when frames drop; motion redirects from the current value. This bit us on the sidebar fold.
- House curve: `ease: [0.32, 0.72, 0, 1]`, 200–300ms (Apple sheet curve). Collapse/reveal via width/transform, **no whole-panel opacity fades** (content ghosting under `overflow-hidden` clipping reads more native).
- `AnimatePresence` for mount/exit of conditional chrome (filter strip, drafts toolbar, empty states).
- **Heavy-reflow guard**: when animating a container whose child is the virtualized table, freeze the data area's inline width for the duration (`useFreezeWidthDuringSidebarFold` in the table route) so the column virtualizer re-measures once, not per frame.
- **Dock reveal recipe** (filter strip): translate down `calc(100% + gap)` behind the glass bar + `scale 0.9` + `rotateX 18` with `transformPerspective: 800` and `origin-bottom`; reveal on dock hover **and hold while any child popover is open** (count open popovers through tracked setters — controlled popovers closed programmatically don't fire `onOpenChange`). The dock container is `pointer-events-none`, so bridge the flex gap with hit-area on the strip itself (`pb-2 -mb-2`) and debounce the container's `onMouseLeave` generously (~800ms, owner-tuned) — crossing gaps or briefly slipping off the dock must not tuck the strip.
- Layout-affecting hover states are banned: nothing may shift pixels on hover — reserve space and animate `opacity`/`transform` only.

## Kit gotchas (hard-won, check before debugging)

- `CommandDialog` is only a Dialog shell — you **must** wrap contents in `<Command>` yourself or every cmdk part crashes with `undefined (reading 'subscribe')`.
- `PopoverContent` defaults to `flex flex-col gap-4 p-4 w-72 rounded-3xl` — menu-like popovers need `gap-0 p-1 rounded-2xl` and often `w-auto`.
- `CommandItem` appends a hidden `ml-auto` check icon. A second `ml-auto` child splits the free space (ragged alignment). For right-aligned meta (types, operators) use `CommandShortcut` — it also hides the check slot. Give the name span `min-w-0 flex-1 truncate`.
- Kit `Sidebar` collapsible variants are `fixed` full-viewport — inside app chrome use `collapsible="none"` in a width-animated shell driven by `useSidebar()`; persist fold via the provider cookie and width via a seitu localStorage value.
- base-ui **render prop pattern**: `<Trigger render={<Button/>}>children</Trigger>` — children land inside the rendered element. A `div role="button"` as a menu trigger needs `nativeButton={false}` and an `aria-label` (lint requires labels on empty render-prop controls).
- `InputGroup` addon sizes only **direct-child** svgs (`[&>svg]:size-4`) — an icon nested inside a wrapper (e.g. `LoadingContent`) renders at remixicon's 24px default and gets clipped; give it an explicit `size-4`. Don't widen the kit selector to descendants — it would fight `InputGroupButton`'s own svg sizing.
- `InputGroup` defaults to `border-transparent bg-input` — invisible on white-ish surfaces (glass bar, `bg-background` pane). Add `border-border` per instance (or in the wrapping custom component, as `SearchInput` does).
- TanStack Router `Link` **concatenates** `activeProps.className` with the base className — no tailwind-merge — so conflicting utilities (base `text-sidebar-foreground` vs active `text-primary-foreground`) resolve by stylesheet order, not intent. Style active state with `data-[status=active]:` variants in a single className instead. `~/components/sidebar-link.tsx` (`SidebarLink`/`SidebarButton`) already encodes this — reuse it for sidebar-style nav rows.
- CSS transitions can't interpolate between a length and a percentage — `max-w-64 → max-w-full` snaps. Keep both endpoints in rem (`max-w-64 → max-w-3xl`).
- Hotkeys: always `e.preventDefault()` (⌘P otherwise opens the browser print dialog).
- `tanstack-db` live queries: don't `inArray()` against a reactive array from outside the query — join broadly and filter client-side; prune stale ids kept in localStorage against the live collection (guard against the empty first frame).
- `getOS(navigator.userAgent)` for ⌘ vs Ctrl in labels.

## Reference implementations

- Table page composition: `apps/app/src/routes/_protected/connection/$resourceId/table/index.tsx`
- Floating command bar / filter dock / tab bar / virtualized sidebar tree: `apps/app/src/entities/connection/table/components/page/`
- Column header menu: `apps/app/src/entities/connection/table/components/table/table-header-cell.tsx`
- Grouped list + context menu: `apps/app/src/routes/_protected/-components/connections-list.tsx`
- Naked sidebar + window pane layout (non-table page): `apps/app/src/routes/_protected/connection/$resourceId/definitions.tsx` + its `-components/sidebar.tsx`
- Error page (empty-state voice): `apps/app/src/error-page.tsx`

## Companion skills

For deeper design thinking, combine with the repo's other skills: `apple-design` (fluid/physical motion principles), `emil-design-eng` (polish and invisible details), `design-an-interface` (exploring alternatives). This skill wins on any conflict — it encodes the owner's decisions.
