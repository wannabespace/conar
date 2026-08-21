# Colors & surfaces

## Three darkness levels

| Level | Tokens | Use |
|---|---|---|
| 1 canvas | `bg-body` | App background, tab-bar strip, sidebar backdrop (sidebar is naked — no card) |
| 2 surface | `bg-background`, `bg-card` | Window pane (`rounded-xl border shadow`), active tab, grouped lists |
| 3 elevated | `bg-input`, `bg-popover` | Buttons, inputs, chips, menus, active segmented pill |

- Glass floating chrome: `bg-popover/70` + `backdrop-blur` + hairline `ring-foreground/4` (menus, comboboxes, toasts).
- Table-page dock: no shared shell — `pointer-events-none` row, `*:pointer-events-auto`, each control self-surfaced so gaps click through. Drafts controls render inline in this row (width-collapse cluster), never a separate toolbar.
- No `sidebar-*` tokens (removed): sidebar uses the regular tokens.

## Shadows

Kit overrides `--shadow-*` in globals (big blur, alpha 0.02–0.10, macOS diffuse — deliberately faint). Use `shadow-xs`…`shadow-2xl`; never inline `shadow-[...]` or re-darken. They are pure black in **both** themes, so on dark surfaces they do almost nothing — dark elevation reads from `ring-1 ring-foreground/4`, not from the shadow. Don't "fix" a flat-looking dark panel by stacking shadow utilities.

## Accent, muted, and the tint rule

**`--accent` is an alpha tint, not a surface color**: `oklch(0 0 0 / 5%)` light, `oklch(1 0 0 / 6%)` dark — same black-tint/white-tint construction as `--border`. It shifts *whatever surface it lands on* by a fixed step (ΔL ≈ 0.045–0.05) and reads identically on `bg-body`, `bg-card`, and `bg-popover` in both themes. So `bg-accent` is the hover/selected fill everywhere, plain, with **no per-surface alpha** — no `/50`, no `/60`.

It used to be opaque (light 0.92, dark 0.37), and that was a real bug worth recognizing by shape: over `--body` the light step was ΔL 0.045 but the dark step was **0.153**, so one class whispered in light and shouted in dark. Call sites had grown opposite softeners to compensate — `/60` in menus (too dark on the white popover), `/50` in sidebar rows (too light on the dark canvas). **Two workarounds correcting in opposite directions means the token is wrong, not the usages.** Same test applies to any token: if call sites keep dialing their own alpha, fix the token.

**Token semantics (owner rule):**
- `--accent` — hover/focus/selected fills of interactive elements, on any surface.
- `--muted` — static darker backgrounds only (skeletons, kbd chips, code blocks, count pills, section fills). Never a hover state. Still an opaque per-theme pair, and it carries the same asymmetry accent had (light Δ −0.05 vs body, dark Δ −0.018) — a muted chip on the dark canvas is nearly invisible. Prefer it on level-2/3 surfaces; treat a fix here as pending work, not settled design.
- Filled controls (buttons/selects) hover via the foreground-mix construction instead (see patterns.md) — accent read too dark on light-mode buttons.
- A latched/selected icon toggle needs more than hover: hover is `bg-accent` (≈5%), latched is `bg-foreground/10` — the same tint at double strength, lining up with the ghost Button's own `hover:bg-foreground/5`.
- Solid selection stays solid: Finder-style `bg-primary text-primary-foreground` for an active row, unaffected by the tint rules. Idle sidebar glyphs `text-primary/75`. Zebra rows `bg-foreground/3`.
- **Rows sitting *on* a level-2 card elevate instead of tinting** (owner call, connections list): `hover:bg-popover`, not `bg-accent`. A black tint over an already-near-white card reads as grime, not highlight; lifting card → popover keeps hover pointing the same way the three levels do. Accept that light mode is a small step (ΔL 0.014) — level 2 sits 1.4% under white, so lightening has no more headroom there; dark mode gets ΔL 0.03. Rows on the canvas itself (`bg-body`, e.g. `last-opened-resources.tsx`) keep `bg-accent` — the tint has room there and reads right.

## Cell highlights (data table)

Blue/neutral family only (yellow and faint-neutral both rejected). Strokes use the cell's built-in **`inset-ring`** slot (inset so adjacent highlighted cells never overlap strokes — outer rings/shadows bleed onto neighbors), never `ring-2`.

