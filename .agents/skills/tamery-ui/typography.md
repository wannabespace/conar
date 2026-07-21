# Typography, density & radius

- Fonts: Geist / Geist Mono (fontsource, globals.css). Monaco's `fontFamily` in `monaco.tsx` must stay in sync with `--font-mono`.
- `text-sm` primary labels (rows, tabs, menu items) · `text-xs` secondary/chips · `text-2xs` micro labels; section headers add `font-semibold tracking-wider uppercase text-muted-foreground`
- Row heights: menu/list rows `h-7`, tab bar `h-8`, toolbars `h-11`–`h-12`, chips `h-6`
- `tabular-nums` for counts; `font-mono` for values/hosts/SQL
- Radius scales with size (kit encodes it — don't override): `h-8`+ controls `rounded-xl`; `h-7` `rounded-lg`; `h-6` chips/badges/kbd/checkboxes and menu/select/command items `rounded-md`. Floating containers (menus, popovers, select/command popups) `rounded-xl` (2xl+ rejected); only the command-palette dialog keeps `rounded-3xl`. Concentric rule for nested pills: inner ≈ outer − padding.
