# Kit gotchas

- `CommandDialog` is only a Dialog shell — wrap contents in `<Command>` or cmdk crashes (`undefined (reading 'subscribe')`).
- `PopoverContent` defaults `flex flex-col gap-4 p-4 w-72` — menu-like popovers need `gap-0 p-1`, often `w-auto`.
- `DropdownMenuLabel` requires a `DropdownMenuGroup` parent (base-ui throws `MenuGroupContext is missing`).
- `CommandItem` appends a hidden `ml-auto` check — a second `ml-auto` child splits space. Right-aligned meta goes in `CommandShortcut` (also hides the check). Name span: `min-w-0 flex-1 truncate`.
- **No shadcn Sidebar in kit** (removed). Tables sidebar is custom: motion width collapse in `page-sidebar.tsx`; open/width in seitu localStorage (`tablesSidebarOpenValue`/`tablesSidebarWidthValue`, `-components/page/constants.ts`); ⌘B in `tab-bar.tsx`; primitives in `-components/page/sidebar-primitives.tsx`. Extend those, don't re-add shadcn's.
- base-ui render prop: `<Trigger render={<Button/>}>children</Trigger>` — children land inside. Non-button trigger needs `nativeButton={false}` + `aria-label`.
- `InputGroup` addon sizes direct-child svgs only — icons nested in wrappers need explicit `size-4`. Default `border-transparent bg-input` is invisible on light surfaces — add `border-border` per instance.
- Router `Link` concatenates `activeProps.className` (no tw-merge) — use `data-[status=active]:` variants in one className. `sidebar-link.tsx` encodes this.
- CSS transitions can't interpolate length↔percentage (`max-w-64 → max-w-full` snaps) — keep both endpoints in rem.
- Selects: macOS overlay mode (`alignItemWithTrigger` true) + `min-w-(--anchor-width)`. Trigger-only icon makes popup hang slightly past the edge — accepted (icon-in-items and exact-width both rejected). Never fix-width a trigger narrower than its longest option. Sizes (`xs`/`sm`/`default`): set `size` on `SelectTrigger` AND `SelectContent` (popup carries `data-size`; items follow via `in-data-[size=xs]:` variants — no context).
- Hotkeys: always `e.preventDefault()` (⌘P opens print otherwise).
- `getOS(navigator.userAgent)` for ⌘ vs Ctrl labels.