- Draft: `bg-primary/12 inset-ring-primary/30 italic` (italic = unsaved/preview cue, same as preview tabs)
- Editing: `bg-primary/8 inset-ring-primary/60`
- Error: `bg-destructive/10 inset-ring-destructive/40`

## Token definitions in globals

Every color token is a **literal `oklch()`** — never `var(--another-token)`. Two tokens that happen to share a value (`--card` vs `--background`, `--input` vs `--popover`, the three status foregrounds) each keep their own literal. Aliasing was tried and rejected on two counts:

1. **It stops reading like a shadcn palette.** The value of a token should be visible on its own line; chasing `var()` hops to learn what `--card` actually is makes the block unreviewable at a glance.
2. **Aliases capture things you didn't mean to inherit.** `--card: var(--background)` looks value-identical, but `--background` carries `var(--surface-alpha)`, so `bg-card` silently went translucent on macOS. A pure-looking dedupe changed rendered output.

The one permitted `var()` inside a color is `--surface-alpha` (below), and it appears only on the two tokens that are meant to be translucent.

`.dark` still carries **only the tokens whose values actually differ** — `--primary`, `--primary-foreground`, and `--chart-1…4` are identical in both themes and live in `:root` alone. That's the safe kind of dedupe: what remains is still a literal, and a token restated in both blocks is a token that drifts.

## Window translucency (`--surface-alpha`)

macOS vibrancy is one knob, not a second palette: `--body` and `--background` carry their alpha as `oklch(L C H / var(--surface-alpha))`, and only the alpha is overridden per platform.

```css
:root { --surface-alpha: 1; }
.electron.mac:not(.window-fullscreen) { --surface-alpha: 0.6; }
.electron.mac.dark:not(.window-fullscreen) { --surface-alpha: 0.7; }
```

Dark needs the higher value (0.7) — the same transparency reads much muddier over a dark backdrop. Never re-declare the color values in the `.electron.mac*` blocks, and don't add per-call-site `bg-body/85`-style softeners (the old approach): the token already carries the translucency, so a modifier multiplies alphas and the window goes see-through twice.

**`--background` is only for surfaces sitting on the window** — never as a text or icon color. On inverted chrome (tooltip: `bg-foreground`), `text-background` renders at the surface alpha on desktop (50–75% gray instead of white), and any `opacity-*` on a child multiplies it further. Use `text-card` — same lightness, opaque literal (kit tooltip and its embedded `Kbd` were bitten by exactly this).

**Modals are opaque too.** `backdrop-filter` only samples the *page's* composited pixels, while the vibrancy material lives outside the page — so blurring semi-transparent surfaces smears their alpha and leaves the sharp OS-blurred desktop showing through underneath. No backdrop color or blur radius fixes it; you either drop the blur or drop the translucency for the duration. The translucency rules opt out with `:not(:has([data-slot$='-overlay']))`, which matches the kit's four modal overlays (dialog, alert-dialog, sheet, drawer) and nothing else in the repo — no marker class, no observer, both of which were tried and removed.

The `:has()` sits on the root element, so its cost is worth knowing: Blink keys `:has()` invalidation sets on the attribute *name*, meaning any element carrying `data-slot` mounting or unmounting schedules a style recalc of `<html>`. That is affordable here only because the hot paths are clean — `packages/table` renders zero `data-slot` attributes, and navigator rows carry them only via tooltip triggers — and because the recomputed root style is identical, so nothing propagates. **Re-check that if a virtualized list ever starts rendering `data-slot` per row**; the fallback is a dedicated marker class, whose invalidation set keys to the class alone.

**Fullscreen is opaque.** `vibrancy: 'under-window'` has nothing behind it in macOS fullscreen, so translucent surfaces just wash out — `useWindowFullscreenObserver` (`apps/app/src/use-window-fullscreen-observer.ts`, wired in `__root.tsx` beside `useWindowFocusObserver`) toggles `window-fullscreen` on `documentElement` and the `:not()` puts the knob back to 1.

Write that gate as `:not(.window-fullscreen)` on the *translucent* rules, never as a separate `.electron.window-fullscreen { --surface-alpha: 1 }` override — that override is specificity 0,2,0 and loses to `.electron.mac.dark` (0,3,0), so dark mode would stay translucent in fullscreen. `:not()` takes its argument's specificity, keeping each rule strictly above the one it must beat regardless of source order.
