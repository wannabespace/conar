# Improvements

Backlog of product improvements, ranked by uniqueness vs effort. **Every future improvement idea goes in this file** — append it to the matching section (or a new one) instead of leaving it in chat, a PR description, or a scratch doc. Remove an entry when it ships or gets rejected.

Suggested order: 5 → 1 → 3 → 2. Schema notes improve every AI feature at once, the agent reuses drafts, impact preview makes the agent safe, and MCP exposes the same safe tools to outside agents.

## Ranked

1. **Agent chat where every AI write is a reviewable draft.** The chat (`packages/ai/features/chat-stream.ts`) gets no schema and no tools today. Add tools — `listTables`, `describeTable`, `runReadOnly` (row-capped, through the client proxy) and `proposeChange`. `proposeChange` writes into the existing table/visualizer drafts and review drawer, so the AI never writes to the database directly; the user approves a diff.
2. **`tamery mcp` in the CLI.** Lets Claude Code, Cursor and other agents use saved connections without a plaintext connection string in their config. Per-connection policy: read-only, row limit, masked columns. Builds on API keys and `cli query`.
3. **Impact preview before a destructive run.** For `UPDATE`/`DELETE`: run inside a transaction, show the affected row count and a sample of changed rows, then roll back. Required on connections marked as prod. Same mechanism gates the agent's writes.
4. **Undo for applied changes.** Store inverse statements when a draft is applied; offer "Undo last apply" in the query logger.
5. **Schema notes (semantic layer).** Per-table and per-column descriptions ("status 3 = refunded", "amounts in cents"), AI-drafted, user-edited, synced per workspace. Added to every AI prompt so filters, completion and chat all get more accurate.
6. **Explain plan plus "why is this slow".** Visual plan for slow queries (already detected); AI suggests an index that lands as a visualizer draft.
7. **Schema diff between connections** (e.g. staging vs prod). Output a migration in SQL, Drizzle or Prisma, reusing codegen.
8. **Auto-charts on results.** Pick a chart from result shape (time + number = line, category + number = bar). Toggle in the results pane, no chart builder.
9. **PII masking.** Mark columns sensitive; their values are masked before anything reaches the model or MCP. Build together with 2.

## Deferred

- **Notebooks / dashboards** — a different product; saved queries plus auto-charts cover most of it.
- **More engines** (Mongo icon exists) — no differentiation, each costs dialect work. `toMongoPipeline` already runs filters through a reference (`via`), but Mongo has no foreign keys to offer the targets: references would have to be inferred (ObjectId fields found in another collection) or declared by the user.
- **Team features** — blocked until multi-member workspaces exist.

## Table

