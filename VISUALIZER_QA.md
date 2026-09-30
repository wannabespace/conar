# Visualizer QA: fixes and follow-up checks

Tested on 2026-09-29 through the visible UI in the authenticated Herdr browser, at a viewport of 975 × 735 points. No source code or internal APIs were inspected.

The initial target was the **Tamery / railway** connection. After it remained loading, the user switched to **supa / postgres**, where the Visualizer was tested with the `public` and `extensions` schemas.

## Observed blockers: investigate before assigning a fix

- [ ] **Investigate prolonged loading on Tamery / railway.**
  - Target: `/connection/01a02efa-9fb7-7306-820f-1d5a2661d327/visualizer`.
  - Observed: the diagram stayed on skeleton cards. The banner said **“The database is taking longer than usual to respond.”** Its timer reached 79 seconds. Switching the Navigator to Tables also showed loading placeholders.
  - Refresh and a full reload were attempted; the user then switched connections, so recovery on the original connection was not verified.
  - Impact: diagram inspection and editing were blocked.
  - Determine whether the connection was unavailable or the application failed to recover. The UI observations do not establish a cause or prove a Visualizer defect.
  - Acceptance: verify the connection reaches a populated state or a clear actionable error, and verify retry behavior.

- [ ] **Recheck the sign-in-to-Visualizer journey.**
  - Observed during initial setup: the dashboard appeared, opening the supplied Visualizer URL produced a blank page, and a reload returned to sign-in.
  - Console evidence during that sequence included **Unauthorized**, code **UNAUTHORIZED**, status **401**, and an error reported in **TabBar**.
  - Signing in again allowed navigation to the connection. This was not reproduced after the second sign-in.
  - Impact: the first sign-in did not yield a usable Visualizer session.
  - Establish whether this is reproducible before changing authentication behavior; no implementation cause was determined.
  - Acceptance: sign in from the direct Visualizer link, verify arrival at the intended connection, then reload and verify the session remains usable.

## Remaining QA checks, not established defects

- [ ] Apply drafts against a disposable test database; verify success feedback and schema persistence after reload.
- [ ] Trigger a safe database error on that disposable database; verify displayed error, rollback, and remaining drafts.
- [ ] Test table and column rename, drop, and restore flows.
- [ ] Test foreign-key creation, removal, and draft discard.
- [ ] Test background pan, minimap navigation, and pinch or Control-scroll zoom.
- [ ] Test automatic arrangement and dragged-card position persistence per schema.
- [ ] Test a naturally empty schema and its create-table entry point.
- [ ] Test materialized views and other database engines where in scope.

## Journeys verified as working

- Schema switching between `public` and `extensions`.
- Table and column search, no-match feedback, Command-F focus, and Escape clearing.
- Zoom In and Zoom Out controls.
- Customer inspector columns, relations, and index links.
- Customer index navigation to the matching Schema detail.
- Extension view inspection without column-edit controls.
- Required-name gating and duplicate table-name feedback: **“public already has a table with this name”**.
- Creating the local draft `qa_visualizer_draft`, adding `qa_note` as `text`, and changing it to require a value.
- SQL review showing a single CREATE TABLE with both columns, NOT NULL constraints, and an id primary key.
- Discarding the draft, empty-review feedback, and disabled Apply with zero changes.
- Reloading the populated supa Visualizer with the discarded draft absent.

## Cleanup and limits

The local draft `qa_visualizer_draft` and its `qa_note` column were discarded. No SQL was applied to either cloud database, and no QA database objects remain. The QA-opened Indexes app tab and extra browser tab were closed. Search, schema, and zoom were restored; the wider Herdr pane was retained at the user's request.

The small-window warning below 900 × 600 points is documented behavior and is not a defect. Missing triggers and policies on the inspected table, and read-only extension views, were not reported as defects.
