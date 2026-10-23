Most PostgreSQL connection problems are not really connection problems. They are a pooled address that breaks transactions, a placeholder password that never got replaced, or an SSL mode that does not match the server. Here is how to connect in Tamery and skip all three.

## The connection string

Click **New connection** and paste your provider's string, or fill in the fields:

```text
postgresql://user:password@localhost:5432/mydb
```

Both `postgresql://` and `postgres://` work. The default port is **5432**.

## Hosted databases

Copy the string straight from Supabase, Neon, Railway, or wherever your database lives. Two things Tamery fixes for you:

- If the string still says `[YOUR-PASSWORD]` or similar, Tamery clears the placeholder and asks for the real password instead of trying to connect with the literal text.
- Pooled addresses break transactions, so Tamery switches them to a direct or session address. Neon's `-pooler` host becomes the direct host, and Supabase's port 6543 becomes 5432. The form shows every change it made, so nothing happens behind your back.

On Supabase, the direct server is IPv6 only. If your network has no IPv6, use the **Session pooler** string.

## SSL

Keep whatever SSL setting your provider gives you:

| Option                | Behavior                                      |
| --------------------- | --------------------------------------------- |
| `sslmode=disable`     | No encryption.                                |
| `sslmode=require`     | Encrypted, certificate not verified.          |
| `sslmode=verify-full` | Encrypted, certificate and hostname verified. |

```text
postgresql://user:password@db.example.com:5432/mydb?sslmode=verify-full
```

With no SSL option set, Tamery tries an encrypted connection without certificate verification, and drops to unencrypted only if the server says it has no SSL. So you get encryption by default without a failed first attempt.

## TimescaleDB

TimescaleDB is a Postgres extension, so connect to it exactly as PostgreSQL. Hypertables and continuous aggregates show up in the Navigator as tables and views; the internal schemas where chunks live stay hidden.

---

[Download Tamery](/download), paste the string, and the form sorts out the pooler and the placeholder for you. Full details, including the local proxy for localhost on the web, are in the [PostgreSQL docs](https://docs.tamery.app/connections/postgresql).