- **Name the ClickHouse error when a read fails mid-stream.** A table whose rows no longer fit its column type (an enum value dropped outside Tamery) fails every read, but ClickHouse has already sent HTTP 200, so the client rejects with a bare `aborted` and the grid's error view says nothing useful; one QA pass on an older server even showed `This table is empty.` The column form now refuses dropping a value rows still hold.
- **Column form gaps.** MySQL `SET` columns could take the same values list as `enum`; **References** always writes `NO ACTION` for ON DELETE / ON UPDATE and only on a column without a foreign key, so changing or dropping a column's reference still means the Schema page or the visualizer; ClickHouse lists enum values by their stored number, so dragging them in the list changes nothing and the grip could hide there. The visualizer applies one statement per draft, so renaming a MySQL enum value there is still refused in strict mode; the table grid's form moves the rows.
- **Hold-⌘ hints for shortcuts without a control.** Tooltips with a shortcut reveal on ⌘; undo/redo (⌘Z/⇧⌘Z), the grid's copy/paste/fill (⌘C/⌘V/⌘D, listed only in the cell menu) and the Schema pages' ⌘D drop have no control to carry a hint, so they stay undiscoverable until something on screen names them.
- **Esc hints on dialog and drawer closes.** Every `Cancel`/`Close` that Esc fires (dialogs, drawers, the seed panel) carries no hint while ⌘ is held; a kit-level `shortcut` on the close components would cover all of them at once. The editable list's reorder keys (`⌥↑ ⌥↓`) are still unicode in its tooltip text rather than a `shortcut` glyph.
- **Referenced columns on the columns context.** Each header still calls `useReferencedColumns` for its own column; the fetch is shared through the query cache, but one lookup on `ColumnsContext` would drop the per-header hook.
- **Readable rows in the delete dialog.** It lists primary keys only (UUIDs); showing the row's label column (the one **Show Labels** picks) beside each key makes it clear which rows are going.
- **Keep staged edits across a reload.** A page reload drops every staged cell edit and new row without a prompt; persist drafts per table, or at least confirm before unload while any are staged.
- **Drop and change type from the column menu.** The grid can add and rename a column but not drop it or change its type; both need the query runner today.
- **Default value in Add column.** The dialog offers name, type, nullability and array only, so on Postgres and SQL Server a `NOT NULL` column cannot be added to a table that has rows (the engine has nothing to fill them with), and a default needs SQL.
- **Sort from the cell cursor.** A header click cycles its column's sort, but from the keyboard the only route is the column menu; a grid hotkey cycling the cursor's column (⇧ to add it to the sort) would match the click.
- **Sort in Code → Query.** The generated SQL, Kysely, Drizzle and Prisma queries carry the table's filters but not its sort.
- **Faithful dialect types and defaults in schema copy.** ClickHouse SQL copy must omit an empty default expression; MySQL `SET` columns must preserve multiple-value semantics in ORM output or clearly disclose that the format cannot represent them.
- **Lossless custom indexes and composite foreign keys in Code → Schema.** Postgres copies a custom index from `pg_get_indexdef`, but MySQL (prefix length, descending, functional) and SQL Server (filtered, included columns, descending) custom indexes still come out as plain column lists, and a multi-column foreign key is emitted as one key per column.
- **SQL Server `bit` as a checkbox.** Only Postgres `boolean` gets the boolean editor; a `bit` cell is free text, so `t`/`f` fails at Save. MySQL's `bit(n)` is a bit field, not a boolean, so the mapping has to be per engine.
- **Stable row order without a sort.** An unsorted grid follows the database's physical order, so a saved row jumps from the top to the bottom, and offset paging without `ORDER BY` can repeat or skip rows between pages. Ordering by the primary key fixes both, but the key comes from the constraints query, which the tab-open prefetch does not wait for — the prefetched first page would sit under a different query key.
- **Say when a filter or sort change drops staged edits.** The save bar just disappears; a toast with an Undo action would make the ⌘Z recovery discoverable.
- **Horizontal scroll re-renders every visible row.** A column-range change hands each memoized `Row` a new `virtualColumns`, so all ~45 rows re-render and re-lay out (~40% of a horizontal step). Positioning cells per column (one spacer per row read from a CSS variable) would let a range change touch only the columns that enter and leave.
- **Keep `GridScroller` chrome out of range renders.** Every row or column range change re-renders the body's `AppContextMenu` wrapper (~2ms in dev) because its child element is new each render.
- **Edit a view's query.** Views can be created, renamed and dropped from the navigator, but changing what one selects still needs the query runner (`CREATE OR REPLACE VIEW`, or drop and recreate for a materialized view).
- **Refresh a materialized view.** Postgres materialized views only change on `REFRESH MATERIALIZED VIEW`; a menu item on the view's row (with `CONCURRENTLY` when it has a unique index) would keep its tab from showing stale rows.
- **Catalog completion in routine bodies.** The Schema pages' function and trigger body editors get keywords only; `attachSqlSource` would give them the runner's table and column completion, as New View has.
- **SQL Server indexed views.** SQL Server's equivalent of a materialized view is a `SCHEMABINDING` view with a unique clustered index, so New View offers no Materialized option there yet.

## Offline writes

- **Show and unstick the outbox.** Writes replay in order and the executor retries any 5xx or network error forever, so one write a server bug keeps rejecting holds every later one, and web connection creation (which waits for its write) spins until it lands. Nothing on screen says writes are pending; a pending count plus a way to discard a stuck write would make that recoverable without signing out.
- **Offline writes from every tab.** Only the tab holding the executor's leader lock queues writes; another tab falls back to a plain transaction that rolls back when offline after the save toast already showed. Forwarding non-leader writes to the leader (or failing them up front with a clear message) would close the gap.

## Sign-in

- **Welcome new code sign-ups.** An email code creates the account on first use, but the client can't tell it was new: the web redirect never gets `newUser=true`, so the desktop shows "Welcome back!" and captures `signed_in` instead of `signed_up`. Returning a new-user flag from `/sign-in/email-otp` (an after hook comparing `createdAt` to the session) would fix both.
- **Ask a code sign-up for a name.** Accounts created by a code have an empty `name`; a one-field step after the first code sign-in would fill it.
- **Drop `magicLinkClient`.** `apps/main/src/lib/auth.ts` registers it, but the server has no magic-link plugin.

## Developer experience

- **Enforce the 300-line ceiling in lint.** `code-style.md` sets it, but `oxlint.config.ts` has no `max-lines`, and about 40 files are over it (`definitions/sections/constraints.tsx` is 660). Split those files, then turn `max-lines` on so the ceiling holds without a review.

## AI

- **Exact cost from OpenRouter.** Usage rows are priced from the LiteLLM sheet (`packages/ai/models/price.ts`), so caching discounts, provider routing and fallbacks are approximated. OpenRouter reports the billed cost per call in `providerMetadata.openrouter.usage.cost`; recording that drops the daily sheet fetch and makes `cost` exact.
- **Codestral completion through OpenRouter.** Inline completion still calls Mistral's FIM endpoint directly (`@mistralai/mistralai`, `MISTRAL_API_KEY`) because OpenRouter does not pass `suffix` through. Move it once OpenRouter supports fill-in-the-middle, leaving one provider key.
