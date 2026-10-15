# Product and domain terminology

## What Tamery is

AI-powered desktop/web app for managing database connections. Connection metadata + encrypted connection strings live locally (SQLite via OPFS); metadata optionally syncs to cloud.

## Terminology

Use precisely; avoid the listed synonyms.

- **Connection** — named, typed pointer to a database. Metadata only, never the raw string. _Avoid_: database, data source.
- **Connection String** — full URL including credentials. Always stored encrypted; never sent to cloud in plaintext. _Avoid_: credentials, DSN, URL.
  - **User, password and database are percent-encoded in the string.** Every writer encodes them (`connectionParts.format`, `encodeURIComponent` on a path set to a resource name) and every reader goes through `readConnectionString` (`packages/connection/parse-connection-string.ts`), which decodes tolerantly; SafeURL alone hands them back raw, so a driver fed from it sees `p%20w` instead of `p w`.
  - **Locally every string is encrypted with a device key**, not the workspace secret. On desktop the key is wrapped by Electron `safeStorage` and **never leaves the main process**: the renderer sends strings to `deviceEncryption` over IPC (`apps/desktop/src/main/lib/device-encryption.ts`), so a script in a window can use the key but never hold it. The renderer keeps its own non-extractable key in IndexedDB (`apps/app/src/lib/device-encryption.ts`) on the web, where `safeStorage` has no real backend (Linux `basic_text`), or where creating the keychain key failed. **A device keeps the key it started with** (a wrapped key means keychain, else an IndexedDB key means IndexedDB, else try the keychain), since strings encrypted under one never decrypt under the other; only sign-out lets it choose again. Use `safeStorage`'s async API only: the sync one is removed in Electron 46, blocks the main process during the keychain prompt, and has been reported to return an empty string when the prompt is dismissed. `fullSignOut` resets both, which makes every local string unreadable, so it runs only after the collections are cleared. A refused or failed keychain read throws `KEYCHAIN_LOCKED_ERROR` (`@tamery/shared/keychain`), never a decrypt failure: a decrypt failure signs out and resets the key, which would orphan every stored string, while a locked keychain only keeps connections closed. Electron fetches the keychain once per run, so a denial lasts until restart: the locked pane offers **Restart Tamery**, never Try again. The packaged app turns off Electron's code-injection switches through ToDesktop's `fuses` and exits when started with a remote-debugging switch, since either would hand another process a window that decrypts.
  - **SSH tunnel settings live inside the string** as `ssh_*` query params (`packages/connection/ssh/params.ts`), so encryption and sync carry them. `CloudWithoutSecrets` keeps secrets off the server through `connectionSecrets.strip` (`packages/connection/secrets.ts`), on the client before upload and on the server before encrypting. It **empties** each SSH secret and the SSL client key passphrase (`sslpassword`, `sslpassphrase`) rather than dropping it: an empty param is the marker for "this device must ask", which locks the connection behind its form, opened on just the missing fields, until they are filled, and `connectionSecrets.restore` refills only emptied params from the local copy, so a secret the synced string dropped never comes back; it refills the database password only while `isPasswordExists` is set, since an empty one otherwise means another device removed it. `isPasswordExists` still means the database password only. Option keys are case-insensitive to every driver, so every reader (and `connectionSecrets`) lowercases them through `readConnectionString`/`lowercaseKeys`; matching a raw key lets a pasted `sslPassword` slip past the strip. Tunnels open **only in the desktop main process**, which plugs `ssh/tunnel.ts` into the dialect clients through `ssh/forwarding.ts`; anywhere else (web, proxies, CLI `query`) a string carrying `ssh_*` params fails with `SSH_DESKTOP_ONLY`, so the clients never import ssh2 and the CLI bundle stays free of its native addon. The host key is checked against the user's and the system-wide known_hosts files, a host missing from all of them is trusted only through a native dialog that defaults to Cancel, and a host listed under another key or key type is refused like a changed key. The driver talks to the database over a channel of the SSH session, so a tunnel opens no local port. Anything shown to the user is built from host, port and path, never the query string: the params can hold a private key.
- **Workspace** — named group of connections. _Avoid_: organization (in UI copy), team, project.
- **Tab** — every view inside a connection resource: `table`, `runner`, `definitions`, `visualizer`. _Avoid_: page, view, screen.
- **Navigator** — the only sidebar.
- **SyncType** — credential handling during cloud sync: `Cloud`, `CloudWithoutSecrets`, `CloudWithoutConnectionString`, shown as **Full**, **No password** and **Metadata only**. The last stores a null connection string server-side, so its row never reaches another device's `connectionStringsCollection`; there an absent row is final, not "resolving", and the connection opens its form for the user to enter the server details, which stay on that device. _Avoid_: sync mode, cloud mode.
- **Collections** — client data in TanStack DB collections, persisted to SQLite; synced ones stream from cloud via oRPC event iterators.

User-facing names differ from internal ids in two places: **Query** is the user-facing name for a `runner`, and **Schema** for `definitions` (the umbrella has to cover the visualizer too).

## Collections

