# Colors & surfaces

## Three darkness levels

| Level | Tokens | Use |
|---|---|---|
| 1 canvas | `bg-body` | App background, tab-bar strip, sidebar backdrop (sidebar naked — no card) |
| 2 surface | `bg-background`, `bg-card` | Window pane and grouped lists — `rounded-xl` + the control hairline `ring ring-foreground/4` (bare `ring` is 0.5px via `--default-ring-width` in `globals.css`; never `ring-[0.5px]` or `ring-1`), never `border` (bare `border` is also 0.5px via `--default-border-width`, but it lives inside the box and takes layout space; the ring sits outside it); panes take no shadow, grouped lists `shadow-xs`. Also active tab |
| 3 elevated | `bg-input`, `bg-popover` | Buttons, inputs, chips, menus, active segmented pill |

- **A card inside a level-2 pane must be level 3** (`bg-popover`): `--card` and `--background` are the same value, so a `bg-card` block on a pane shows only its hairline and reads as unlayered.
- Glass floating chrome: `bg-popover/70` + `backdrop-blur` + `ring-foreground/4`.
- Table-page dock: no shared shell — `pointer-events-none` row, each control self-surfaced so gaps click through.

## Shadows

Kit overrides `--shadow-*` (macOS diffuse). Use `shadow-xs`…`shadow-2xl`; never inline `shadow-[...]` or re-darken at the call site — a popup that reads flat is a token problem, fixed once in `globals.css`, never by stacking shadow utilities on one component. The scale splits in two: **control tiers** (`2xs`…`sm`) stay near-invisible in both themes — they are the lip on a field, not a lift; **elevated tiers** (`md`…`2xl`) have to separate a floating panel from the surface under it, and `.dark` overrides them with far heavier black (xl at 0.5 vs 0.16) because a shadow tuned for white is gone on a dark ground. Menu-like popups take `shadow-xl` ([patterns.md](patterns.md)); `shadow-lg` on them read as flat. The `ring ring-foreground/4` hairline defines a popup's edge; it does not carry elevation on its own — the app stacks level-3 surfaces on level-3 cards (a `bg-popover` menu over the definitions `bg-popover` card), where fill and hairline are identical on both sides and only the shadow says which one floats.

## Accent, muted, and the tint rule

- `--accent` is the **hover surface**: always `bg-accent`, never a per-call-site colour. In light theme the levels span 3.5 points of lightness (`--body` 0.9651 → `--popover` 1), so one absolute value cannot sit the same distance from all three — it reads as grime on the white definitions card or vanishes on the canvas. `globals.css` therefore re-declares `--accent` on `.bg-background`/`.bg-card` and on `.bg-popover` (light only; dark keeps the single `.dark` value), so every level hovers ~3.5 points past itself and call sites stay unchanged. Never an alpha tint and never `bg-accent/N`: a tint reads as grime over a near-white card, changes strength with whatever sits behind it, and lets the content under a floating control (the table dock over its rows) show through the hovered button.
- `--muted` = static darker backgrounds only (empty-state and avatar tiles, inline mono pills), **never** a hover state. Not code blocks: a fenced block reads on the pane it sits on (query logger, code dialog) or on the field surface when it sits in a form ([patterns.md](patterns.md)). It is an asymmetric per-theme pair — prefer it on level-2/3 surfaces. Kbd chips use `bg-foreground/5` instead; skeleton fills use `bg-foreground/10` — dark `--muted` sits 0.01 lightness off `--body`, so a skeleton on the canvas disappears.
- Filled controls hover to `bg-accent` like everything else (the old per-control foreground-mix is gone). Latched icon toggle `bg-foreground/10 text-foreground` — the `ghost` and `outline` button variants carry it on `aria-pressed`, so a toggle states its pressed state by setting that attribute and never by a call-site className; never `text-primary` on top (blue glyph on grey chip reads as two competing signals).
- Solid selection stays solid: Finder-style `bg-primary` active row. Zebra rows `bg-foreground/3`.
- **The hairline darkens with the hover fill**: any control carrying `ring ring-foreground/4` — outline button, select and number-field triggers, input, input-group, combobox chips, field card — goes to `ring-foreground/12` on hover (and while its popup is open). A control that lightens its fill but keeps a 4% edge reads as unlit; the ring moves with the surface. Static panes and popups keep `/4` — they are not hovered. **The checkbox is the exception and rides `/20` → `/35`**: it is the only control whose whole affordance is its hairline — no label, no width, no glyph until checked — so a 0.5px 4% edge on a 16px box against `--input` white disappears, worst inside a table cell.
- **Every row and control hovers to `bg-accent`** — buttons (ghost and outline), select and number-field triggers, kit `TableRow`, connection rows on a card, navigator and recents rows. A table is not special enough to get a quieter hover of its own. Where a list also carries a keyboard cursor, the highlight goes to `bg-foreground/10` so it still reads louder than hover. Dense full-bleed lists are the exception: light theme puts only 1.4% between `--background` and `--popover`, so there `hover:bg-accent` with `bg-foreground/10` for selection ([patterns.md](patterns.md), query logger).

