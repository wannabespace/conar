The most common ClickHouse connection mistake is using the native port. Tamery talks to ClickHouse over its **HTTP interface**, not the native protocol, so the port is the thing to get right.

## ClickHouse Cloud

Copy the HTTPS details from your service's **Connect** panel and paste:

```text
https://default:password@your-service.clickhouse.cloud:8443/default
```

## Local server

```text
http://default:password@localhost:8123/default
```

Leave out `:password` if the user has none.

## ClickHouse ports: HTTP, not native

Use **8123** for HTTP or **8443** for HTTPS. The native ports **9000** and **9440** do not speak HTTP, so if you paste a 9000 or 9440 string, Tamery switches it to 8123 or 8443 for you. When you fill in the fields by hand, it uses HTTPS unless the port is 8123 or empty. ClickHouse 21.12 or later is supported.

## Differences worth knowing

ClickHouse is not a row store pretending to be Postgres, and the editor respects that:

- No transactions. Schema changes apply one at a time.
- Columns cannot be renamed.
- Sorting-key, `MATERIALIZED` and `ALIAS` columns are read-only in the table browser.
- The sorting key is how edits and deletes find rows, and it is not unique. If an edit would touch more rows than you selected, Tamery tells you how many before it runs, so a non-unique key does not quietly rewrite half the table.

## FAQ

### What port does ClickHouse use with Tamery?

8123 for HTTP, 8443 for HTTPS. Tamery connects over the HTTP interface, not the native protocol.

### Why can't I connect on port 9000 or 9440?

Those are the native-protocol ports and do not speak HTTP. Tamery switches a pasted 9000 or 9440 to 8123 or 8443.

### Does Tamery support ClickHouse Cloud?

Yes. Copy the HTTPS details from your service's Connect panel and paste them.

### Does ClickHouse support transactions?

No. Schema changes apply one at a time, and the editor is built around that.

---

[Download Tamery](/download), paste the HTTPS string from your Connect panel, and browse. The full reference, including the local proxy for localhost on the web, is in the [ClickHouse docs](https://docs.tamery.app/connections/clickhouse).
