# Database dialects

Four engines behind one UI: `postgres`, `mysql`, `mssql`, `clickhouse` (`ConnectionType`). Every `createQuery` supplies all four — the type demands it, so a new read cannot quietly skip one. A dialect that cannot express the statement gets `unsupported('<Feature>')` from `@tamery/shared/unsupported`, never a hand-thrown `Error`, so the message reads the same everywhere.

**A write is a `createQuery` too** — raw `sql` executed per dialect, `unsupported(feature)` for the engines that cannot write it. Each dialect spells out its own execution: no shared wrapper stands between the statement and `createQuery`, so a file reads as the statements it runs. One write is one file (`architecture.md`), and a statement two of them share is built in the subject's `shape.ts`.

**Every per-dialect capability lives in one table**, `entities/connection/capabilities.ts`: one entry per `ConnectionType`, so what an engine supports reads top to bottom in one place instead of being spread over a set per feature. Adding an engine is one entry the `Record` will not let you omit. **A `.tsx` never compares `ConnectionType`**: a per-engine fact is a capability entry, and a per-engine rule that needs logic (a body template, a grammar restriction, a replace-versus-recreate decision) lives in the subject's `shape.ts` beside the statements it protects.

## Never offer what the dialect cannot do

**`unsupported()` is a backstop, never a user path.** Reaching one in the UI is a bug in the gating. Gate at the coarsest level that fits:

| Level | Gate | Example |
| --- | --- | --- |
| Whole feature | `capabilitiesOf(type)` | Only Postgres offers CASCADE on a drop |
| Whole section | `sectionAvailable(section, type)` | ClickHouse has no Functions or Triggers section |
| Whole operation | `sectionCapabilitiesOf(section, type)` | Only Postgres drops an enum |
| One operation | the section's own rule | An index that enforces a constraint, or carries options the picker cannot show, only renames |
| One option in a form | narrow the option list in the table | `referentialActions` drops what an engine lacks |

A section entry carries two states apart: `false` is *no such section* — no list query on this dialect, show nothing; `{}` is *read-only* — the list reads fine and nothing writes. Conflating them hides sections that work.

**A hidden section must be hidden on every route into it.** The navigator filtering its own list is not enough — `$tabId`'s `beforeLoad` re-checks `sectionAvailable` and redirects, so a deep link or a stale bookmark lands on the resource instead of mounting a section whose list query throws.

## Writing the per-dialect statement

- Narrow at the *form*, not in the statement. A statement that quietly rewrites what the user chose is worse than an option they were never offered.
- Prefer one dialect's own syntax over emulating another's. SQL Server swaps a constraint inside a transaction, MySQL does it in a single `ALTER` — that is two implementations of one query, not a shared helper plus branches.
- **A save that needs more than one statement runs them in one `db.transaction()`** — Postgres and SQL Server roll the whole swap back, so a failed `CREATE` leaves the old object standing. MySQL commits DDL implicitly and rolls nothing back, so it is the one engine whose drop-then-create still warns the user.
- A catalog column only some engines expose belongs in that dialect's schema file under `runtime/dialects/<type>/schema/`, not behind a cast.
- **A catalog read is Kysely too.** A `CASE` is `eb.case()`, an `EXISTS` is `eb.exists()`, a chain of `OR`s is `eb.or()` — raw `sql` only wraps what no builder spells (a catalog function, bit or array arithmetic, a lateral `unnest`), and a branch that needs one keeps it inside `.then()`. `.then()` here is a case branch, not a promise, so `promise/prefer-await-to-then` is off for `entities/connection` in `oxlint.config.ts`. Kysely widens a literal branch to `string`/`number`, so a column the read's `type` pins to a union takes `$narrowType` on the query rather than a cast in the select list.
- **A write never retries on reconnect.** `createQuery` reconnects and retries only the queries that declare a result `type` — a read. A lost response to a statement that writes may still have committed, and DDL is not idempotent.
- **Kysely's schema builders first; raw `sql` with `sql.id` only where no builder exists.** `db.withSchema(schema).schema.alterTable(table)` and friends cover table, column, constraint, index, schema, type and view. Raw is for what Kysely cannot spell: function, procedure, trigger, policy, `ALTER INDEX`, an enum value or type rename (`alterType()`'s `renameValue` and `renameTo` type a runtime string as `never`), SQL Server's `sp_rename`, and two actions in one `ALTER TABLE` (MySQL's key swap). A builder splits a *name* on `.`, so the schema always goes through `withSchema`, never `alterTable('schema.table')`; a table whose own name holds a dot is the accepted edge.
- **SQL Server takes some object names as a string, not as identifiers** (`sp_rename`'s `@objname`, `OBJECT_ID()`), so `sql.id` never reaches them: every part goes through `mssqlQualified`, which brackets each part and doubles a `]`. A name holding a dot otherwise parses as a qualifier.

## Cancelling a running query

Aborting the request never stops the database: Postgres, MySQL and ClickHouse keep executing a statement whose client went away. So every `QueryExecutor` takes an optional `queryId` on `execute`/`executeTransaction` (the client sends Kysely's own compiled-query id) and exposes `cancel`, which each engine implements natively — `pg_cancel_backend` and MySQL's `KILL QUERY` over a **separate** connection (the pools hold one, and it is busy), `request.cancel()` on SQL Server, `KILL QUERY` by `query_id` on ClickHouse. The registry is keyed by connection string as well as id, so cancelling needs access to the connection, not just a guessed id. A new transport (proxy, IPC, CLI) has to forward `cancel` like the other five methods.

## Runner results and transactions

- **Every executor answers with `ResultSet[]`**: columns in order with duplicate names kept, rows as arrays, the affected-row count for a write, and `truncated` once rows pass the optional `maxRows` (`RunOptions`). A statement with several sets (a SQL Server batch, a MySQL `CALL`, a Postgres text of several statements) answers with one set each. Only the runner (`DialectOptions.resultSets`) keeps the sets; the app's Kysely driver and the CLI read the first set as row objects through `rowObjects`.
- **ClickHouse has no transactions**: its executor's commit and rollback are no-ops, so `DialectSpec.transactions` is `false` and the parser never groups a `BEGIN … COMMIT` there. The runner refuses text that opens a transaction without closing it (`leavesTransactionOpen`) on every engine — the pools hold one connection, so a transaction left open would carry every later app query.
- **A multi-user transport passes the caller as `ownerId`** on every transaction call (`createQueryRouter`'s `owner` resolver); a `txId` alone must never drive another user's transaction.