## Status surfaces (alerts, banners)

`destructive` / `success` share one recipe — `border-<token>/25 bg-<token>/10 text-<token>`, description at `/90`. The surface is the signal, so it has to read as tinted at a glance (a `/5` fill on the near-white pane reads as a plain grey card).

**An invalid field states its problem once.** The message carries `text-destructive` and the control carries the `aria-invalid` ring; the label stays `foreground`. Tinting the whole field — a `data-[invalid=true]:text-destructive` on the field group cascades into every descendant without a colour of its own — repaints the label red so one error shouts three times.

## Cell highlights (data table)

Blue/neutral family only. Strokes via the cell's built-in **`inset-ring`** slot (outer rings bleed onto neighbors), never `ring-2`. Draft `bg-primary/12 inset-ring-primary/30 italic`; editing `bg-primary/8 inset-ring-primary/60`; error `bg-destructive/10 inset-ring-destructive/40`.

## Token definitions in globals

Every color token is a **literal `oklch()`** — never `var(--other-token)`; an alias inherits whatever the source token later gains (alpha included). Only permitted `var()`: `--surface-alpha`, only on `--body`. `.dark` carries only tokens whose values differ.

## Window translucency (`--surface-alpha`)

One knob: only `--body` carries the alpha (1 web/fullscreen, 0.4 mac light, 0.5 mac dark — dark needs more; same transparency reads muddier). **`--background` stays opaque** — it is reused as paint (tooltip text, avatar rings, toast `/80`), so alpha on it leaks everywhere. No per-call-site `bg-body/85` softeners (alphas multiply). Never reuse `--body` as text/ring/border or behind `/N` — with one exception, `apps/main`, which is web-only so `--surface-alpha` is always 1 there: its page shell paints the inverted corners above and below the content pane with `ring-body ring-50`, and that mask has to be the canvas colour exactly.

- **Modals are opaque**: `backdrop-filter` can't sample the OS vibrancy behind the page. Translucency rules opt out with `:not(:has([data-slot$='-overlay']))` on the root — affordable only while hot paths render no `data-slot` per row; **re-check if a virtualized list ever does** (fallback = marker class).
- **Fullscreen is opaque** (`window-fullscreen` class from `useWindowFullscreenObserver`); write the gate as `:not(.window-fullscreen)` on the translucent rules — a separate override block loses on specificity.

## Text selection

`::selection` is `bg-primary/30 text-primary`; on a solid-primary surface it flips to `bg-white/90 text-primary` in globals. That selector must match the *slot*, not a class — surfaces are often painted by a parent's variant, leaving no class on the text's element. Any new solid-primary surface painted that way needs adding there.
