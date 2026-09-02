# Colors & surfaces

## Three darkness levels

| Level | Tokens | Use |
|---|---|---|
| 1 canvas | `bg-body` | App background, tab-bar strip, sidebar backdrop (sidebar naked — no card) |
| 2 surface | `bg-background`, `bg-card` | Window pane (`rounded-xl border shadow`), active tab, grouped lists |
| 3 elevated | `bg-input`, `bg-popover` | Buttons, inputs, chips, menus, active segmented pill |

- Glass floating chrome: `bg-popover/70` + `backdrop-blur` + `ring-foreground/4`.
- Table-page dock: no shared shell — `pointer-events-none` row, each control self-surfaced so gaps click through.

## Shadows

Kit overrides `--shadow-*` (macOS diffuse, deliberately faint). Use `shadow-xs`…`shadow-2xl`; never inline `shadow-[...]` or re-darken. Menu-like popups take `shadow-xl` ([patterns.md](patterns.md)); `shadow-lg` on them read as flat. Dark elevation reads from the `ring-[0.5px] ring-foreground/4` hairline, not shadow — don't "fix" a flat dark panel by stacking shadow utilities.

## Accent, muted, and the tint rule

- `--accent` is an **alpha tint** (~5%), not a surface color: the hover/selected fill on any surface, plain, no per-surface alpha modifiers.
- `--muted` = static darker backgrounds only (skeletons, code blocks, pills), **never** a hover state. It is an asymmetric per-theme pair — prefer it on level-2/3 surfaces. Kbd chips use `bg-foreground/5` instead.
- Filled controls hover via foreground-mix (accent reads too dark on light buttons). Latched icon toggle `bg-foreground/10 text-foreground` — never `text-primary` on top (blue glyph on grey chip reads as two competing signals).
- Solid selection stays solid: Finder-style `bg-primary` active row. Zebra rows `bg-foreground/3`.
- **Rows on a level-2 card elevate, not tint** (`hover:bg-popover`) — black tint over a near-white card reads as grime. Rows on the canvas keep `bg-accent`. Dense full-bleed lists are the exception: light theme puts only 1.4% between `--background` and `--popover`, so there `hover:bg-accent` with `bg-foreground/10` for selection ([patterns.md](patterns.md), query logger).

## Cell highlights (data table)

Blue/neutral family only. Strokes via the cell's built-in **`inset-ring`** slot (outer rings bleed onto neighbors), never `ring-2`. Draft `bg-primary/12 inset-ring-primary/30 italic`; editing `bg-primary/8 inset-ring-primary/60`; error `bg-destructive/10 inset-ring-destructive/40`.

## Token definitions in globals

Every color token is a **literal `oklch()`** — never `var(--other-token)`; an alias inherits whatever the source token later gains (alpha included). Only permitted `var()`: `--surface-alpha`, only on `--body`. `.dark` carries only tokens whose values differ.

## Window translucency (`--surface-alpha`)

One knob: only `--body` carries the alpha (1 web/fullscreen, 0.6 mac light, 0.7 mac dark — dark needs more; same transparency reads muddier). **`--background` stays opaque** — it is reused as paint (tooltip text, avatar rings, toast `/80`), so alpha on it leaks everywhere. No per-call-site `bg-body/85` softeners (alphas multiply). Never reuse `--body` as text/ring/border or behind `/N`.

- **Modals are opaque**: `backdrop-filter` can't sample the OS vibrancy behind the page. Translucency rules opt out with `:not(:has([data-slot$='-overlay']))` on the root — affordable only while hot paths render no `data-slot` per row; **re-check if a virtualized list ever does** (fallback = marker class).
- **Fullscreen is opaque** (`window-fullscreen` class from `useWindowFullscreenObserver`); write the gate as `:not(.window-fullscreen)` on the translucent rules — a separate override block loses on specificity.

## Text selection

`::selection` is `bg-primary/30 text-primary`; on a solid-primary surface it flips to `bg-white/90 text-primary` in globals. That selector must match the *slot*, not a class — surfaces are often painted by a parent's variant, leaving no class on the text's element. Any new solid-primary surface painted that way needs adding there.
