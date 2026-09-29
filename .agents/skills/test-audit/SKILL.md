---
name: test-audit
description: Invoke whenever writing, changing, reviewing, or sweeping tests. Authoring gate for new tests plus audit workflow for low-value, implementation-coupled, or duplicative tests and the test-only production seams they demand.
---

# Test Audit

Two modes, one value bar. Authoring mode gates every new or changed test at write time. Audit mode sweeps for tests that re-assert source, duplicate stronger proof, couple behaviour to implementation, or keep test-only production seams alive. Optimize for confidence, not deletion count.

Stack: `bun test` for unit tests (colocated `*.test.ts`), Playwright for E2E (`apps/app/e2e`).

## Authoring gate

Before adding any test, answer four questions; a missing answer means do not add it yet:

1. What observable behaviour, invariant, or independent contract does it protect?
2. What credible regression makes it fail?
3. Why does existing coverage not already catch that failure? Each contract has one primary test owner at the strongest boundary; another layer needs its own distinct risk. Prefer extending a table-driven case (`test.each`) or shared fixture over a near-duplicate test.
4. Does it need a production seam (export, flag, wrapper, injection hook) no production caller needs? If yes, move the test to the real boundary instead.

Then check the test against every [junk pattern](#junk-patterns); a match fails the gate unless the [retention bar](#retention-bar) names the contract it independently guards. A test that breaks under behaviour-preserving refactoring asserts implementation, not behaviour; rewrite it at the owning boundary.

Bug regression tests must fail on the pre-fix code for the intended reason and pass after the fix. A regression test that never demonstrably failed proves the mock, not the fix. One regression at the owner boundary covers the bug; do not replay it at every layer it crosses.

## Junk patterns

- assertion-free coverage probes;
- self-comparisons and identity copiers;
- copied fixtures, inventories, manifests, or export lists;
- exact source, import, or string greps;
- private predicate or call-shape tests duplicated at real boundaries;
- duplicate invocations of the same contract;
- per-dialect replays of a shared helper;
- tests whose only purpose is preserving test-only exports, globals, or wrappers;
- dead production code whose only callers are tests;
- expected values produced by the helper under test;
- mocks that implement the asserted behaviour, or one mock standing in for different APIs;
- fixtures that supply the result or ordering the owner should produce;
- capability tests that restate declared flags instead of exercising what the flag gates;
- negative controls that pass for an unrelated reason, such as a rejection from a different guard;
- names or fixtures that promise more than the input exercises.

## Value bar

Tests justify their maintenance cost by protecting behaviour, a credible regression, or an independently meaningful contract. In an audit, an existing test that must change for behaviour-preserving reorganization is suspect, not automatically deletable.

Before judging a candidate, read the complete test and production owner, its callers, sibling implementations (other dialects), overlapping tests, and relevant history. When the test claims dependency-backed behaviour, inspect the dependency source or types directly.

## Discovery

Keep discovery read-only and report evidence before editing. For broad scope, split lanes: `packages/`, `apps/app/src`, `apps/app/e2e`, plus a cross-cutting pattern sweep. Prefer a few high-confidence candidates over a large speculative inventory.

## Retention bar

Keep a test when it independently enforces a public API, protocol, parser, per-dialect SQL, encryption, security, default, or architecture contract. Also keep:

- call ordering when order is observable behaviour;
- regressions with a credible failure mode;
- source inspection when it is the cheapest independent guard — fails when the contract changes, survives an identifier-only rename;
- a retained test that fails on the baseline: treat it as a possible product bug, reproduce it, and repair the owner rather than deleting it.

Static or slow is not a deletion reason. A test that resembles implementation may still be the independent contract; prove otherwise before removing it.

## Candidate evidence

Record every field before editing. A missing field means the candidate is not ready for deletion:

- exact test name and location;
- what failure it can actually detect;
- non-test callers of the covered seam;
- stronger remaining owner-boundary proof, or why no proof is needed;
- why the test or seam exists (history);
- production or test-support deletion unlocked;
- risk and the focused validation command.

## Edit shape

One coherent owner-boundary batch at a time. Delete obsolete test-only exports, wrappers, and dead production paths instead of preserving aliases. Move retained regressions to their canonical owners. Prefer net-negative production LOC. Do not add replacement tests that restate the same implementation.

## Validation

1. Run the owner and sibling tests: `bun test <path>`.
2. `pnpm run fix && pnpm run check`, then `git diff --check`.
3. `pnpm test` before handoff.
4. Inspect `git diff --numstat`; report production separately from tests.

## Handoff

Report: removed low-value categories; production simplifications; retained false positives and why they stay; proof actually run; production versus test LOC; named follow-ups.