- A catch-up request sends only `{ id, updatedAt }` per row — whole rows would re-upload every payload on each reconnect. **An empty array is a normal request, not a failure**: the server answers with everything.
- **Writes to synced collections go through `mutateOffline`** (`core/collections.ts`, TanStack `offline-transactions`): the write applies at once, waits in the IndexedDB outbox, and replays FIFO when online. Synced collections have no `onInsert`/`onUpdate`/`onDelete`, so a bare `insert` outside it throws. Each collection's `mutations` sends one row and lists only the operations the app issues — a missing one rolls back instead of retrying, since a retried write blocks the FIFO outbox. The executor retries every other error except a non-5xx `ORPCError`, which rolls back. Retries mean server `create` and `remove` **must be idempotent** (`onConflictDoNothing`, a plan-limit count that excludes the incoming id, a remove that succeeds on a missing row), or a lost response turns into a duplicate-key 500 retried forever or a `FORBIDDEN`/`NOT_FOUND` rollback.
- **The catch-up sends the server versions** (the collection's synced layer), never visible rows: an unsent insert is unknown to the server, whose answer would delete it, and a row with a pending edit or delete must still report the version the server holds, or the answer resurrects it or overwrites the replay. A `create` whose unique key already holds another row returns that row, and `push` writes it in place of the client's.
- Only the Web Locks leader window persists the outbox; other windows of the same app write online-only (the library's fallback).
- Online-only by nature: auth, workspace creation (subscription-gated server-side), AI.
- `connectionStringsCollection` is local-only, rebuilt by round-trip: **an absent row means "not resolved yet", never a negative answer** — a missing row maps to the `resolving-password` flow (blocked, no password prompt).
- `getCollections()` lazily creates the singleton set; `_protected`'s `beforeLoad` awaits readiness and puts it in route context. **That await is first-render latency, so a collection joins it only if something reads it synchronously** — the ones backing `$resourceId` redirects and the prefetch do; the chat's three are reached only through live queries and stay out.
- **Only `fullSignOut` may call `cleanCollections()`.** Components read collections from route context, everything else from `getCollections()` — dropping the singleton while a `_protected` match is alive splits the two: the router keeps the old set in cached context while the next `getCollections()` mints an empty one, and every query throws.

## Workspaces

Better Auth's `organization` plugin is remapped to `workspace`; the plugin's `activeOrganizationId` field points at the `activeWorkspaceId` column.

- Every user gets a lazily-created **default personal workspace**; `connections.create` falls back to it.
- Extra workspaces are gated by `workspace.create`. Deletion is **disabled** — connections cascade and there is no delete flow yet.
- The client scopes connections to the active workspace **inside** each `useLiveQuery`, never a post-query `.filter()` (a new array every render).
- Workspaces reach the client through `workspacesCollection`, **not** Better Auth's `useListOrganizations` — the list must survive offline.
- Active workspace is per-device `localStorage`, **never** pushed to the session; callers pass the active id explicitly to Better Auth endpoints.
- `connections.create` accepts the client's `workspaceId` (membership-checked) so offline-created connections land in the device-active workspace. Multi-member and invites are not built yet.

## Anonymous users

Desktop-only "Continue without an account" signs in through Better Auth's `anonymous` plugin, so an anonymous user is a real server user with a default workspace and its own Infisical secret — every sync and encryption path stays shared.

- **Getting in stays easy.** Anything that helps someone get their first connection working (the form, parsing, test, diagnosis, Ask AI on a failed test) is free for guests and Free users, with no quota or sign-in gate; limits only gate what comes after.
- Limits are the `guest` plan in `packages/shared/permissions.ts`: one connection (`connection.create` with the current count), no AI (`ai.*`) beyond connection diagnosis, no workspaces, one open tab per resource (`tab.multiple`, client-only: `openTab`/`ensureTab` close the other tabs first, so opening another replaces it silently). Guests can edit the database like any member. A locked control's press goes through `checkOrUpgrade` (`architecture.md` → Permissions), which for a guest is the banner prompt `promptSignIn` — it also sends the PostHog event `guest_feature_blocked { hint }`, the signal for which limits push guests to sign up. How a locked control looks is `tamery-ui` patterns. The server checks are the real gate; `handleError` shows a guest's `FORBIDDEN` message in the banner (toasts on `/auth`, which has no banner).
- Upgrading goes through the desktop challenge `exchange`, which still carries the anonymous bearer: it moves the anonymous user's connections (same ids; a guest's have no stored string, so nothing is re-encrypted) and queries into the real user's default workspace, then deletes the anonymous user. A failed move fails the exchange — the transaction rolls back and the guest session stays valid, so signing in again retries it. Better Auth's own `onLinkAccount` never fires here — the real sign-in happens in the browser, not in the anonymous session. The client reloads afterwards so sync streams reopen as the new user.

## Tabs

Tabs live in `connectionResourceStore.tabs` as `{ id, preview?, title? }`, persisted per resource in `localStorage`; import that store from `~/core/connection/stores`. The type lives in the id alone: each tab module registers a kind that matches its ids.

- A tab id is readable, self-describing, and the single route path param; `resolveTab` turns one back into a kind and params, so deep links work; an id no registered kind matches is closed. Runner is the **only** multi-instance type.
- `$tabId`'s `beforeLoad` must stay **pure** — it runs on hover preload and must not touch the store; a component effect calls `ensureTab` + `setActiveTab`.
- The resource index redirects to the active tab while it is still listed, so code that leaves a tab whose object is gone (a dropped table, a dropped or renamed schema) **removes the tab before navigating** to the index — the other order lands back on the stale tab.
- `tabLabels` derives the whole strip at once, since qualification and numbering depend on the other open tabs.
- Activating a table tab records it in the table module's recent list; the empty pane lists the ones still present in the catalog.
- Table tabs carry `preview`: single click is a preview (italic, reused), double click promotes it. A tab may also carry an optional user `title`, cleared when emptied or equal to the derived label.

## Navigator

Which list is up is deliberately **not persisted** — every reload opens on Tables.
