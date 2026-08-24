# Colors & surfaces

## Three darkness levels

| Level | Tokens | Use |
|---|---|---|
| 1 canvas | `bg-body` | App background, tab-bar strip, sidebar backdrop (sidebar naked — no card) |
| 2 surface | `bg-background`, `bg-card` | Window pane (`rounded-xl border shadow`), active tab, grouped lists |
| 3 elevated | `bg-input`, `bg-popover` | Buttons, inputs, chips, menus, active segmented pill |

- Glass floating chrome: `bg-popover/70` + `backdrop-blur` + hairline `ring-foreground/4` (menus, comboboxes, toasts).
- Table-page dock: no shared shell — `pointer-events-none` row, `*:pointer-events-auto`, each control self-surfaced so gaps click through. Drafts controls render inline in this row (width-collapse cluster), never a separate toolbar.
- No `sidebar-*` tokens (removed): regular tokens.

## Shadows

Kit overrides `--shadow-*` in globals (big blur, alpha 0.02–0.10, macOS diffuse — deliberately faint). Use `shadow-xs`…`shadow-2xl`; never inline `shadow-[...]` or re-darken. Pure black in **both** themes → near-nothing on dark surfaces; dark elevation reads from `ring-1 ring-foreground/4`, not shadow. Don't "fix" a flat dark panel by stacking shadow utilities.

## Accent, muted, and the tint rule

**`--accent` is an alpha tint, not a surface color**: `oklch(0 0 0 / 5%)` light, `oklch(1 0 0 / 6%)` dark — same construction as `--border`. Shifts whatever surface it lands on by a fixed step (ΔL ≈ 0.045–0.05), identical on `bg-body`/`bg-card`/`bg-popover` in both themes. `bg-accent` = hover/selected fill everywhere, plain, **no per-surface alpha** — no `/50`, no `/60`. (It was opaque once — light 0.92, dark 0.37 — whispered in light, shouted in dark; call sites grew opposite softeners. **Two workarounds correcting in opposite directions = the token is wrong, not the usages.**)

**Token semantics (owner rule):**
- `--accent` — hover/focus/selected fills of interactive elements, any surface.
- `--muted` — static darker backgrounds only (skeletons, code blocks, count pills, section fills). Never a hover state. Kbd chips left it for `bg-foreground/5` + `text-muted-foreground/80` (kit `kbd.tsx`) — a `bg-muted` chip printed a dark slab in light mode, vanished in dark; the alpha tint is one step on any surface, landing at the same 5% as ghost Button hover. Tooltip and input-group overrides on that chip still win. `--muted` remains an opaque per-theme pair with accent's old asymmetry (light Δ −0.05 vs body, dark Δ −0.018) — muted chip on the dark canvas nearly invisible. Prefer on level-2/3 surfaces; treat a fix here as pending work.
- Filled controls (buttons/selects) hover via foreground-mix (patterns.md) — accent read too dark on light-mode buttons.
- Latched/selected icon toggle: hover `bg-accent` (≈5%), latched `bg-foreground/10` — same tint, double strength, lines up with ghost Button `hover:bg-foreground/5`.
- Solid selection stays solid: Finder-style `bg-primary text-primary-foreground` active row, unaffected by tint rules. Idle sidebar glyphs `text-primary/75`. Zebra rows `bg-foreground/3`.
- **Rows on a level-2 card elevate instead of tinting** (owner call, connections list): `hover:bg-popover`, not `bg-accent` — black tint over a near-white card reads as grime; lifting card → popover follows the three levels. Light mode is a small step (ΔL 0.014 — no headroom under white), dark ΔL 0.03. Rows on the canvas itself (`bg-body`, e.g. `last-opened-resources.tsx`) keep `bg-accent`.

## Cell highlights (data table)

Blue/neutral family only (yellow and faint-neutral rejected). Strokes via the cell's built-in **`inset-ring`** slot (inset → adjacent highlighted cells never overlap strokes; outer rings/shadows bleed onto neighbors), never `ring-2`.

