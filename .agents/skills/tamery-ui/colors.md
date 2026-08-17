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

## Cell highlights (data table)

Blue/neutral family only (yellow and faint-neutral both rejected). Strokes use the cell's built-in **`inset-ring`** slot (inset so adjacent highlighted cells never overlap strokes — outer rings/shadows bleed onto neighbors), never `ring-2`.

- Draft: `bg-primary/12 inset-ring-primary/30 italic` (italic = unsaved/preview cue, same as preview tabs)
- Editing: `bg-primary/8 inset-ring-primary/60`
- Error: `bg-destructive/10 inset-ring-destructive/40`
