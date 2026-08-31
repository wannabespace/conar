# Product and domain terminology

> **When to read:** Before naming anything user-facing, or touching Connections, Workspaces, Tabs, the Navigator, SyncType, or collections.

## What Tamery is

AI-powered desktop/web app for managing database connections. Connection metadata + encrypted connection strings live locally (SQLite via OPFS); metadata optionally syncs to cloud.

## Terminology

Use precisely; avoid listed synonyms.

- **Connection** — named, typed pointer to a database. Metadata only, never the raw string. _Avoid_: database, data source.
- **Connection String** — full URL incl. credentials. Always stored encrypted; never sent to cloud in plaintext. _Avoid_: credentials, DSN, URL.
- **Workspace** — named group of connections. _Avoid_: organization (in UI copy), team, project.
- **Tab** — every view inside a connection resource: `table`, `runner`, `definitions`, `visualizer`. _Avoid_: page, view, screen.
- **Navigator** — the only sidebar.
- **SyncType** — credential handling during cloud sync: `Cloud` (metadata + encrypted password synced), `CloudWithoutPassword` (password local-only), `Local` (nothing leaves device). _Avoid_: sync mode, cloud mode.
- **Collections** — client data in TanStack DB collections (`apps/app/src/entities/collections/`), persisted to SQLite; synced ones stream from cloud via oRPC event iterators. A catch-up request sends only `{ id, updatedAt }` per row — whole rows re-upload every payload on each reconnect. **An empty array is a normal request, not a failure** — the server answers with everything. `connectionStringsCollection` is local-only, rebuilt by round-trip: **an absent row means "not resolved yet", never a negative answer** — treat missing as unknown (`isPasswordStateKnown` gates the password prompt).

## Workspaces

Better Auth `organization` plugin remapped to `workspace` (`apps/api/lib/auth.ts`); the plugin's `activeOrganizationId` field points at the `activeWorkspaceId` column.

- Every user gets a lazily-created **default personal workspace** (`ensureDefaultWorkspace`); `connections.create` falls back to it.
- Extra workspaces gated by `subscriptionMiddleware`. Deletion **disabled** — connections cascade, no delete flow yet.
- Client scopes connections to the active workspace **inside** each `useLiveQuery` — never post-query `.filter()` (new array every render).
- Workspaces reach the client via `workspacesCollection`, **not** Better Auth `useListOrganizations` — the list must survive offline.
- Active workspace = per-device `localStorage`, **never** pushed to the session; callers pass the active id explicitly to Better Auth endpoints.
- `connections.create` accepts the client's `workspaceId` (membership-checked) so offline-created connections land in the device-active workspace. Multi-member/invites not built yet.

## Tabs

Tabs in `connectionResourceStore.tabs`, persisted per resource in `localStorage`; always import the store from `~/entities/connection/store`.

- Tab id = readable, self-describing, the single route path param (`table:<schema>:<table>`, `definitions:<section>`, `visualizer`, `runner:<nanoid>`). Runner is the **only** multi-instance type. **"Query" is the user-facing name for a runner**; `runner` stays the internal term — same split as Schema/`definitions`.
- `parseTabId` turns an id back into a tab (deep links work). `$tabId` `beforeLoad` must stay **pure** — it runs on hover preload and must not touch the store; a component effect calls `ensureTab` + `setActiveTab`.
- `tabLabels` derives the whole strip at once (qualification and numbering depend on other open tabs).
- Table tabs carry `preview`: single click = preview (italic, reused), double click promotes.
- Optional user `title` per tab (inline rename; cleared when emptied or equal to the derived label).

## Navigator

No action icons (see `tamery-ui` patterns). Which list is up is deliberately **not persisted** — every reload opens on Tables. "Schema" is the user-facing name; internal ids stay `definitions`/`visualizer`. <kbd>Mod+B</kbd> toggles.

## Collections lifecycle

`getCollections()` lazily creates the singleton set; `cleanCollections()` drops it. `_protected` `beforeLoad` awaits `stateWhenReady()` for core collections and puts them in route context. TanStack DB GCs in-memory data when a collection has no subscribers longer than `gcTime`.

**Only `fullSignOut` may call `cleanCollections()`.** Components read collections from route context, everything else from `getCollections()` — dropping the singleton while a `_protected` match is alive splits the two apart: the router keeps the old set in the cached context (UI keeps working) while the next `getCollections()` mints an empty one (every query throws). It was previously cleaned on `ProtectedLayout` unmount, which the root `errorComponent` triggers — one error then made every later query fail with "Connection not found for connection resource".
