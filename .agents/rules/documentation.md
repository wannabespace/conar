# Documentation rules

> **When to read:** Before finishing any change that alters user-visible behavior, features, connection setup, public APIs, or terminology.

Product docs = Mintlify MDX under `docs/` — `docs/docs.json` is the nav, `docs/AGENTS.md` the authoring style. Repo setup in `README.md`.

**Update in same task** when a change touches: features, UI flows, CLI or MCP behavior, connection setup, drivers, security, connection-string handling, public APIs, auth, billing, plans, account settings. Renamed/removed user-visible concepts → terminology updated **everywhere**. Register new MDX pages in `docs/docs.json`.

**Skip** for internal refactors with no user-visible change, tests, tooling, CI, dev-only scripts, typos in comments/private types. Don't create or expand docs for code-only-scoped work unless asked.
