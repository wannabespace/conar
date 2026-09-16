# Database dialects

Four engines behind one UI: `postgres`, `mysql`, `mssql`, `clickhouse` (`ConnectionType`). Every `createQuery` supplies all four — the type demands it, so a new statement cannot quietly skip one. A dialect that cannot express the statement gets `unsupported('<Feature>')` from `queries/shared/unsupported.ts`, never a hand-thrown `Error`, so the message reads the same everywhere.

**Every per-dialect capability lives in one table**, `entities/connection/capabilities.ts`: one entry per `ConnectionType`, so what an engine supports reads top to bottom in one place instead of being spread over a set per feature. Adding an engine is one entry the `Record` will not let you omit. A rule that belongs to one screen alone still stays in that screen — this table is for facts two screens would otherwise each encode.

## Never offer what the dialect cannot do

**`unsupported()` is a backstop, never a user path.** Reaching one in the UI is a bug in the gating, not an acceptable error message. Gate at the coarsest level that fits:

| Level | Gate | Example |
| --- | --- | --- |
| Whole feature | `capabilitiesOf(type)` → `{cascade, enumsLabel, explain, referentialActions, renameColumns, renameConstraints, schemas}` | Only Postgres offers CASCADE on a drop; only Postgres and SQL Server rename a constraint in place |
| Whole section | `sectionAvailable(section, type)` | ClickHouse has no Functions or Triggers section |
| Whole operation | `sectionCapabilitiesOf(section, type)` → `{create, drop, edit}` | Only Postgres drops an enum |
| One operation | the section's own rule | Only Postgres/SQL Server toggle a trigger; `enumEditable` splits column-bound enums from type enums; an index that enforces a constraint (`constraintOwned`) or carries options the picker cannot show (`custom`) only renames |
| One option in a form | narrow the option list in the table | `referentialActions` drops `RESTRICT` for SQL Server and `SET DEFAULT` for MySQL |

A section entry carries the two states apart: `false` is *no such section* — no list query on this dialect, show nothing; `{}` is *read-only* — the list reads fine and nothing writes, which is what ClickHouse indexes, constraints and enums want. Conflating them hides sections that work.

**A hidden section must be hidden on every route into it.** The navigator filtering its own list is not enough — `$tabId` `beforeLoad` re-checks `sectionAvailable` and redirects, so a deep link or a stale bookmark lands on the resource instead of mounting a section whose list query throws.

## Writing the per-dialect statement

- Narrow at the *form*, not in the statement. A statement that quietly rewrites what the user chose is worse than an option they were never offered.
- Prefer one dialect's own syntax over emulating another's. SQL Server swaps a constraint inside a transaction, MySQL does it in a single `ALTER` — that is two implementations of one query, not a shared helper plus branches.
- A catalog column that only some engines expose belongs in that dialect's schema file under `runtime/dialects/<type>/schema/`, not behind a cast.
- **SQL Server takes some object names as a string, not as identifiers** — `sp_rename`'s `@objname`, `OBJECT_ID()`. `sql.id` never reaches them, so every part goes through `mssqlQualified` (`queries/shared/sql-fragments.ts`), which brackets each part and doubles a `]`: a name holding a dot otherwise parses as a qualifier.
