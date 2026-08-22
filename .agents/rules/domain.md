# Product and domain terminology

> **When to read:** Before naming anything user-facing, or before touching Connections, Workspaces, Tabs, the Navigator, SyncType, or collections.

## What Tamery is

An AI-powered desktop/web app for managing database connections. Connection metadata and encrypted connection strings live locally (SQLite via OPFS); metadata optionally syncs to the cloud.

## Terminology

Use these terms precisely; avoid the listed synonyms.

- **Connection** — a named, typed pointer to a database. Metadata only (name, label, color, sync type, `workspaceId`), never the raw string. _Avoid_: database, data source.
- **Connection String** — the full URL including credentials. Always stored encrypted; never sent to the cloud in plaintext. _Avoid_: credentials, DSN, URL.
- **Workspace** — a named group of connections. _Avoid_: organization (in UI copy), team, project.
- **Tab** — every view inside a connection resource: `table`, `runner`, `definitions`, `visualizer`. _Avoid_: page, view, screen.
- **Navigator** — the only sidebar (the old left icon rail is gone).
- **SyncType** — how a connection's credentials are handled during cloud sync. `Cloud` = metadata + encrypted password synced. `CloudWithoutPassword` = metadata synced, password local-only (cross-device access without trusting the cloud with credentials). `Local` = nothing leaves the device. _Avoid_: sync mode, cloud mode.
- **Collections** — client data lives in TanStack DB collections (`apps/app/src/entities/collections/`). All persist to SQLite (OPFS); the synced ones also stream from the cloud via oRPC event iterators. `connectionStringsCollection` is local-only, populated on demand (resolve via cloud, else local decrypt).

## Workspaces

Backed by Better Auth's `organization` plugin, remapped to `workspace` in `apps/api/lib/auth.ts`. Better Auth's API still calls the logical field `activeOrganizationId`; the schema remap points it at the `activeWorkspaceId` column.

- Every user gets a **default personal workspace** (`{"default":true}` in `workspaces.metadata`), created lazily by `ensureDefaultWorkspace`; `connections.create` calls it as a fallback so the `NOT NULL` `connections.workspaceId` always resolves.
- Extra workspaces go through `orpc.workspaces.create` (gated by `subscriptionMiddleware`). Deletion is **disabled** — `connections.workspaceId` cascades and no delete flow exists yet.
- Sync stays per-user. The client scopes connections to the active workspace **inside** each `useLiveQuery` (`.where(...)`) — never a post-query `.filter()`, which allocates a new array every render and breaks downstream memos.
- Workspaces reach the client through `workspacesCollection`, **not** Better Auth's `useListOrganizations`, so the list survives going offline.
- The active workspace is a per-device `localStorage` value and is **never** pushed back to the session — the server does not read `sessions.activeWorkspaceId` at all; the column exists only because the plugin requires the field. Better Auth's team endpoints resolve `body.organizationId || session.activeOrganizationId`, so callers pass the active id explicitly (only `getActiveMember` is session-bound).
- `connections.create` accepts the client's `workspaceId` (membership-checked, else the user's default) so connections created offline land in the workspace that was active on the device. Multi-member/invites are not built yet.

## Tabs

Tabs live in `connectionResourceStore.tabs`, ordered by the tab strip and persisted per resource in `localStorage`. The store is split by slice across `entities/connection/store/`, and `store/index.ts` re-exports every part — call sites always import from `~/entities/connection/store`.

- A tab's id is readable, self-describing, and the single route path param (`table:<schema>:<table>` with percent-encoded parts, `definitions:<section>`, `visualizer`, `runner:<nanoid>`). Runner is the **only** multi-instance type; singleton ids are constants/derivations so `openTab` finds the existing tab instead of adding a second one.
- `parseTabId` turns an id back into a tab, so a deep link to a never-opened table works. `$tabId`'s `beforeLoad` parses it and must stay **pure** — it also runs on hover preload, so it must not touch the store; the component's effect calls `ensureTab` + `setActiveTab`.
- `tabLabels` derives the whole strip's labels at once because schema qualification and runner numbering both depend on the other open tabs.
- Table tabs carry `preview`: single click in the sidebar opens a preview tab (italic, reused by the next preview), double click promotes it.
- Every tab carries an optional user `title` (inline rename, cleared when emptied or set back to the derived label); the strip falls back to the derived label.

## Navigator

Carries no action icons of its own: new tabs open from the tab strip's trailing `+` menu, and the query logger toggle and open-in-web live in the app title bar's trailing cluster — both only while a resource route is active, open-in-web additionally desktop + cloud non-localhost only. Its only chrome is the list switcher pinned above search, one full-width row morphing between `Schema ›` and `‹ Tables`.

Which list is up is **deliberately not persisted** — it lives in an in-memory `getNavigatorStore(resourceId)`, so every reload opens on Tables. "Schema" is the user-facing name for that list; tab ids and the store value stay `definitions`/`visualizer`. <kbd>Mod+B</kbd> toggles the navigator.

## Collections lifecycle

`getCollections()` lazily creates the singleton set and caches it; `cleanCollections()` drops it. `_protected`'s `beforeLoad` calls `getCollections()` and awaits `stateWhenReady()` for the core collections; `ProtectedLayout` calls `cleanCollections()` on unmount. TanStack DB GCs a collection's in-memory data when `activeSubscribersCount` stays at zero longer than `gcTime`.
