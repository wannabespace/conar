# Conar — AI-powered connection manager

Conar is a desktop/web app for managing database connections. It stores connection metadata and encrypted connection strings locally (SQLite via OPFS) and optionally syncs metadata to the cloud.

## Language

### Connections

**Connection**:
A named, typed pointer to a database. Holds metadata (name, label, color, sync type) but not the raw connection string.
_Avoid_: database, data source

**Connection String**:
The full URL (including credentials) used to reach a database. Always stored encrypted; never sent to the cloud in plaintext.
_Avoid_: credentials, DSN, URL

**SyncType**:
Controls how a connection's credentials are handled during cloud sync. One of: `Cloud` (password synced to cloud, encrypted), `CloudWithoutPassword` (metadata synced, password kept local-only), `Local` (nothing synced).
_Avoid_: sync mode, cloud mode

### Collections

**Connection Strings Collection** (`connectionStringsCollection`):
The TanStack DB collection that holds one `ConnectionString` row per `Connection`. Persisted to SQLite. Has no cloud sync — it is populated by the `onEnter` effect, which resolves strings from the cloud or local store on demand.

**Connections Collection** (`connectionsCollection`):
The TanStack DB collection that holds `Connection` rows. Backed by both SQLite persistence and a cloud SSE sync stream.

### Lifecycle

**GC (Garbage Collection)**:
TanStack DB removes a collection's in-memory data when `activeSubscribersCount` drops to zero for longer than `gcTime` milliseconds. After GC the collection is in `cleaned-up` status.

**Keep-alive subscription**:
A no-op `subscribeChanges(() => {})` held by `ProtectedLayout` to ensure `activeSubscribersCount >= 1` for all three core collections while the user is on any protected route. Prevents GC from firing mid-navigation.
_Avoid_: subscription guard, GC lock

**`onEnter` effect**:
The `createEffect` handler that fires when a `Connection` row enters `connectionsCollection`. It resolves the connection string from the cloud (or falls back to local decrypt) and inserts it into `connectionStringsCollection` if no row exists yet.
