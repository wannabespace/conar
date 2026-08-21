# Documentation rules

> **When to read:** Before finishing any change that alters user-visible behavior, features, connection setup, public APIs, or terminology.
>
> Part of the Tamery rule set indexed in `AGENTS.md`. Keep this file accurate when you change what it describes.

When you change behavior users rely on, update docs in the same task — do not leave them stale.

**Update when:**

- New or changed features, UI flows, CLI commands, or MCP behavior
- Connection setup, drivers, security, or connection-string handling
- Public APIs, auth, billing, plans, or account settings
- Renamed or removed user-visible concepts (update terminology everywhere)
- New MDX pages: register them in `docs/docs.json`

**Skip when:**

- Internal refactors with no user-visible change
- Tests, tooling, CI, or dev-only scripts
- Typo fixes in code comments or private types

**Where docs live:**

| Area                        | Location         |
| --------------------------- | ---------------- |
| Product docs (Mintlify MDX) | `docs/**/*.mdx`  |
| Doc nav                     | `docs/docs.json` |
| Doc authoring style         | `docs/AGENTS.md` |
| Repo setup / contribution   | `README.md`      |

After implementing a change: search `docs/` for pages covering the affected area, update them, and wire any new pages into `docs/docs.json`. Follow `docs/AGENTS.md` for Mintlify style (MDX frontmatter, active voice, sentence-case headings). Do not create or expand docs for changes the user explicitly scoped as code-only, unless they ask for documentation.

