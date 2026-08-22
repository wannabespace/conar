# Reference implementations

Paths are relative to `apps/app/src/routes/_protected/connection/$resourceId/` unless absolute.

- Table page: `-tabs/table/table-tab.tsx`; its chrome in `-tabs/table/-components/` (`toolbar/`, `table/`)
- Column header menu: `-tabs/table/-components/table/table-header-cell.tsx`
- Tab strip (mixed types, rename, reorder): `-components/tab-bar.tsx`
- Sidebar (naked, two swappable lists): `-components/navigator/`
- Grouped list + context menu: `apps/app/src/routes/_protected/-components/connections-list.tsx`
- Empty-state voice: `apps/app/src/error-page.tsx`

# Companion skills

`apple-design` (motion principles), `emil-design-eng` (polish details), `design-an-interface` (exploring alternatives), `design-taste-frontend` (marketing/landing surfaces only — never app chrome). `tamery-ui` wins on conflicts.
