# Product and domain terminology

> **When to read:** Before naming anything user-facing, or touching Connections, Workspaces, Tabs, the Navigator, SyncType, or collections.

## What Tamery is

AI-powered desktop/web app for managing database connections. Connection metadata + encrypted connection strings live locally (SQLite via OPFS); metadata optionally syncs to cloud.

## Terminology

Use precisely; avoid listed synonyms.

- **Connection** — named, typed pointer to a database. Metadata only (name, label, color, sync type, `workspaceId`), never the raw string. _Avoid_: database, data source.
- **Connection String** — full URL incl. credentials. Always stored encrypted; never sent to cloud in plaintext. _Avoid_: credentials, DSN, URL.
- **Workspace** — named group of connections. _Avoid_: organization (in UI copy), team, project.
- **Tab** — every view inside a connection resource: `table`, `runner`, `definitions`, `visualizer`. _Avoid_: page, view, screen.
- **Navigator** — the only sidebar (old left icon rail gone).
- **SyncType** — credential handling during cloud sync. `Cloud` = metadata + encrypted password synced. `CloudWithoutPassword` = metadata synced, password local-only (cross-device without trusting cloud with credentials). `Local` = nothing leaves device. _Avoid_: sync mode, cloud mode.
- **Collections** — client data in TanStack DB collections (`apps/app/src/entities/collections/`). All persist to SQLite (OPFS); synced ones also stream from cloud via oRPC event iterators. **A catch-up (`sync`) request sends only `{ id, updatedAt }` per row** (`catchUp` in `apps/app/src/lib/sync.ts` maps them) — that is the whole diff the server's `syncDiff` reads, and posting whole rows instead re-uploads the payload itself on every reconnect (measured: 46 KB of encrypted message parts for one chat) plus the collection's internal `$synced`/`$key` fields. An **empty array is a normal request, not a failure**: a collection whose local cache is empty (fresh profile, `schemaVersion` reset, or simply no rows yet) says so with `[]`, and the server answers with everything — `notInArray(col, [])` compiles to `true`, and `inArray(col, [])` to `false`, so nothing is falsely reported missing. `connectionStringsCollection` local-only, populated on demand (resolve via cloud, else local decrypt). Because it is rebuilt by a round-trip rather than synced, **an absent row means "not resolved yet", never a negative answer** — it is ready-and-empty for the first few hundred ms after a cache clear, fresh profile, or `schemaVersion` reset. Code reading it must treat missing as unknown: `utils.decrypt` falls back to `connections.resolve`, and `useFetchingConfig` exposes `isPasswordStateKnown` so the password prompt is a verdict only once a row exists (a connection that truly needs one has a row saying `isPasswordPopulated: false`).

## Workspaces

Better Auth `organization` plugin remapped to `workspace` in `apps/api/lib/auth.ts`. Better Auth API still calls the logical field `activeOrganizationId`; schema remap points it at `activeWorkspaceId` column.

- Every user gets a **default personal workspace** (`{"default":true}` in `workspaces.metadata`), lazily created by `ensureDefaultWorkspace`; `connections.create` calls it as fallback so `NOT NULL` `connections.workspaceId` always resolves.
- Extra workspaces via `orpc.workspaces.create` (gated by `subscriptionMiddleware`). Deletion **disabled** — `connections.workspaceId` cascades, no delete flow yet.
- Sync stays per-user. Client scopes connections to active workspace **inside** each `useLiveQuery` (`.where(...)`) — never post-query `.filter()` (new array every render, breaks downstream memos).
- Workspaces reach client via `workspacesCollection`, **not** Better Auth `useListOrganizations` — list survives offline.
- Active workspace = per-device `localStorage`, **never** pushed to session — server doesn't read `sessions.activeWorkspaceId` (column exists only because plugin requires the field). Better Auth team endpoints resolve `body.organizationId || session.activeOrganizationId`, so callers pass the active id explicitly (only `getActiveMember` session-bound).
- `connections.create` accepts client's `workspaceId` (membership-checked, else user default) so offline-created connections land in the device-active workspace. Multi-member/invites not built yet.

## Tabs

Tabs in `connectionResourceStore.tabs`, ordered by tab strip, persisted per resource in `localStorage`. Store split by slice in `entities/connection/store/`; `store/index.ts` re-exports all — always import from `~/entities/connection/store`.

- Tab id = readable, self-describing, the single route path param (`table:<schema>:<table>` percent-encoded, `definitions:<section>`, `visualizer`, `runner:<nanoid>`). Runner = **only** multi-instance type; singleton ids are constants/derivations so `openTab` finds the existing tab. **"Query" is the user-facing name for a runner** (tab title, "New query" actions, docs) — `runner` stays the internal type/id/store term, same split as Schema/`definitions`.
- `parseTabId` turns id back into a tab (deep link to never-opened table works). `$tabId` `beforeLoad` parses it and must stay **pure** — runs on hover preload, must not touch the store; component effect calls `ensureTab` + `setActiveTab`.
- `tabLabels` derives the whole strip at once (schema qualification + runner numbering depend on other open tabs).
- Table tabs carry `preview`: single click in sidebar = preview tab (italic, reused by next preview), double click promotes.
- Optional user `title` per tab (inline rename, cleared when emptied or equal to derived label); strip falls back to derived label.

## Navigator

Carries no action icons: new tabs via tab strip's trailing `+` menu; query-logger toggle + open-in-web in app title bar's trailing cluster — both only while a resource route is active, open-in-web also desktop + cloud non-localhost only. Only chrome: list switcher pinned above search, one full-width row morphing `Schema ›` ↔ `‹ Tables`.

Which list is up is **deliberately not persisted** — in-memory `getNavigatorStore(resourceId)`, every reload opens on Tables. "Schema" = user-facing name; tab ids + store value stay `definitions`/`visualizer`. <kbd>Mod+B</kbd> toggles navigator.

## Collections lifecycle

`getCollections()` lazily creates the singleton set and caches it; `cleanCollections()` drops it. `_protected` `beforeLoad` calls `getCollections()` and awaits `stateWhenReady()` for core collections; `ProtectedLayout` calls `cleanCollections()` on unmount. TanStack DB GCs a collection's in-memory data when `activeSubscribersCount` stays 0 longer than `gcTime`.
