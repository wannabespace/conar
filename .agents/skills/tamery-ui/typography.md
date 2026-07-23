# Typography, density & radius

- Fonts: Geist / Geist Mono (fontsource, globals.css). Monaco's `fontFamily` in `monaco.tsx` must stay in sync with `--font-mono`.
- `text-sm` primary labels (rows, tabs, menu items) · `text-xs` secondary/chips · `text-2xs` micro labels; section headers add `font-semibold tracking-wider uppercase text-muted-foreground`
- Row heights: menu/list rows `h-7`, tab bar `h-8`, toolbars `h-11`–`h-12`, chips `h-5` (filter) / `h-6`. Data-table header has NO fixed height (h-8/has-data-footer:h-12 removed): `p-2` + `text-xs` line boxes yield 32px one-line / 48px two-line naturally; its hairlines are non-layout (`inset-ring-border` kit default, bottom `inset-shadow-[0_-1px_0_0_var(--color-border)]` in the data table) so totals stay exact — a real `border` would add 1-2px.
- `tabular-nums` for counts; `font-mono` for values/hosts/SQL
- Radius scales with size (kit encodes it — don't override): `h-8`+ controls `rounded-xl`; `h-7` `rounded-lg`; `h-6` chips/badges/kbd/checkboxes and menu/select/command items `rounded-md`. Floating containers (menus, popovers, select/command popups) `rounded-xl` (2xl+ rejected); only the command-palette dialog keeps `rounded-3xl`. Concentric rule for nested pills: inner ≈ outer − padding.
