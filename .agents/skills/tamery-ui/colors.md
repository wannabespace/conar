# Colors & surfaces

## Three darkness levels

| Level | Tokens | Use |
|---|---|---|
| 1 canvas | `bg-body` | App background, tab-bar strip, sidebar backdrop (sidebar naked — no card) |
| 2 surface | `bg-background`, `bg-card` | Window pane, grouped lists, active tab |
| 3 elevated | `bg-input`, `bg-popover` | Buttons, inputs, chips, menus, active segmented pill |

- Level-2 and level-3 boxes take `rounded-xl` + the control hairline `ring ring-foreground/4`, never `border`: both are 0.5px in this repo, but a border lives inside the box and takes layout space while the ring sits outside it. Never `ring-[0.5px]`/`ring-1`. Panes take no shadow, grouped lists `shadow-xs`.
- **A card inside a level-2 pane must be level 3** (`bg-popover`): `--card` and `--background` are the same value, so a `bg-card` block on a pane shows only its hairline and reads as unlayered.
- Glass floating chrome: `bg-popover/70` + `backdrop-blur` + `ring-foreground/4`.
- Table-page dock: no shared shell — a `pointer-events-none` row of self-surfaced controls, so the gaps click through.

## Shadows

Kit overrides `--shadow-*` (macOS diffuse). Use the scale; never inline `shadow-[...]` and never re-darken at a call site — a popup that reads flat is a token problem, fixed once in globals.css. The scale splits in two: **control tiers** (`2xs`…`sm`) stay near-invisible in both themes — they are the lip on a field, not a lift; **elevated tiers** (`md`…`2xl`) separate a floating panel from what is under it, and dark overrides them far heavier, because a shadow tuned for white is gone on a dark ground. Menu-like popups take `shadow-xl`. The hairline defines a popup's edge but carries no elevation on its own — the app stacks level-3 on level-3 (a `bg-popover` menu over a `bg-popover` card), where only the shadow says which one floats.

## Accent, muted, and the tint rule

- `--accent` is the **hover surface**: always `bg-accent`, never a per-call-site colour, never an alpha tint. The light levels span only a few points of lightness, so one absolute value cannot sit the same distance from all three — globals.css therefore re-declares `--accent` per level surface (light only), so every level hovers the same step past itself and call sites stay unchanged. Translucent mac canvas (light) gets its own darker `--accent` on the same gate as `--surface-alpha`: vibrancy blends the canvas down to roughly the web accent, so the default hover vanishes there. A tint instead reads as grime over a near-white card, changes strength with whatever is behind it, and lets content under a floating control show through it.
- **Every row and control hovers to `bg-accent`** — ghost and outline buttons, select and number-field triggers, kit `TableRow`, connection rows, navigator and recents rows. A table is not special enough for a quieter hover of its own. Where a list also carries a keyboard cursor, the highlight goes to `bg-foreground/10` so it still reads louder than hover; dense full-bleed lists (query logger) do the same, since light theme leaves almost nothing between `--background` and `--popover`.
- A control inside a row that already hovers to `bg-accent` hovers and opens to a foreground tint (`bg-foreground/5`–`/10`), never `bg-accent`: the kit's `bg-accent` vanishes on the hovered row.
- `--muted` = static darker backgrounds only (empty-state and avatar tiles, inline mono pills), **never** a hover state, and never code blocks — a fenced block reads on the pane it sits on, or on the field surface when it sits in a form ([patterns.md](patterns.md)). It is an asymmetric per-theme pair, so prefer it on level-2/3 surfaces. Skeleton fills use `bg-foreground/10`, because dark `--muted` sits too close to `--body` to show on the canvas.
- Latched icon toggle is `bg-foreground/10 text-foreground`, carried by the `ghost`/`outline` variants on `aria-pressed` — a toggle sets the attribute and never a className, and never adds `text-primary` on top (a blue glyph on a grey chip is two competing signals).
- Solid selection stays solid: Finder-style `bg-primary` active row. Zebra rows `bg-foreground/3`.
- **The hairline darkens with the hover fill**: any control carrying `ring ring-foreground/4` goes to `/12` on hover and while its popup is open — a control that lightens its fill but keeps a 4% edge reads as unlit. Static panes and popups keep `/4`; they are not hovered. **The checkbox is the exception and rides `/20` → `/35`**: it is the only control whose whole affordance is its hairline, so a 4% edge on a 16px white box disappears.

## Status surfaces (alerts, banners)

`destructive` / `success` share one recipe — `border-<token>/25 bg-<token>/10 text-<token>`, description at `/90`. The surface is the signal, so it has to read as tinted at a glance.

**An invalid field states its problem once**: the message carries `text-destructive` and the control carries the `aria-invalid` ring; the label stays `foreground`. Tinting the whole field cascades into every descendant without a colour of its own and makes one error shout three times.

## Cell highlights (data table)

Blue/neutral family only. Strokes go through the cell's built-in **`inset-ring`** slot (outer rings bleed onto neighbours), never `ring-2`. Draft, editing and error each pair a faint fill with a stronger inset ring; draft is also italic.

## Token definitions in globals

- Every colour token is a **literal `oklch()`** — never `var(--other-token)`; an alias inherits whatever the source token later gains, alpha included. The only permitted `var()` is `--surface-alpha`, only on `--body`. `.dark` carries only tokens whose values differ.
- **One translucency knob**: only `--body` carries the alpha (opaque on web and fullscreen, lower on mac, lower still in dark — the same value reads muddier there). **`--background` stays opaque**: it is reused as paint (tooltip text, avatar rings, toast fills), so alpha on it leaks everywhere. No per-call-site `bg-body/85` softeners — alphas multiply. Never reuse `--body` as text, ring or border, or behind `/N`; the one exception is `apps/main`, web-only so its alpha is always 1, whose shell mask has to be the canvas colour exactly.
- **Modals and fullscreen are opaque.** `backdrop-filter` cannot sample the OS vibrancy behind the page, so translucency rules opt out with `:not(:has([data-slot$='-overlay']))` on the root — affordable only while hot paths render no `data-slot` per row; **re-check if a virtualized list ever does** (fallback = a marker class). The fullscreen gate is `:not(.window-fullscreen)` on the same rules — a separate override block loses on specificity.

## Text selection

`::selection` is `bg-primary/30 text-primary`, flipping to white on a solid-primary surface. That selector must match the *slot*, not a class — surfaces are often painted by a parent's variant, leaving no class on the text's own element, so any new solid-primary surface needs adding there.
