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

- **Hold-⌘ hints for shortcuts without a control.** Tooltips with a shortcut reveal on ⌘; undo/redo (⌘Z/⇧⌘Z), the grid's copy/paste/fill (⌘C/⌘V/⌘D, listed only in the cell menu) and the Schema pages' ⌘D drop have no control to carry a hint, so they stay undiscoverable until something on screen names them.
- **Esc hints on dialog and drawer closes.** Every `Cancel`/`Close` that Esc fires (dialogs, drawers, the seed panel) carries no hint while ⌘ is held; a kit-level `shortcut` on the close components would cover all of them at once. The editable list's reorder keys (`⌥↑ ⌥↓`) are still unicode in its tooltip text rather than a `shortcut` glyph.
- **Referenced columns on the columns context.** Each header still calls `useReferencedColumns` for its own column; the fetch is shared through the query cache, but one lookup on `ColumnsContext` would drop the per-header hook.
- **Drag threshold on column headers.** Any pointer move after a header press starts a reorder drag (`packages/table/src/use-column-drag.ts`), so a click with a pixel of jitter lifts the column with its drag shadow for one settle animation; a few pixels of dead zone before `moved` flips would keep plain clicks still.
- **Exact row count once the grid hits the end.** The toolbar badge keeps the planner estimate ("~3") after every row is loaded and "No more rows" shows 7; the loaded count is exact at that point.
- **Readable rows in the delete dialog.** It lists primary keys only (UUIDs); showing the row's label column (the one **Show Labels** picks) beside each key makes it clear which rows are going.
- **Keep staged edits across a reload.** A page reload drops every staged cell edit and new row without a prompt; persist drafts per table, or at least confirm before unload while any are staged.
