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
- **More engines** (Mongo icon exists) — no differentiation, each costs dialect work.
- **Team features** — blocked until multi-member workspaces exist.
