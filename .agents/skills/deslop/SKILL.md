---
name: deslop
description: Diff-scoped AI-slop pass over the current branch — strip comment slop, defensive-check slop, type laundering, and style drift without changing behaviour. Use before review, or when the user says the diff reads machine-written.
---

# Deslop

Clean only the current branch diff. Preserve behaviour absolutely. Narrower than `cleanup`: no deletions of logic, no UI de-customizing, no bug fixes.

## Checklist

1. Scope to the branch diff: `BASE=$(git merge-base HEAD origin/tamery 2>/dev/null || git merge-base HEAD origin/main)`, then `git diff $BASE...HEAD` plus uncommitted work. Never run a repo-wide cleanup.
2. Inspect every changed hunk for:
   - comments a human maintainer would not write — narration, syntax explanation, prose restating the code. The repo rule applies: a comment is a warning or it does not exist;
   - defensive checks or `try`/`catch` blocks abnormal for the surrounding module, or protecting only imagined states;
   - casts that launder types — `as any`, `as unknown as T`, widen-then-assert flows, `!` where narrowing works;
   - redundant intermediate variables or one-use helpers that add no domain meaning, reduce no duplication, and simplify no control flow;
   - compatibility shims, aliases, retries, and fallback branches — the app is unreleased, so none are owed;
   - naming, control flow, imports, and formatting that conflict with the surrounding file.
3. Make no functional edits. If a cleanup could change behaviour, leave it and report it.
4. Fix a finding inline only when trivial and behaviour-neutral. Otherwise note it for the author.
5. Run `pnpm run fix && pnpm run check`.
6. Report in 1–3 sentences: whether anything changed, and any non-trivial item left for review.

Deslop precedes `/code-review`, never replaces it.
