---
name: pr-triage
description: Speed up a GitHub PR review — sort every changed file into trivial / skim / review, mark the trivial ones as viewed on GitHub, and hand back a reading order for the rest. Use when the user shares a PR link or number and asks to pre-scan it, mark the easy files as viewed, or triage it before they review.
---

# PR triage

Take the trivial files off the reviewer's plate so they only read what matters. Marking a file as viewed is the only thing this skill writes to GitHub. Never approve, comment, or request changes.

## 1. Fetch

Use `gh`, not the browser. `gh pr view --json files` stops at 100 files, so page through the REST endpoint:

```sh
gh pr view <n> -R <owner/repo> --json id,title,headRefOid
gh api --paginate repos/<owner/repo>/pulls/<n>/files > files.json   # save to the scratchpad
jq -s 'add | length' files.json
```

Each entry has `filename`, `previous_filename`, `status`, `additions`, `deletions` and `patch`. Read the patches with `jq -s -r 'add[] | select(...)'`, smallest first. Large files don't need their patches read, because they are never trivial.

## 2. Classify

**Trivial: mark as viewed.** Every hunk has to be one of these, and nothing else can change behavior or a contract:
- a pure rename or move (`status: renamed` with an empty patch), or an import path that follows a move
- import reordering, or an import swapped for a renamed symbol along with its call sites
- a local variable or parameter renamed, where it doesn't reach any exported signature
- an inline refactor with the same logic, e.g. a helper pulled out or a `useMemo` removed
- an unused export deleted, or a local made `export` without changing the local itself
- a formatting-only change

**Skim: leave unmarked, list it.** Small but real changes:
- a style or value tweak, like a className, color, duration or copy
- a dependency bump in `package.json`, the workspace catalog, or env files
- a generated file, like a lockfile or `.types` output
- docs, rules and skill files

**Review: leave unmarked, put it in the reading order.** Anything else, including:
- new or changed props, fields, schemas, router procedures, IPC channels or env vars
- a changed function signature, even with an additive argument
- new files, and files deleted along with the logic they held

If you're unsure, the file is not trivial. A wrongly marked file hides code from the reviewer. A wrongly unmarked one costs a few seconds.

## 3. Mark

```sh
gh api graphql -f query='mutation($id:ID!,$p:String!){markFileAsViewed(input:{pullRequestId:$id,path:$p}){clientMutationId}}' \
  -f id=<PR node id> -f p="<path>"
```

Loop over the trivial paths, using double quotes because paths may contain `$`. Echo each path that succeeds. If the viewer has already marked a file, marking it again does nothing.

## 4. Report

Keep the report short:
- **Marked (n)**: each path with a few words on why it is trivial.
- **Skim**: the paths grouped by kind, one line per group.
- **Review order**: core logic first (packages, then entities and state, then routes and UI), each with a one-line summary of what changed. Put a moved file next to its old path.

Ask before marking anything outside the trivial list, e.g. a lockfile.
