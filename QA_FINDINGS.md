# QA findings — PR #501

PR: [Spreadsheet-style table grid with cell cursor, inline editing and reference peek](https://github.com/wannabespace/conar/pull/501)

Review comparison: `git diff tamery...HEAD`. The PR description serves as the behavior specification.

Also incorporates the [thermo-nuclear code-quality review](https://github.com/cursor/plugins/blob/main/cursor-team-kit/skills/thermo-nuclear-code-quality-review/SKILL.md) of committed snapshot `59979bcfd`, compared with merge-base `31d69f19abd853752c84cba93a7ff1b3b1976511` on `tamery` (176 files, 8,575 insertions and 4,717 deletions). Concurrent edits appeared during that review; its findings concern the fixed committed snapshot and do not certify later working-tree changes.

## Spec

### 1. P2 — JSON type changes disappear

Locations: `apps/app/src/modules/table/lib/hooks.ts:39`, `apps/app/src/modules/table/components/table/table.tsx:211`.

JSON edits stage parsed values, but `isSameValue` compares generic editor text. Editing an existing JSON string `"1"` to the JSON number `1` compares equal and removes the draft instead of staging the change. The same failure affects `"false"` → `false`.

Confirmed at runtime: `isSameValue(createJsonTransformer().toConnection.fromRaw('1'), '1')` returns `true`.

Fix: compare JSON values using their JSON transformer so scalar types remain distinct.

### 2. P2 — Default-only duplicates fail to save

Locations: `apps/app/src/core/queries/rows/shape.ts:23`, `apps/app/src/core/queries/rows/insert-row.ts:15`.

Duplicating an identity-only row produces `{}` because `cloneValues` excludes the primary key. The installed Kysely compiles this to `insert into "public"."only_id" () values ()`, which is invalid on PostgreSQL and SQL Server.

Setting every copied field to DEFAULT also produces an empty statement after filtering undefined values. Every dialect then calls `.values([{}])`; this is a missing contract in the shared insertion boundary, not just the duplicate-row menu. PostgreSQL documents the [DEFAULT VALUES form](https://www.postgresql.org/docs/current/sql-insert.html).

Fix: compile an empty insert with the dialect's supported default-row syntax (`defaultValues()` where supported). Cover the shared helper's batched caller as well as the new single-row caller; do not scatter emptiness checks into UI paths.

The second insert path exists only because `insertQuery` (`apps/app/src/core/queries/rows/insert.ts:19`) opens its own transaction, against `architecture.md`'s rule to pass a caller's `tx` as `run`'s second argument; the drafts save already runs in a `tx` and cannot reuse it. Keeping one insert query that accepts the caller's `tx` (seed panel batches inside `transaction(...)`, drafts pass one row) deletes `insert-row.ts` and `shape.insertRows`, and the default-row syntax lands in one file.

### 3. P2 — Duplicate ignores staged edits

Location: `apps/app/src/modules/table/components/table/table.tsx:327`.

Edit a non-key cell, then duplicate its row. The displayed cell uses the staged draft, but `cloneValues(columns, cell.row)` copies the original cached values. The duplicate silently restores the old values.

Fix: build the duplicate through `valueOf` so it copies the values displayed in the grid.

### 4. P2 — Fresh-row creation is missing

Location: `apps/app/src/modules/table/components/table/table.tsx:326`.

The PR promises staged new rows through a plus action. `insertRow` is reachable only through Duplicate; the visible plus button opens Add column. No action calls `insertRow({})`, so an empty table cannot create its first row through the promised staged-row flow.

Fix: provide an action that stages a fresh row.

## Standards

### 5. P2 — Table name lacks `data-mask`

Location: `apps/app/src/core/table/cell/cell-reference.tsx:225`.

The foreign-key empty state renders `foreign.table` without `data-mask`. Tamery UI hard rule 8 requires masking user data, including table names.

Fix: wrap the interpolated table name in a masked element.

### 6. P2 — New grid actions lack analytics

Locations: `apps/app/src/modules/table/components/toolbar/actions/actions-view.tsx:19`, `apps/app/src/core/table/grid-cursor.ts:132`, `apps/app/src/core/table/grid-cursor.ts:188`, `apps/app/src/core/table/grid-cursor.ts:206`.

Neither the grid/documents toggle button nor its shortcut captures an action event. The same applies to most of the PR's other new actions in HEAD: Fill Down, cell copy and paste, ⌘Z/⇧⌘Z draft history, Duplicate Row, Discard Row, Set value in selected rows, column pin/reorder/label and the reference peek. The only table events in HEAD are the pre-existing mutations and `cell_filter_added`. `AGENTS.md` requires tracking every new user action; `.agents/rules/architecture.md` specifies `posthog.capture` for non-mutation actions.

Fix: capture an event in each shared action owner, not its UI triggers, using only permitted anonymized properties. Uncommitted work has started adding `cells_copied`, `cells_pasted`, `cells_filled_down`, `reference_peek_opened` and `table_view_toggled`; check the final list against the actions above.

### 7. P2 — Shortcut lacks the hold-⌘ hint

Location: `apps/app/src/modules/table/components/toolbar/actions/actions-view.tsx:25`.

The ⌘⇧E shortcut appears only in a hover tooltip. Tamery UI hard rule 13 requires a hint on the control while ⌘ is held, without reflowing its row.

Fix: add the modifier-held hint to the view toggle control.

### 8. P2 — New responsibilities continue expanding oversized files

Locations: `packages/table/src/grid.tsx:209`, `apps/app/src/modules/table/components/toolbar/filter-search-bar.tsx:685`, `apps/app/src/modules/table/components/table/table.tsx`.

The new grid contains 355 lines, exceeding the non-linted 300-line maximum in `.agents/rules/code-style.md`. The filter bar grows from 854 to 937 lines by adding referenced-table metadata queries and propagating `via` through its existing stage-selection plumbing. The table component grows from 361 to 451 lines. No changed file crosses the thermo-nuclear skill's 1,000-line threshold; Tamery's stricter limit still applies.

Fix: decompose by responsibility: filter transitions, command-list rendering and referenced-column metadata have separate owners; grid rendering and virtualization orchestration also have distinct subjects. `drafts-actions.tsx` (409 → 485, finding 12) and `apps/app/src/core/catalog/capabilities.ts` (322 → 360) also exceed the limit.

In `grid.tsx`, column offsets are computed three ways: `columnSlots` (`packages/table/src/columns.ts:34`), the `pinnedLeft` chain, and the `--grid-pinned` reduce — which uses committed sizes while `pinnedLeft` follows live resize widths. Move the pinned geometry into `columns.ts`, derive `--grid-pinned` from `pinnedLeft`, and let `pinned` imply `fixed` in `use-column-drag` so `data-grid.tsx` stops passing `fixed: isPinned, pinned: isPinned`. In the filter bar, `via?: FilterVia` is hand-copied (`via: stage.via`) on every step change and a `stageFilter` helper covers three creation sites; give `Stage` a `target: Pick<ActiveFilter, 'column' | 'via'>` and move steps with `{ ...stage, step }`. `columns ?? []` guards a value the context types as `Column[]`.

Avoid replacing the current file with a large bag of callback parameters—give each extracted subject the state and transitions it owns. Prioritize removing the save machinery in finding 12 over cosmetic file splitting.

## Additional thermo-nuclear findings

### 9. P1 — Row changes redirect an active edit into another row

Locations: `apps/app/src/core/table/grid-cursor.ts:51`, `apps/app/src/modules/table/components/table/table.tsx:166`.

`cellAt` resolves the active edit through the current `rows[position.row]`. The edit stores text but no row identity. Staged inserts prepend values to that array; discards, undo, saves and refreshed ordering can also change its meaning. The surviving edit is then committed into whichever row occupies the old index. This is a state-model problem, not a missing guard in one insertion handler.

Reproduced against the real cursor implementation with a memory store: start editing B at index 1 in `[A, B]`, change its text to `B edited`, rebuild the cursor against `[new, A, B]`, and commit. The callback receives A's id with B's edited text. No database or browser mock is needed for this failure.

The cursor and selection anchor have the same problem even without an open edit. With one duplicated row staged at index 0, put the cursor on data row `id=7` (index 3) and save. The staged row leaves the array, so the cursor now sits on the next row; Delete or typing stages an edit on a row the user never chose. ⌘Z of a duplicate shifts it the same way.

Fix: give the active edit, cursor and anchor a stable target (persisted row identity or staged row id), resolving their display index separately. If the row disappears, explicitly end that edit. Keep this invariant in the shared grid owner so inserts, removals, undo and refetch all obey it.

### 10. P1 — Save settlement deletes newer edits to a staged row

Locations: `apps/app/src/modules/table/components/toolbar/drafts-actions.tsx:218`, `apps/app/src/modules/table/components/toolbar/drafts-actions.tsx:368`, `apps/app/src/core/table/session.ts:170`.

The insert loop saves the captured `newRows` values. While it awaits database work, `setValue` still accepts changes to that same staged row; `isCommitting` only supplies a visual pulse. Successful settlement unconditionally removes the row by id, deleting changes that were never submitted. Existing-row cleanup has the same coarse ownership problem, and the new insert path extends it.

Reproduced with the actual session actions: submit `{name: 'before'}`, mark committing, change it to `{name: 'edited while saving'}`, then run the successful-save removal. The captured values remain `before`; the unsaved newer value disappears and the store has zero staged rows.

Fix: settle the submitted versions, not everything sharing their ids. There is already an equivalent pattern in `apps/app/src/modules/visualizer/lib/drafts.ts:272`: settlement removes only the draft objects that actually ran. Adapt that invariant locally, without introducing a cross-module import. Alternatively, prevent modifications to submitted rows for the whole save lifecycle if that is the intended interaction.

### 11. P2 — A UI regex invents cross-dialect grouping capabilities

Location: `apps/app/src/modules/table/components/table/distinct-values.tsx:41`.

`UNGROUPABLE_TYPE` is one denylist for every engine, and `hasDistinctValues` takes no connection type. It allows SQL Server `text` and `ntext`, but the new stats query applies `COUNT(column)` and `COUNT(DISTINCT column)` to them. [Microsoft's COUNT documentation](https://learn.microsoft.com/en-us/sql/t-sql/functions/count-transact-sql?view=fabric) explicitly excludes those types. PostgreSQL `point`, `polygon`, `circle` and `box` also pass the regex but have no equality operator, so `GROUP BY` fails with "could not identify an equality operator". Opening the offered action therefore issues an unsupported query; the shared query client also defaults to throwing query errors.

This violates the repo's canonical capability ownership rule.

Fix: move eligibility to the catalog's per-engine capability model and consume it consistently from the UI. Check the operation actually performed, rather than adding another type substring to a page-local regex.

### 12. P2 — Save orchestration keeps two competing reconciliation systems

Location: `apps/app/src/modules/table/components/toolbar/drafts-actions.tsx:310`.

This component grows from 409 to 485 lines. It now handles update and insert statements, mutable failure markers for each kind, duplicated status loops, transaction results, one follow-up SELECT per updated row, fallback values, primary-key transformations, manual infinite-cache patching and conditional invalidation, alongside toolbar UI. Some machinery predates the branch, but the new insert path extends it instead of removing it.

Fix: use the existing row query as the reconciliation owner. Execute the submitted batch, settle its snapshot once, and refresh the table's row queries. This removes `pendingCommits`, `modifiedColumns`, `updatedFilters`, per-row refresh promises and `savedValuesByRow`, as well as the parallel cache rewrite. SQL value conversion belongs with save orchestration rather than the presentation component. Keep statement sequencing inside the transaction; parallel writes are not the remedy here.

Refreshing can change timing and network cost, so this is a concrete restructuring proposal, not a claim that it is already proven behavior-preserving. Verify generated defaults, changed primary keys, filtering, ordering and refresh failures before replacing the current path. A focused table save module should own that contract, with the toolbar left to invoke it and display its state.

Inside that module: new-row handling currently runs as a parallel branch at every step (committing status set twice at `:130-137`, reset twice at `:270-279`, removal twice at `:365-370`). Results travel through mutable `let failedPrimaryKeys` / `failedNewRowId`, and failures arrive in `onSuccess` as `{ status: 'error' }`. Throw a typed `SaveError { target: { kind: 'row', primaryKeys } | { kind: 'new', id } }` and use the mutation's lifecycle: `onMutate` marks every change committing in one `store.set` (today one notification per row reaches every subscribed cell), `onError` attaches the error to its target, `onSettled` clears the flags. Replace the hand-built `row${count === 1 ? '' : 's'}` strings with `plural()`.

### 13. P2 — Undo history lives apart from the drafts it undoes

Locations: `apps/app/src/modules/table/lib/history.ts:32-71`, `apps/app/src/modules/table/lib/hooks.ts:59-77`, `apps/app/src/modules/table/components/toolbar/drafts-actions.tsx:125-137`.

Drafts and staged rows live in `tableSessionStore`, memoized per `{id, schema, table}` and surviving tab switches. The undo/redo stacks live in `useRef`s of a hook mounted by `table.tsx`; `AnimateView` is keyed per tab, so every tab switch wipes ⌘Z while the drafts remain. "A filter/sort change drops the drafts" is enforced by a mounted effect diffing a ref of the previous filters/orderBy, so filters changed while the tab is unmounted (the peek's "Open in Table" `load()`) never clear the drafts. The effect's `previous.pageStore === pageStore` guard covers a state the keyed remount makes impossible. `useFlashChangedCells` copies the same previous-query detector. Save resets history only indirectly, via `isSaving()` scanning `isCommitting` flags.

Fix: build history next to the store — a memoized `stagedChanges(key)` returning `{ store, history: { undo, redo, reset } }` that subscribes once to the page store's `filters`/`orderBy` and calls `clear()` + `history.reset()`. The hook keeps only `useHotkeys`; saving calls `history.reset()` explicitly. Deletes the `restoring` flag, the query ref and its effect, `isSaving` and the impossible guard.

### 14. P2 — Last-opened resources list is no longer capped

Location: `apps/app/src/routes/_protected/connection/$resourceId.tsx:88`.

The writer dropped `.slice(0, 3)` and the cap moved to the reader (`last-opened-resources.tsx`). The persisted `lastOpenedResourcesStorageValue` array now grows with every distinct resource opened.

Fix: restore the cap at the writer.

### 15. P2 — Binary values export as byte arrays

Locations: `apps/app/src/core/connection/utils.ts:5-16`, `apps/app/src/core/transformers/value-transformer.ts:28`, `apps/app/src/core/transformers/raw.ts:24-37`, `packages/shared/files.ts:23-43`.

`bytesToHex` was added to `getValueForEditor` and `getDisplayValue` but not `formatValueForPlainCell` or `escapeCSVValue`. A MySQL/SQL Server `varbinary`/`blob` value copies and exports as `"222,173,…"` in CSV and `{"0":222,…}` in Markdown/JSON (`cell-menu.tsx` copy actions, `export-data.tsx`), and skews the runner's column sizing. Hex encoding lives in the connection-string module while decoding lives in `transformers/raw.ts`.

Fix: one canonical value-to-text function in `packages/shared` beside `base64.ts` (null, `Uint8Array`, `Date`, object, string), with the editor/display/CSV/Markdown formatters built on it and the hex encode/decode pair kept together. Electron's `Uint8Array.prototype.toHex()` / `Uint8Array.fromHex()` can replace both hand-rolled loops.

### 16. P2 — SQL Server's LIMIT trap is patched per call site

Locations: `apps/app/src/core/queries/rows/search.ts:39-44`, `apps/app/src/core/queries/rows/list.ts:101`, `apps/app/src/core/queries/rows/distinct.ts:27-54`, `apps/app/src/core/runtime/dialects/mssql/index.ts:43-58`.

`MssqlQueryCompiler.visitLimit` compiles every `.limit()` to `OFFSET … FETCH`, which SQL Server accepts only after `ORDER BY`. `search.ts` threads a `ConnectionType` into a shared builder just to pick `top` over `limit`; `list.ts` keeps a fourth copy of its body to add `order by (select null)`; `distinct.ts` (`.distinct().limit()`, no order — predates the branch) is still broken on SQL Server and is called by the seed panel.

Fix: own it once in the compiler — a limit without offset becomes `TOP`, an offset without `orderBy` gets `order by (select null)`. `search.ts` loses its branch and parameter, `list.ts`'s bodies become identical, `distinct.ts` starts working. Add a case to `mssql/index.test.ts`.

### 17. P2 — The cell cursor has no single owner

Locations: `apps/app/src/core/table/grid-cursor.ts:73-84,119-124,206-211`, `apps/app/src/core/table/clipboard.ts:27-49,105,131`, `apps/app/src/core/table/grid-input.ts:104-107`, `apps/app/src/core/table/cursor-context.ts`, `apps/app/src/core/table/cell/cursor.ts`, `apps/app/src/core/table/cell/cell.tsx:153-216`.

- `gridClipboard` takes 10 arguments, all locals of `useGridCursor`; `cursor`, `indexOf` and `store` travel together through `CursorContext`, `useGridPointer`, `useGridHotkeys`, `SelectionSummary` and `CellField`.
- The store is written around the cursor API: `clipboard.ts:105` sets anchor/cursor, `grid-input.ts:106` clears the anchor, `cell.tsx` `JsonPeek onClose` sets `peek: false`.
- `paste` returns "the value to type over the cell, or undefined" for `cursor.paste` to `edit` + `commit` — a return-value protocol between modules. `writeAll` (a bulk write used by `cursor.fill`) lives in `clipboard.ts`.
- `layout === 'grid' && isNested(getValue(cell))` is written twice (`data-grid.tsx:188`, `grid-cursor.ts:240`); `isNested` is a value predicate living in `json-tree.tsx`.
- `cursor.apply(x); cursor.cancel()` is recomposed three times (`cell-field-actions.tsx:42,64`, `cell-select.tsx:59`); Tab/Shift+Tab → `cursor.leave(0, ±1)` is copy-pasted (`cell-editor.tsx:68`, `cell-reference.tsx:192`); multi-select writes the draft and mirrors it into edit text on every toggle.
- A failed commit refocuses via `document.querySelector('[data-editing] :is(textarea, input)')`, coupling the hook to `cell-editor.tsx`'s markup.
- The concept spans `cell/cursor.ts`, `cursor-context.ts` and `grid-cursor.ts`, with imports running both ways between `cell/` and its parent. `CellField` receives `readOnly`, `canDefault`, `transformer` and `connectionType`, all derivable, plus `store` only to subscribe to `edit`.

Fix: make the cursor the only owner — it holds `store`, `indexOf`, `cellAt`, `layout`, `writeAll` and `canPeek(cell)`, with a verb per transition (`collapse`, `closePeek`, `select`, `set`). The context value becomes `cursor` (plus `connectionType`); the clipboard is built from it; single-value paste becomes `cursor.edit(v); cursor.commit()`. Merge `cell/cursor.ts` and `cursor-context.ts` into one `core/table/cursor.ts` and move `isNested` next to `getDisplayValue`. Lift Tab/Shift+Tab into `CellField`'s popup hotkeys (`enabled: !language`). Refocus from `CellField`'s blur handler and delete the selector and `data-editing`. Keep the cursor type in a leaf to stay clear of `import/no-cycle`.

### 18. P2 — The reference peek is opened by clicking a DOM button

Locations: `apps/app/src/modules/table/components/table/table.tsx:83-84,283,329`, `apps/app/src/modules/table/components/references/reference-buttons.tsx:46,96`, `apps/app/src/modules/table/components/references/reference-peek.tsx:174-236`, `apps/app/src/core/table/cell/cell-reference.tsx:140-172`.

Keyboard preview and the context menu's "Show References" run `cell.querySelector('[data-reference]')?.click()`; the popover anchors through `closest('[role="gridcell"]')`. Every cell with a value and a reference mounts its own `Popover` root, and which hop opens depends on DOM order. The same file already does this properly for `DistinctValues`. Separately, `cell-reference.tsx` rebuilds the peek's rows-hop query object by hand, with a comment requiring the keys to match, and assembles the search `queryFn`/`queryKey` inline where every other rows read exposes `…QueryOptions`.

Fix: table-level `useState<{ anchor: Element; hop: Hop } | null>` driving one `<ReferencePeek>`; `ReferenceButtons` takes `onPeek(hop)`, and preview/menu build the hop explicitly. Close on scroll explicitly. Move `matchQuery` (`references/hops.ts:60-68`) into `core/queries/rows/list.ts` and add `searchRowsQueryOptions` to `rows/search.ts`; both callers use them and the sync comment goes away.

### 19. P2 — SQL statement shaping leaked into value transformers

Locations: `apps/app/src/core/transformers/value-transformer.ts:15-16`, `apps/app/src/core/transformers/raw.ts:56-68`, `apps/app/src/core/transformers/create-transformer.ts:25-29`, `apps/app/src/modules/table/components/toolbar/drafts-actions.tsx:75-86`, `apps/app/src/core/catalog/capabilities.ts:92,153`.

`toStatement?` on `ValueTransformer`, a ClickHouse `format(JSONEachRow, …)` expression in `raw.ts`, a `connectionType === ConnectionType.ClickHouse` branch in `createTransformer` (restating what the ClickHouse `jsonColumnType` regex already encodes), and `statementValue` in the toolbar hand-spelling `sql\`default\``— three layers jointly decide how a draft binds.`dialects.md`puts per-engine statement logic in the subject's`shape.ts`.

Fix: one `bindValue(connectionType, columnType, value)` in `core/queries/rows/shape.ts` (`undefined` → `default`; JSON column → ClickHouse expression or `JSON.stringify`; else unchanged), called by the set/insert queries. Deletes `toStatement`, `createClickHouseJsonTransformer`, the dialect comparison and `statementValue`. Complements finding 12's "SQL value conversion belongs with save orchestration".

### 20. P2 — Review drawer and save controls are duplicated with the visualizer

Locations: `apps/app/src/modules/table/components/table/drafts-review-drawer.tsx:132-170,259-290` vs `apps/app/src/modules/visualizer/components/review-drawer.tsx:116-137,191-226`; `apps/app/src/modules/table/components/toolbar/drafts-actions.tsx:408-471` vs `apps/app/src/modules/visualizer/components/toolbar.tsx:108-161`.

Same Drawer frame, "Review changes" header with `plural(...)` description, `PaneEmpty` empty state, `cardClass` groups with identical headers, and footer (Discard all, Close, tooltipped primary with `LoadingContent` and ⌘S). Both toolbars repeat the AnimatePresence Review/Save cluster. The commit extracted `DiscardButton`, `plural` and `cardClass`, then stopped.

Fix: `~/components/staged-review.tsx` with `StagedReviewDrawer`, `ChangeGroup` and `StagedActions`; each module supplies its rows. ~150 lines fewer.

### 21. P2 — `DocumentList` copies Grid's shell and fakes its cell contract

Locations: `apps/app/src/core/table/document-list.tsx:67-81,98-104,137-196`, `packages/table/src/index.ts:9`, `packages/ui/src/styles/globals.css` (`--list-top` / `--list-height`).

It repeats Grid's `ScrollArea role="grid"` shell, `renderBody`, `footer`, `useEndReached` (exported from the package only for this file) and the `scrollToRef` handle. `--list-*` duplicates `--grid-top` / `--grid-height`. It builds fake `GridCellProps` (`column: { id: '', size: 0 }`, `size: UNTRUNCATED`, `NO_STYLE`), so `renderGridCell` turns a real `Column` into a fake one and looks it up again via `byId`. `PlainLabel` (`data-grid.tsx:68-72`) is unreachable.

Fix: give `DocumentList` a `renderCell(cell: DataGridCell)` and `ExtraColumn.renderCell` a `{ row, rowIndex, style? }` shape; reuse `--grid-*`; pick one owner for the scroller (move `DocumentList` into `packages/table` or extract the shell).

### 22. P3 — Shift+↑/↓ is bound twice on one element

Locations: `apps/app/src/core/table/grid-input.ts:61-65`, `apps/app/src/core/table/data-grid.tsx:30-31,164`, `apps/app/src/modules/table/components/table/table-selection.tsx:130-170`, `apps/app/src/modules/table/components/table/table.tsx:249-255`.

The grid binds Shift+Arrow while a cursor exists; `useRowRangeKeys` binds the same keys on the same `scrollRef` with `conflictBehavior: 'allow'` and steps aside by calling `hasCursor()` through the module-level `tableGridRef`.

Fix: one binding in `useGridHotkeys` — `hasCursor ? cursor.step(d, 0, true) : onExtendRows?.(d)` — with an `onExtendRows` DataGrid prop. Deletes `DataGridHandle.hasCursor`, the second `useHotkeys`, `conflictBehavior` and its comment.

### 23. P3 — "Is this row new?" is index arithmetic in six places

Locations: `apps/app/src/modules/table/components/table/table.tsx:205,306,352-354`, `apps/app/src/modules/table/components/table/table-body-cell.tsx:36-38`, `apps/app/src/modules/table/components/table/drafts-review-drawer.tsx:102,193`.

Each site derives it from `newRows` leading `gridRows` (`newRows.at(rowIndex)`, `rowIndex < newRows.length`, `rowIndex - newRows.length`, `newRows.length + index`); only a doc comment in `core/table/session.ts:28` ties them together.

Fix: one `rowAt(index): { kind: 'new', newRow } | { kind: 'saved', row, keys, index }` beside `newRowsActions` (or tag grid rows with their staged id — see finding 9). The `isEditable ? … : undefined` guards in `valueOf` / `hasDraft` also go.

### 24. P3 — Column menu is built twice in two shapes

Locations: `apps/app/src/modules/table/components/table/table-header-cell.tsx:53-207`, `apps/app/src/modules/table/components/table/table-cell-menu.ts:81-138`.

The header offers sort as checked items plus Rename, Copy Name, Labels, Pin, Hide; the cell menu's "Column" group builds a second sort UI as a radio submenu and a second "Rename Column". `tableCellMenu` takes seven optional callbacks plus a store.

Fix: one pure `columnMenuItems(column, state, actions)` used by both.

### 25. P3 — Referenced tables' columns are fetched in four places

Locations: `apps/app/src/modules/table/components/toolbar/filter-search-bar.tsx` (`related` `useQueries`), `apps/app/src/modules/table/lib/labels.ts:43-76`, `apps/app/src/modules/table/components/table/table-header-cell.tsx:72-85`, `apps/app/src/core/table/cell/cell-reference.tsx:125-135`.

Each fetches the foreign table's columns (the header once per header, and per field per document in documents view); three repeat the "text columns other than its key" filter.

Fix: one `useReferencedColumns(columns)` (or referenced columns on `ColumnsContext`) plus a shared `labelCandidates`.

### 26. P3 — `rowSelection` sits in core with one module consumer

Locations: `apps/app/src/core/table/row-selection.ts:11-60`, `apps/app/src/modules/table/components/table/table-selection.tsx:83-99,147-163`.

Its only importer is the table module. The caller unpacks six fields from `store.get()` and merges the result back with `store.set(c => ({ ...c, ...update }))`. The session keeps two anchors for one selection (`lastClickedIndex`, `selectionState.anchorIndex`).

Fix: move to `modules/table/lib` as a pure reducer over state. Merging the two anchors changes repeated Shift-click to Finder-style anchoring — confirm before doing it.

### 27. P3 — `toTsv` duplicates the shared CSV quoting

Locations: `apps/app/src/core/table/tsv.ts:1-7`, `packages/shared/files.ts:23-34`.

Same quote-and-double-`"` escaping with a different delimiter.

Fix: add a delimiter parameter to `escapeCSVValue`, put `toTsv` / `parseTsv` beside `toCSV`, delete `tsv.ts`.

### 28. P3 — Row query builders mix two idioms and re-dispatch on dialect

Locations: `apps/app/src/core/queries/rows/search.ts:22,51-54`, `apps/app/src/core/queries/rows/value-counts.ts:28,49-52`, `apps/app/src/core/queries/rows/column-stats.ts:18`, `.agents/rules/dialects.md:5`.

Entries call e.g. `searchRows(db, ConnectionType.MSSQL, params)` and the builder indexes `textContains[connectionType]` — redoing `createQuery`'s dispatch; the contains-term clause is written twice. `rows/` now has spelled-out entries (`select`, `delete-by-filters`, `distinct`, `list`, `total`) beside shared-builder ones (`set`, `insert`, `column-stats`, `search`, `value-counts`), while `dialects.md` still says no shared wrapper stands between statement and `createQuery`. `column-stats.ts:18` defaults a row an ungrouped aggregate always returns.

Fix: entries pass the dialect's function (`mssql: (db) => countValues(db, textContains.mssql, params)`) or a `containsTerm` helper in `shape.ts`; pick one idiom and update `dialects.md`; use `executeTakeFirstOrThrow` for the stats row.

### 29. P3 — Minor

- `.agents/skills/tamery-ui/gotchas.md:78` records a measurement ("~11ms a frame against ~0.5ms"), which CLAUDE.md forbids; delete the sentence, keep the rule.
- `packages/shared/filters/kysely.ts:62` builds `sql.table(\`${via.schema}.${via.table}\`)`; a dot in either part breaks it. Use `sql.id(via.schema, via.table)`.
- The 8px gutter is private `GUTTER` in `packages/table/src/grid.tsx:21`, copied as `w-2` in `table-skeleton.tsx:38-39` with two keep-in-step comments; export it from `@tamery/table/constants`.
- More hand-built plurals despite `~/lib/plural`: `table-header-cell.tsx:131`, `reference-buttons.tsx:110`, `set-value-dialog.tsx:46-47`, `actions-columns.tsx`, `actions-order.tsx`.
- `packages/ui/src/components/command.tsx`: `sm` styles children both via descendant selectors and via `data-size` group variants; use one.
- `cell.tsx:38-103` repeats `value !== null &&` across five branches; one guard then a `switch (column.uiType)`. `cell-editor.tsx:49` sniffs `type.includes('xml')` beside the `jsonColumnType` capability.

Already addressed in the uncommitted working tree at review time (confirm they land): `core/table/cell/row-label.ts` ranking referenced rows by a regex different from `lib/labels.ts`'s label column (file deleted); `navigator/tables-list.tsx` replacing the exhaustive `rowContentOf` dispatcher with an inline if/else chain plus an array-copying `slice().findLast` (restored); the cell-cursor description duplicated across `patterns.md` and `colors.md` (being removed).

## Code review findings

### 30. P1 — Filter or sort change discards staged rows without undo

Location: `apps/app/src/modules/table/lib/history.ts:43`.

A filter or sort change calls `draftsActions.clear()`, which now also wipes staged new rows, then resets the undo stack. Staged inserts do not depend on the query. Duplicate three rows, fill in their cells, then click a column's Sort → Ascending or Filter by Value: every staged insert and edit disappears without confirmation, and ⌘Z restores nothing because `steps.current` was just reset.

Fix: keep staged inserts across query changes (they belong to the table, not the result set), or confirm before discarding and keep the history step so ⌘Z can restore it. Finding 13's restructure must not carry the unconditional `clear()` + `history.reset()` over.

### 31. P2 — ⌘S skips the cell edit still open

Location: `apps/app/src/modules/table/components/toolbar/drafts-actions.tsx:404`.

The save hotkey commits drafts, but an open editor's text lives only in the cursor store until commit or blur. Type a value and press ⌘S without leaving the cell: the transaction saves the other drafts and reports success without the typed value, which becomes a fresh unsaved draft when the editor blurs.

Fix: commit the open edit before collecting drafts in the save action.

### 32. P2 — Filter by Value filters on the unsaved draft

Location: `apps/app/src/modules/table/components/table/table-cell-menu.ts:107`.

`valueOf(cell)` returns the pending draft, not the stored value. Edit `status` from `open` to `closed` (unsaved), then right-click → Filter by Value: the filter becomes `status = 'closed'`, which matches no saved row. The filter change then triggers finding 30 and wipes the draft, so the edit is lost and the row disappears.

Fix: filter on the stored value.

### 33. P2 — ClickHouse rewrites ISO-looking strings as dates

Location: `apps/app/src/core/runtime/dialects/clickhouse/index.ts:55`.

Any ISO-looking string parameter becomes `parseDateTime64BestEffort(...)` whatever the target column type, in SET values and WHERE filters alike. Editing a `String` column to `2024-01-01T10:00:00Z` writes a DateTime64 that ClickHouse casts back to `'2024-01-01 10:00:00'` in the server timezone, silently changing the user's text. A primary key or filter on a `String` column holding ISO text compiles to `col = parseDateTime64BestEffort(...)`, which fails or matches nothing, so the save cannot find its row.

Fix: convert based on the target column type, not the value's shape — it fits finding 19's `bindValue(connectionType, columnType, value)`.

### 34. P2 — Infinite scroll stalls after a refetch

Location: `packages/table/src/use-end-reached.ts:15`.

The effect re-runs only when `count` or `lastIndex` change. An end-reached call that no-ops because `isFetching` is true never retries; the old `TableInfiniteLoader` re-ran on `isFetching`/`hasNextPage`. Scroll to the bottom while rows refetch (after a save or ⌘R): if the refetch returns the same row count, the footer spinner stays and the next page never loads until the user scrolls away and back.

Fix: include the fetch state in the effect's dependencies.

### 35. P2 — Large selections crash the selection summary

Location: `apps/app/src/core/table/selection-summary.tsx:29`.

`Math.min(...numbers)` and `Math.max(...numbers)` pass one argument per selected numeric cell, and `selection()` is unbounded. Shift-click across several thousand loaded rows and many numeric columns (beyond roughly 100k cells) and the spread throws `RangeError: Maximum call stack size exceeded` during render, crashing the grid.

Fix: compute min and max in a single loop.

### 36. P3 — Double-clicking a boolean checkbox toggles it three times

Location: `apps/app/src/core/table/grid-input.ts:143`.

Both `onClick` (when the target is the checkbox) and `onDoubleClick` call `cursor.edit()`, which toggles a boolean cell. Double-clicking the checkbox fires click, click and dblclick, so the draft ends up inverted; double-clicking the cell padding flips it once.

Fix: skip the double-click toggle when the target is the checkbox.

## Verification

20 focused tests passed across six files (33 assertions):

```sh
cd apps/app
bun test src/core/table/tsv.test.ts src/core/table/cell/utils.test.ts src/core/transformers/raw.test.ts src/core/transformers/boolean.test.ts src/core/runtime/dialects/mssql/index.test.ts src/core/runtime/dialects/clickhouse/index.test.ts
```

The focused tests do not cover the JSON draft comparison or default-only insert failures. Both were checked separately with runtime calls against the installed code and dependencies.

Additional checks from the thermo-nuclear review:

- `pnpm run check`: passed.
- `pnpm --filter @tamery/app check-types`: passed.
- `pnpm --filter @tamery/table --filter @tamery/connection --filter @tamery/query-proxy check-types`: passed.
- `pnpm --filter @tamery/app test`: 159 passed, zero failed.
- Focused changed tests plus `packages/shared/filters/kysely.test.ts`: 21 passed, zero failed.
- Real cursor/session reproductions demonstrated findings 9 and 10; installed Kysely compilation demonstrated finding 2.

These checks ran against the workspace as it existed at execution time. Concurrent changes mean they do not certify the final working tree. No live database execution or browser QA was performed in the thermo-nuclear review. The added parser/transformer/compiler tests protect useful contracts, but do not cover cursor identity across row-set changes or edits made during saves. Approval needs owner-boundary regression proof for those interactions.

Findings 13–29 come from a second, four-area thermo-nuclear pass over the same committed snapshot (grid core, cell layer, table module, queries/dialects/navigator). Each claim was checked against `HEAD`; none were reproduced at runtime. Overlapping points from that pass were merged into findings 2, 8 and 12.

Findings 30–36 come from a static `/code-review` of the same committed snapshot, checked against `HEAD` and not reproduced at runtime. Its overlapping points were merged into findings 6 (untracked actions), 9 (cursor and anchor shift with row changes) and 11 (PostgreSQL geometric types).

Summary: 36 distinct findings: three P1 data-loss blockers (9, 10, 30), 24 P2 and 9 P3. Default-only inserts, oversized files, save orchestration, analytics, row identity and distinct-value eligibility combine overlapping findings from the reviews. Recommendations are also recorded in `IMPROVEMENTS.md`.
