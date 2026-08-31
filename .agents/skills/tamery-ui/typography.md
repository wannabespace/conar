# Typography, density & radius

- Fonts: Geist / Geist Mono (fontsource, globals.css). Monaco's `fontFamily` in `monaco.tsx` must stay in sync with `--font-mono`.
- `text-sm` primary labels (rows, tabs, menu items) · `text-xs` secondary/chips · `text-2xs` micro labels; section headers add `font-semibold tracking-wider uppercase text-muted-foreground`
- Row heights: menu/list rows `h-7`, tab bar `h-8`, toolbars `h-11`–`h-12`, chips `h-5` (filter) / `h-6`. Data-table header has **no fixed height** — padding + line heights land on 32/44px naturally; `--table-header-height` in globals must match, and hairlines stay non-layout (`inset-ring`) — a real `border` adds pixels.
- `tabular-nums` for counts; `font-mono` for values/hosts/SQL
- Radius scales with size (kit encodes — don't override): `h-8`+ controls `rounded-xl`; `h-7` `rounded-lg`; `h-6` chips/badges/kbd/checkboxes and menu/select/command items `rounded-md`. Floating containers (menus, popovers, select/command popups) `rounded-xl` (2xl+ rejected); `rounded-3xl` only for command-palette dialog + chat bubbles — its rows step up one notch to `rounded-xl` (`in-data-[slot=dialog-content]:rounded-xl` on `CommandItem`), not further (`rounded-2xl` rows read as pills against the 24px shell). Concentric rule for nested pills: inner ≈ outer − padding.
