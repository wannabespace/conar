# Product and domain terminology

## What Tamery is

AI-powered desktop/web app for managing database connections. Connection metadata + encrypted connection strings live locally (SQLite via OPFS); metadata optionally syncs to cloud.

## Terminology

Use precisely; avoid the listed synonyms.

- **Connection** — named, typed pointer to a database. Metadata only, never the raw string. _Avoid_: database, data source.
- **Connection String** — full URL including credentials. Always stored encrypted; never sent to cloud in plaintext. _Avoid_: credentials, DSN, URL.
- **Workspace** — named group of connections. _Avoid_: organization (in UI copy), team, project.
- **Tab** — every view inside a connection resource: `table`, `runner`, `definitions`, `visualizer`. _Avoid_: page, view, screen.
- **Navigator** — the only sidebar.
- **SyncType** — credential handling during cloud sync: `Cloud`, `CloudWithoutPassword`, `Local`. _Avoid_: sync mode, cloud mode.
- **Collections** — client data in TanStack DB collections, persisted to SQLite; synced ones stream from cloud via oRPC event iterators.

User-facing names differ from internal ids in two places: **Query** is the user-facing name for a `runner`, and **Schema** for `definitions` (the umbrella has to cover the visualizer too).

## Collections

- A catch-up request sends only `{ id, updatedAt }` per row — whole rows would re-upload every payload on each reconnect. **An empty array is a normal request, not a failure**: the server answers with everything.
- `connectionStringsCollection` is local-only, rebuilt by round-trip: **an absent row means "not resolved yet", never a negative answer** — a missing row maps to the `resolving-password` flow (blocked, no password prompt).
- `getCollections()` lazily creates the singleton set; `_protected`'s `beforeLoad` awaits readiness and puts it in route context. **That await is first-render latency, so a collection joins it only if something reads it synchronously** — the ones backing `$resourceId` redirects and the prefetch do; the chat's three are reached only through live queries and stay out.
- **Only `fullSignOut` may call `cleanCollections()`.** Components read collections from route context, everything else from `getCollections()` — dropping the singleton while a `_protected` match is alive splits the two: the router keeps the old set in cached context while the next `getCollections()` mints an empty one, and every query throws.

## Workspaces

Better Auth's `organization` plugin is remapped to `workspace`; the plugin's `activeOrganizationId` field points at the `activeWorkspaceId` column.

- Every user gets a lazily-created **default personal workspace**; `connections.create` falls back to it.
- Extra workspaces are gated by `subscriptionMiddleware`. Deletion is **disabled** — connections cascade and there is no delete flow yet.
- The client scopes connections to the active workspace **inside** each `useLiveQuery`, never a post-query `.filter()` (a new array every render).
- Workspaces reach the client through `workspacesCollection`, **not** Better Auth's `useListOrganizations` — the list must survive offline.
- Active workspace is per-device `localStorage`, **never** pushed to the session; callers pass the active id explicitly to Better Auth endpoints.
- `connections.create` accepts the client's `workspaceId` (membership-checked) so offline-created connections land in the device-active workspace. Multi-member and invites are not built yet.

## Tabs

Tabs live in `connectionResourceStore.tabs`, persisted per resource in `localStorage`; always import that store from `~/entities/connection/store`.

- A tab id is readable, self-describing, and the single route path param; `parseTabId` turns one back into a tab, so deep links work. Runner is the **only** multi-instance type.
- `$tabId`'s `beforeLoad` must stay **pure** — it runs on hover preload and must not touch the store; a component effect calls `ensureTab` + `setActiveTab`.
- `tabLabels` derives the whole strip at once, since qualification and numbering depend on the other open tabs.
- Table tabs carry `preview`: single click is a preview (italic, reused), double click promotes it. A tab may also carry an optional user `title`, cleared when emptied or equal to the derived label.

## Navigator

No action icons (`tamery-ui` patterns). Which list is up is deliberately **not persisted** — every reload opens on Tables. <kbd>Mod+B</kbd> toggles.
