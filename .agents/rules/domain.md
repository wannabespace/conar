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
- **SyncType** — credential handling during cloud sync: `Cloud`, `CloudWithoutPassword`, `CloudWithoutConnectionString`. The last stores a null connection string server-side, so its row never reaches another device's `connectionStringsCollection` — there an absent row is final, not "resolving". _Avoid_: sync mode, cloud mode.
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

## Anonymous users

Desktop-only "Continue without an account" signs in through Better Auth's `anonymous` plugin, so an anonymous user is a real server user with a default workspace and its own Infisical secret — every sync and encryption path stays shared.

- Guests browse but never change the database from the UI: every schema and row-data control is disabled (gate on the guest at the control, never by stripping engine capabilities — a stripped capability hides the control or reads as "unsupported on this database"). The runner stays open, so these are UX gates, not security — never add client-side write guards for guests.
- Limits are the `guest` plan in `packages/shared/permissions.ts`: one connection (`connection.create` with the current count), synced only as `CloudWithoutConnectionString` (`connection.syncString`), no AI (`ai.*`, filters included), no database edits (`database.edit`), only the first `GUEST_ROW_LIMIT` (10) rows of any table, in table tabs, reference tables and exports (`table.allRows`, applied inside `resourceRowsQueryInfiniteOptions` at fetch time; the runner is not limited), one open tab per resource (`tab.multiple`, client-only: `setTabs` keeps only the newest tab, so opening another replaces it). Controls a free user can unlock by subscribing (AI, workspaces) stay enabled for free users and open the upsell; only guests see them disabled — `requestAccess(feature)` in `~/store` picks the banner for a guest, the subscription dialog otherwise. Every limit reports through the guest banner (`promptSignIn(feature)` in `~/store`, which also sends the PostHog event `guest_feature_blocked { feature }` — the signal for which limits push guests to sign up), and `handleError` routes a guest's `FORBIDDEN` there; the server checks are the real gate.
- Upgrading goes through the desktop challenge `exchange`, which still carries the anonymous bearer: it moves the anonymous user's connections (re-encrypted for the new workspace, same ids) and queries into the real user's default workspace, then deletes the anonymous user. A failed move is logged and never blocks sign-in — the anonymous user and its rows stay on the server for manual recovery. Better Auth's own `onLinkAccount` never fires here — the real sign-in happens in the browser, not in the anonymous session. The client reloads afterwards so sync streams reopen as the new user.

## Tabs

Tabs live in `connectionResourceStore.tabs` as `{ id, preview?, title? }`, persisted per resource in `localStorage`; import that store from `~/core/connection/stores`. The type lives in the id alone: each tab module registers a kind that matches its ids.

- A tab id is readable, self-describing, and the single route path param; `resolveTab` turns one back into a kind and params, so deep links work; an id no registered kind matches is closed. Runner is the **only** multi-instance type.
- `$tabId`'s `beforeLoad` must stay **pure** — it runs on hover preload and must not touch the store; a component effect calls `ensureTab` + `setActiveTab`.
- `tabLabels` derives the whole strip at once, since qualification and numbering depend on the other open tabs.
- Activating a table tab records it in the table module's recent list (last 5); the empty pane lists the ones still present in the catalog.
- Table tabs carry `preview`: single click is a preview (italic, reused), double click promotes it. A tab may also carry an optional user `title`, cleared when emptied or equal to the derived label.

## Navigator

No action icons (`tamery-ui` patterns). Which list is up is deliberately **not persisted** — every reload opens on Tables. <kbd>Mod+B</kbd> toggles.
