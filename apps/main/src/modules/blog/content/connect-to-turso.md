Turso is SQLite over the network (libSQL), so connecting needs two things: the database URL and an auth token. Here is how to connect in Tamery, on desktop or the web.

## Connect to Turso

Choose **Turso** under Engine and enter your database URL and auth token, or paste both at once:

```text
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-token
```

The URL uses the `libsql://` scheme. If you copy those two lines straight out of your `.env`, Tamery reads them as they are.

## Self-hosted libSQL

A self-hosted libSQL server works the same way. If yours runs without TLS, add `?tls=0` to the URL.

## Works everywhere

Turso connects from both the desktop and web apps, with no local proxy needed, since the database is already remote. The auth token follows the same sync rules as a password, so you decide whether it travels with the connection.

## One difference from local SQLite

Turso cannot hold a transaction open between runs. Run a whole `BEGIN … COMMIT` block together with **Run all** rather than one statement at a time. Everything else, browsing rows, editing, SQL, indexes and triggers, works as you would expect from SQLite.

---

[Download Tamery](/download), paste your URL and token, and connect. The full reference is in the [Turso docs](https://docs.tamery.app/connections/sqlite).
