# Colors & surfaces

## Three darkness levels

| Level | Tokens | Use |
|---|---|---|
| 1 canvas | `bg-body` | App background, tab-bar strip, sidebar backdrop (sidebar is naked — no card) |
| 2 surface | `bg-background`, `bg-card` | Window pane (`rounded-xl border shadow`), active tab, grouped lists |
| 3 elevated | `bg-input`, `bg-popover` | Buttons, inputs, chips, menus, active segmented pill |

- Glass floating chrome: `bg-background/75–90 backdrop-blur` + hairline `border` (sticky table header, toasts).
- Table-page dock: no shared shell — `pointer-events-none` row, `*:pointer-events-auto`, each control self-surfaced so gaps click through. Drafts controls render inline in this row (width-collapse cluster), never a separate toolbar.
- No `sidebar-*` tokens (removed): sidebar uses `bg-accent`, `text-foreground`, `ring-ring`, `bg-border`.

## Shadows

Kit overrides `--shadow-*` in globals (big blur, alpha 0.04–0.14, macOS diffuse). Use `shadow-xs`…`shadow-2xl`; never inline `shadow-[...]` or re-darken.

## Accent

Selection = solid `bg-primary text-primary-foreground` (Finder style); idle sidebar glyphs `text-primary/75`; everything else neutral. Zebra: `bg-foreground/3` odd rows, no row borders.

## Cell highlights (data table)

Blue/neutral family only (yellow and faint-neutral both rejected). Rings use the cell's built-in `ring-1` slot, never `ring-2`.

- Draft: `bg-primary/12 ring-primary/30 italic` (italic = unsaved/preview cue, same as preview tabs)
- Editing: `bg-primary/8 ring-primary/60`
- Error: `bg-destructive/10 ring-destructive/40`
