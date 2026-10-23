Most PostgreSQL connection problems are not really connection problems. They are a pooled address that breaks transactions, a placeholder password that never got replaced, or an SSL mode that does not match the server. Here is how to connect in Tamery and skip all three.

## The PostgreSQL connection string

Click **New connection** and paste your provider's string, or fill in the fields:

```text
postgresql://user:password@localhost:5432/mydb
```

Both `postgresql://` and `postgres://` work. The default port is **5432**.

## Hosted databases: Supabase, Neon, Railway

Copy the string straight from Supabase, Neon, Railway, or wherever your database lives. Two things Tamery fixes for you:

- If the string still says `[YOUR-PASSWORD]` or similar, Tamery clears the placeholder and asks for the real password instead of trying to connect with the literal text.
- Pooled addresses break transactions, so Tamery switches them to a direct or session address. Neon's `-pooler` host becomes the direct host, and Supabase's port 6543 becomes 5432. The form shows every change it made, so nothing happens behind your back.

On Supabase, the direct server is IPv6 only. If your network has no IPv6, use the **Session pooler** string.

## SSL and sslmode

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

## FAQ

### What port does PostgreSQL use?

5432 by default.

### Why does my pooled connection string break transactions?

A transaction pooler hands out a different backend per statement, so a transaction cannot stay open across them. Tamery switches a pooled address to the direct or session one so transactions work.

### Does Tamery work with Supabase, Neon and Railway?

Yes. Paste the string from the dashboard and Tamery handles the pooler and the password placeholder for you.

### Is there a difference between postgres:// and postgresql://?

No. Both schemes mean the same thing, and Tamery accepts either.

---

[Download Tamery](/download), paste the string from Supabase, Neon or your own server, and the form sorts out the pooler and the placeholder. Full details, including the local proxy for localhost on the web, are in the [PostgreSQL docs](https://docs.tamery.app/connections/postgresql).