- Draft: `bg-primary/12 inset-ring-primary/30 italic` (italic = unsaved/preview cue, same as preview tabs)
- Editing: `bg-primary/8 inset-ring-primary/60`
- Error: `bg-destructive/10 inset-ring-destructive/40`

## Token definitions in globals

Every color token is a **literal `oklch()`** — never `var(--another-token)`. Value-equal tokens (`--card` vs `--background`, `--input` vs `--popover`, the three status foregrounds) each keep their own literal. Aliasing tried and rejected: it stops reading like a shadcn palette (chasing `var()` hops), and aliases capture unintended inheritance — `--card: var(--background)` silently went translucent when `--background` carried `var(--surface-alpha)`. The one permitted `var()` inside a color: `--surface-alpha`, only on `--body`.

`.dark` carries **only tokens whose values differ** — `--primary`, `--primary-foreground`, `--chart-1…4` are identical and live in `:root` alone (safe dedupe: still a literal; a token restated in both blocks drifts).

## Window translucency (`--surface-alpha`)

macOS vibrancy is one knob: only `--body` carries its alpha as `oklch(L C H / var(--surface-alpha))`; only the alpha is overridden per platform.

```css
:root { --surface-alpha: 1; }
.electron.mac:not(.window-fullscreen) { --surface-alpha: 0.5; }
.electron.mac.dark:not(.window-fullscreen) { --surface-alpha: 0.7; }
```

Dark needs the higher value (0.7) — same transparency reads muddier over a dark backdrop. Never re-declare color values in the `.electron.mac*` blocks; no per-call-site `bg-body/85` softeners (modifier multiplies alphas — window goes see-through twice).

**`--background` is opaque; `--body` alone is translucent** (owner call). Alpha on `--background` leaked everywhere the token was reused as paint — `text-background` tooltip text went 50–75% gray, avatar `ring-background` cut-outs let neighbors bleed through, `bg-background/80` toasts multiplied down to 0.4. Don't reintroduce `var(--surface-alpha)` on other tokens; don't reuse `--body` as text/ring/border color or behind `/N` modifiers (alpha bakes in at `:root`; no descendant `--surface-alpha` reset can undo it).

**Modals are opaque too.** `backdrop-filter` only samples the *page's* composited pixels; the vibrancy material lives outside the page — blurring semi-transparent surfaces smears their alpha and leaves the sharp OS-blurred desktop showing through. No backdrop color or blur radius fixes it. Translucency rules opt out with `:not(:has([data-slot$='-overlay']))` — matches the kit's four modal overlays (dialog, alert-dialog, sheet, drawer) and nothing else (marker class and observer tried, removed).

The `:has()` sits on the root: Blink keys `:has()` invalidation sets on the attribute *name*, so any `data-slot` element mounting/unmounting schedules a style recalc of `<html>`. Affordable only because hot paths are clean (`packages/table` renders zero `data-slot`; navigator rows only via tooltip triggers) and the recomputed root style is identical. **Re-check if a virtualized list ever renders `data-slot` per row**; fallback = dedicated marker class (invalidation keys to the class alone).

**Fullscreen is opaque.** `vibrancy: 'under-window'` has nothing behind it in macOS fullscreen — `useWindowFullscreenObserver` (`apps/app/src/use-window-fullscreen-observer.ts`, wired in `__root.tsx` beside `useWindowFocusObserver`) toggles `window-fullscreen` on `documentElement`; the `:not()` puts the knob back to 1. Write the gate as `:not(.window-fullscreen)` on the *translucent* rules, never a separate `.electron.window-fullscreen { --surface-alpha: 1 }` override — that's specificity 0,2,0 and loses to `.electron.mac.dark` (0,3,0); `:not()` takes its argument's specificity, keeping each rule above the one it must beat regardless of source order.
