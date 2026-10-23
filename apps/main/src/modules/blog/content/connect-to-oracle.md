Oracle connection strings look nothing like the other databases, and the service name trips people up every time. Here is how to connect in Tamery, with the exact string and the two gotchas worth knowing up front.

## The connection string

Choose **Oracle** under Engine, or paste:

```text
oracle://user:password@localhost:1521/FREEPDB1
```

The path at the end is the **service name**, not a database name. The default port is **1521**. A JDBC thin URL works too, so you can paste what you already have:

```text
jdbc:oracle:thin:@//localhost:1521/FREEPDB1
```

Oracle Database 12c or later is supported.

## Schemas

In Oracle, each user is a schema. Tamery opens your own schema and lists the other schemas you can see. Built-in accounts like `SYS` and `XDB` stay hidden so they do not clutter the Navigator.

## Encryption

Add `ssl=true` to connect over TCPS, Oracle's TLS listener, usually on port **2484**:

```text
oracle://user:password@db.example.com:2484/ORCLPDB1?ssl=true
```

Without it, the connection is plain TCP.

## Two things to know

- **Each statement commits when it runs.** Oracle commits schema changes immediately, so a failed multi-step change can leave the earlier steps applied. Keep that in mind when you run DDL.
- **Wallets and `tnsnames.ora` aliases are not supported, and neither are SSH tunnels.** Connect with the host, port and service name directly.

## A local Oracle to test with

```bash
docker run -d -p 1521:1521 -e ORACLE_PASSWORD=password gvenzl/oracle-free
```

Connect as `system` to the `FREEPDB1` service. On desktop, Tamery lists the running container under detected databases, so you can click straight into it.

---

[Download Tamery](/download) and paste your string or JDBC URL to connect. The full reference is in the [Oracle docs](https://docs.tamery.app/connections/oracle).
