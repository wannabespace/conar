# Improvements

Backlog of product improvements, ranked by uniqueness vs effort. **Every future improvement idea goes in this file** — append it to the matching section (or a new one) instead of leaving it in chat, a PR description, or a scratch doc. Remove an entry when it ships or gets rejected.

Suggested order: 5 → 1 → 3 → 2. Schema notes improve every AI feature at once, the agent reuses drafts, impact preview makes the agent safe, and MCP exposes the same safe tools to outside agents.

## Ranked

1. **Agent chat where every AI write is a reviewable draft.** The chat (`packages/ai/features/chat-stream.ts`) gets no schema and no tools today. Add tools — `listTables`, `describeTable`, `runReadOnly` (row-capped, through the client proxy) and `proposeChange`. `proposeChange` writes into the existing table/visualizer drafts and review drawer, so the AI never writes to the database directly; the user approves a diff. Tools are schema-only in `packages/ai` (no `execute`) and run in the renderer, where connections live: MCP's implementations (`modules/mcp/describe-table.ts`, the `tables`/`query` methods in `mcp-source.ts`, `fetchForAgent`) move to `core/agent/` taking a resolved `connectionResource`, with `modules/mcp` and `modules/chat` each a thin adapter (target resolution, error hints, events).
2. **MCP beyond the desktop server.**
   - `tamery mcp` in the CLI for web-only users (needs a CLI sign-in + `cli query`).
   - More per-connection policy: row limit, masked columns.
   - A server-side row cap: on Postgres, MySQL and SQL Server the 200-row cap bounds memory but not transfer — the server still sends every row over the app's only pooled connection. SQL Server's `SET ROWCOUNT` would also cap `execute`'s writes and MySQL's `SQL_SELECT_LIMIT` is session state, so Postgres needs a cursor and the others a reset that cannot be skipped.
   - With no signed-in window open, main could open one instead of answering "Open Tamery and sign in first.".
   - Tools that act on Tamery itself — rename a connection, open a table or query in a tab for the user. Asked to rename a connection today, an agent has no tool for it.
   - A Settings switch (or an approval) for agent-created connections: today nothing stops an agent adding one — even one steered by text in the rows it read — and each attempt test-connects to whatever host and port it names; the connection always starts at Ask before writing.
   - `query` is read-only and always rolled back, so it could retry once on a dropped connection like typed catalog reads do; today the first query after a server closes an idle connection fails with "Connection lost".
   - Row estimates beyond Postgres and MySQL: SQL Server's `SHOWPLAN_XML` `EstimateRows`, ClickHouse's `EXPLAIN ESTIMATE` for the `SELECT` a mutation filters on.
   - A token per client: every client shares one token, so **Connected clients** trusts the name each reports and none can be cut off alone. Per-client tokens make the list trustworthy and revocable, at the cost of a different config per client.
3. **Impact preview before a destructive run.** The runner, and MCP's Ask before writing, could try an `UPDATE`/`DELETE` in a transaction that rolls back, show the changed rows, and require it on connections marked as prod. Only an allowlist is safe to try: one plain DML statement with no transaction-control, `INTO`, `COPY` or procedure word, since a SQL Server batch can `COMMIT` mid-statement and some statements act outside the transaction.
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

- **New backup codes from Settings.** Backup codes are shown once, when 2FA turns on; someone who lost them or used them up has to turn 2FA off and on again. A "Regenerate backup codes" action (`twoFactor.generateBackupCodes`) would cover it.
- **Track web auth actions.** `apps/main` has no PostHog, so sign-in, code and two-factor actions on the web are invisible; only the desktop's `signed_in`/`signed_up` after the exchange is captured.

## Connections

- **Say why a connection row won't open.** The row is clickable only through its overlay link, which renders only when the selected resource is in the synced resources collection and the connection can be queried (`connection-card.tsx`). Otherwise a click does nothing and nothing is shown — no hover, no reason. The row could fall back to opening the connection or show a tooltip saying why it can't.

## Settings

- **One home for the theme.** Theme now lives in Settings → Appearance and still in the avatar menu; keep one once it is clear which people use.
- **Sync preferences to the account.** Theme, shortcut reveal and the analytics choice are per device (localStorage), and Clear cache resets all but the analytics choice. Syncing them would carry the choice to a new machine.
- **Settings… in the native app menu.** Mac users look for ⌘, under the Tamery menu, but only the avatar menu and the in-page hotkey open Settings. Needs a menu item plus a main-to-renderer navigate event.
- **Re-check ⌘ hints while ⌘ is held.** A hint hit-tests its control once, when the reveal starts, so a control uncovered mid-hold (a menu closed) shows no hint until ⌘ is pressed again.
- **Ask for browser notification permission from a gesture.** The web build asks on the first notification, which Safari ignores outside a user gesture and which reaches every other browser while the user is away. A Settings → Notifications switch (or the first chat send) could ask instead, and let the user turn notifications off.

## SSH tunnels

- **Honor more of `~/.ssh/config`.** `UserKnownHostsFile`, `StrictHostKeyChecking` and `ProxyJump` are ignored: host keys always go to `~/.ssh/known_hosts`, a new key always asks, and a bastion behind another bastion can't be reached.

## Connection form

- **A local model for pastes the parsers don't read.** When `guessConnection` finds nothing, the app could hand the text to a small model running on the device (desktop, or the browser through WebGPU/WASM, as in-browser extractors already do) to pull out host, port, user and database from the long tail (compose files, Kubernetes secrets, a wiki paragraph), then show the result for confirmation like any paste. Only as a fallback: the text holds secrets, so it never goes to the cloud, and a model can garble a password, so the parsers keep everything they recognise. Details in `PASTE-MODEL.md`.
- **Ask for a password the server turns out to need.** A connection saved without a password (Save goes through after a failed test) that the server then rejects for it only shows the diagnosis on the card; `PasswordForm` opens only when `isPasswordExists`. Opening it on that auth failure too, and setting `isPasswordExists` on save, would recover it without a trip to Edit.
- **An SSL control per engine.** SSL today is typed into Options (`sslmode=require`, `encrypt=true`, `ssl=true`). A switch whose meaning comes from `capabilities.ts` would save users from learning each driver's parameter.
- **Offer the clipboard on open.** The form only reads what is pasted; the desktop app could read the clipboard on open without a prompt and, when it holds something `guessConnection` recognises, offer to fill the form from it.
- **SSH through `tamery proxy`.** The local proxy runs on the user's machine, like the desktop app, so it could open tunnels too and make SSH connections usable from the web app.
- **Diagnose from the server's side too.** The failure rules read only the driver's message; a TCP probe of the port (open, closed, filtered) and a DNS check for IPv4/IPv6 records, run on the device before the driver, would tell "nothing listening" from "firewalled" from "IPv6-only" without guessing from the error text.
- **Retest after an SSH fix.** Turning the tunnel on from the failure alert stops at focusing SSH Host; once the bastion host is filled in, the test could rerun on its own.
- **Hide found databases that are already saved.** The create page lists every database it finds on the machine, including ones the user added last week. Matching each against saved connections the way a connection link does (engine, host, port, user) would leave only what is new, and the list could disappear once everything is in.
- **Bring DBeaver's SSH tunnel along.** Found TablePlus connections carry their SSH host, but DBeaver keeps its tunnel in a handler block of `data-sources.json` that the reader skips, so a DBeaver database behind a bastion arrives without its tunnel.
- **Test as you go, then pick the database.** A debounced background test once host and credentials are filled would turn the footer into a live status ("Connected · PostgreSQL 16.4 · 12 ms") and drop the separate Test step; once it connects, Database becomes a combobox of the server's real databases instead of a free-text guess.
- **Mark production at creation.** A host or database containing `prod` (or a provider's production branch) could preselect a red color and a "Production" label, and offer read-only or ask-before-writing access there, so the safety decision happens before the first query instead of after the first mistake.
- **Add every database in a pasted `.env`.** A `.env` often holds several (`DATABASE_URL`, `ANALYTICS_DATABASE_URL`, `SHADOW_DATABASE_URL`); the parser takes the first. Listing all of them with a checkbox each would add a project's databases in one paste, named from their variable.
- **Open in Tamery links beyond the desktop.** The desktop app opens `postgres://`, `mysql://` and the other database schemes, but a browser can register only `web+` schemes, so the web app gets none. A `tamery://connect?url=…` link (and `tamery add <url>` in the CLI) would reach both.
- **Fill the password from a matching link.** A database link that matches a saved connection opens it as is; when the saved string has no password and the link carries one, offering to store it would skip the password form.
- **Secrets from a password manager.** Accept `op://vault/item/password` (1Password) and Keychain references in the password field, resolved at connect time, so a synced connection string never holds the secret itself.

## Developer experience

- **Enforce the 300-line ceiling in lint.** `code-style.md` sets it, but `oxlint.config.ts` has no `max-lines`, and about 40 files are over it (`definitions/sections/constraints.tsx` is 660). Split those files, then turn `max-lines` on so the ceiling holds without a review.
- **Name the missing AI key in dev.** `OPENROUTER_API_KEY` and `MISTRAL_API_KEY` are dev-optional in `apps/api/env.ts`, so a worktree whose `.env` predates them boots fine and every AI call answers an opaque `INTERNAL_SERVER_ERROR`. A startup warning listing the unset AI keys would point straight at the `.env`.
- **Close the kit sidebar's gaps.** Navigator call sites still restyle `@tamery/ui` sidebar parts: five pass `text-muted-foreground` to a `SidebarMenuButton` icon, `schema-row.tsx` turns `SidebarGroupLabel` into a hoverable row, and two use `size-3.5!` against the button's `[&_svg]:size-4`. A muted-icon default, an interactive group-label variant and a small trailing-icon size would move those into the kit (`tamery-ui` rule 11). Its `variant` is a `variant === 'muted' &&` switch inside `sidebar.tsx`; with those additions it becomes a `cva` in `sidebar.utils.ts` like every other kit variant.

## AI

- **Exact cost from OpenRouter.** Usage rows are priced from the LiteLLM sheet (`packages/ai/models/price.ts`), so caching discounts, provider routing and fallbacks are approximated. OpenRouter reports the billed cost per call in `providerMetadata.openrouter.usage.cost`; recording that drops the daily sheet fetch and makes `cost` exact.
- **Codestral completion through OpenRouter.** Inline completion still calls Mistral's FIM endpoint directly (`@mistralai/mistralai`, `MISTRAL_API_KEY`) because OpenRouter does not pass `suffix` through. Move it once OpenRouter supports fill-in-the-middle, leaving one provider key.

## Website

- **Track landing interactions.** `apps/main` has no PostHog, so bento hovers, pricing-period toggles and Enterprise contact requests are invisible. Counting them (enums and counts only) would show which features draw people in.
- **Hide the star count when GitHub fails.** The account sidebar shows `0` stars whenever the repo request fails (always in dev, which gets a 404); hiding the number until it loads would avoid an unflattering zero.
- **Centre the sign-in code field.** The OTP input sits under a left-aligned label on an otherwise centred page; a label-less, centred code field would read more natively.
- **Scroll the active account row into view on mobile.** The account sidebar becomes a horizontal strip below `md`, but it doesn't scroll the active row into view.
- **Even out the engines strip.** The logos under the hero carry their brand colours at very different weights — ClickHouse's solid black bars next to MySQL's thin pale dolphin — so the row reads uneven. Monochrome marks tuned to one optical weight would sit as a set.
- **Legal copy still has em dashes.** The terms and privacy markdown use them; changing legal text needs sign-off.
- **Re-verify before deleting an account.** better-auth only deletes a passwordless account from a session younger than `freshAge` (a day), so anyone signed in longer gets a bare "session expired" error. Asking for a fresh email code inside the delete dialog would keep the protection without the dead end.
- **One support dialog for both apps.** The site's support dialog body is a near-copy of the app's; moving one version into `packages/ui` (like the auth side panel and `SettingsGroup`) would end the drift.
- **The deep-link status is a hand-built `Empty`.** `deep-link/open-status.tsx` stacks logo, title, description and action by hand; the kit `Empty` the error page uses covers it, at the cost of a small visual change.

## Keyboard

- **Rebindable shortcuts.** Every binding and hint reads its key from `core/keyboard/shortcuts.ts` by id, so rebinding is a per-device override store read in place of `SHORTCUTS[id].hotkeys` plus a recorder row in Settings → Keyboard (`useHotkeyRecorder`). Still hard-coded outside the map: the native menu accelerators in `apps/desktop/src/main/lib/menu.ts` (New window, Close tab, needs IPC) and the ghost-text Tab in `packages/monaco`. Two ids share a key in different contexts (⌘S save changes / save statement, ⌘D fill down / drop, ⌘↩ submit / run), so a recorder should only flag conflicts inside one context.
- **Toolbars as one Tab stop.** The table and runner toolbars, the Navigator footer and the dashboard's connection rows (each link and ⋯) are still a Tab stop per control; roving arrows would make each one stop like the tab strip.
- **Keyboard column resize.** Header grips are out of the Tab order like the grid's other inner controls, so a column's width is pointer-only; a Width… item in the column menu would give it a keyboard route.
- **Query logger rows.** Every row is its own Tab stop with no arrow movement, and the detail pane sits after all rendered rows, so it is effectively unreachable. Give the list a cursor like the Schema pages (search-field or roving highlight).
- **Visualizer off-screen tables.** `onlyRenderVisibleElements` drops tables outside the viewport from the DOM and there is no keyboard panning, so a keyboard user only reaches them through Zoom out/Arrange. The inspector also opens without focus and closes to `body`.
- **Grid gaps.** Column reorder is drag-only; the cell editor's Set null/Default/Now buttons can never take focus (Tab leaves the cell); an edit whose cell is virtualised away leaves the grid deaf until it scrolls back.
- **Focus after self-unmounting actions.** Removing a filter chip, Run all ↔ Stop, chat send ↔ stop, Clear log and banner Dismiss all drop focus to `body`. The Escape ladder recovers (it lands in the Navigator), but each should hand focus to its neighbour.
- **⌘↩ runs SQL from anywhere.** The runner binds ⌘↩/⇧⌘↩ on `document`, and ⌘-combos fire inside inputs, so ⌘↩ typed in the chat box or the results search runs the statement under the editor caret.
- **Preview tabs from the keyboard.** A preview tab becomes permanent on a click inside its page or a double-click on its row, so a keyboard user's tabs keep replacing each other.
- **Server-rendered session on the site.** `apps/main` reads the session through `authClient.useSession()`, which only resolves in the browser, so a signed-in visitor gets signed-out server HTML that flips after hydration: the navbar's Sign in → Account, the pricing CTA, and `useHomePath`'s landing links (`/` → `/home`). The root `beforeLoad` already resolves the session per request and hydrates the atom, but `useSession`'s server snapshot is the empty atom, so the flip only moves to right after hydration; reading the root context's `session` while the atom is pending would render them right on first paint.
- **The GitHub repo is not public.** `api.github.com/repos/wannabespace/tamery` returns 404, so the site's "Open source" link lands on a 404 for visitors and the account page's star count reads 0. Publish the repo, or drop the open-source claim and star count until it is.
- **Landing first-load main thread.** One ~130 ms frame remains on first load: hydrating the page plus two forced layouts from motion (the projection root reading scroll, and `useScroll` in both the navbar and the hero tilt). arktype's first `type()` (theme store) also costs ~40 ms of entry evaluation on every page.
- **One Mac download that always fits the chip.** The site's Download button sends Mac (and Linux) visitors to /download to pick a file, because on a Mac the browser can't reliably tell the chips apart (Safari is thought to report every Mac's GPU as "Apple GPU"). ToDesktop's Mac Universal Installer (Settings → Build and Deploy) is expected to pick the chip on the user's machine; with it enabled, the button can download straight from the arch-free `mac` URL.
- **Kit overlays still hand-write the house curve.** Popover, dropdown, select, context menu and the message scroller spell out `cubic-bezier(0.32,0.72,0,1)` instead of the `ease-house` token the site uses.
- **Verify the contact-sales rate-limit key on Railway.** It keys on `x-real-ip`; forum reports disagree on whether Railway's edge always sets it to the client address. Check a real deploy's headers, or the limiter may bucket every visitor together.
- **Site theme toggle is untracked.** The app sends `theme_changed`; the site's toggle is the kit `ThemeToggle`, which has no change callback to hang the event on.
- **Keep the Terms privacy link consistent with the footer.** In browser QA, Terms → Privacy Policy opened `https://tamery.app/privacy-policy` in another tab, showing Conar branding and `@conar_app`; the footer opened the local Tamery policy. Use the same policy destination so visitors do not receive different branding depending on the entry point.
- **VPN hosts with public-looking names.** A connection counts as internal (no Open in web app, web routes through `tamery proxy`) only by its host's shape: private IPs, Tailscale's range and `.ts.net`, internal suffixes, dotless names. A split-DNS name like `db.company.com` that resolves to `10.x` only on the VPN still reads as public. The desktop app could resolve the name once and store whether it lands on a private address.
- **Disable "Clear saved credentials" when nothing is saved.** The menu item is always enabled, because the row doesn't record which secrets the device holds; with none saved it can only answer with a toast. Storing which secrets the device holds would let the item disable itself instead.
- **Certificate names in AI requests.** Ask AI redacts the connection's own host, user, database and every IP, but a TLS mismatch error also lists the certificate's DNS altnames, which can name internal hosts. Redacting `DNS:` entries would keep those off the request too.
- **Rename a connection whose server details aren't on this device.** Edit needs the decrypted string, so on a device without it (metadata-only sync, or offline before the first resolve) Edit refuses with a toast. Name, label and color don't need the string; the form could open with the server card locked.
- **Atomic AI usage limits.** Metered AI routes check the quota before the call and record after it, so concurrent requests can all pass the last remaining unit. An increment-then-compare in one statement would close it.
- **Change a connection's sync type after creating it.** Sync is picked only on the create page; Edit has no Sync row, so moving a Full connection to No password (to take its secrets off the server) means deleting and recreating it. Edit could offer the same Sync row: going to No password strips the server copy on the next upload, and going to Full uploads this device's full string.
- **MariaDB sequences in the Navigator.** MariaDB lists a `CREATE SEQUENCE` in `information_schema.TABLES` as `SEQUENCE`, and the table list skips it, so sequences are only reachable from a Query tab. A read-only Sequences section (current value, increment, cycle) would cover them.
- **Detect MariaDB where nothing named it.** A MariaDB server reached through a plain `mysql://` string, a `mysql` command or a saved MySQL connection shows as MySQL. The version query already returns `…-MariaDB`, so a successful test could set the connection's MariaDB flavor.
- **Browse a system-versioned table's history.** MariaDB's system-versioned tables show only their current rows; an "As of" picker in the table toolbar could add `FOR SYSTEM_TIME AS OF` to the read.
- **Name the cause on a connection card's error too.** The connection pane titles its error from the connection diagnosis; the card's own error row still shows the raw message, and its query throws to the error page when decrypting fails. It could reuse the same diagnosis and keep a locked keychain on the card.
- **Remember a declined Keychain prompt.** Picking a found database whose password sits in the Keychain asks macOS each time; after the user declines, picking it again in the same run prompts again. Remembering the denial until restart would fill the form without asking.
