# Documentation rules

> **When to read:** Before finishing any change that alters user-visible behavior, features, connection setup, public APIs, or terminology.

Product docs are Mintlify MDX under `docs/` — `docs/docs.json` is the nav, `docs/AGENTS.md` the authoring style. Repo setup lives in `README.md`.

**Update in the same task** when a change touches: features, UI flows, CLI or MCP behavior, connection setup, drivers, security, connection-string handling, public APIs, auth, billing, plans, or account settings. Renamed or removed user-visible concepts get the terminology updated **everywhere**. Register new MDX pages in `docs/docs.json`.

**Skip** for internal refactors with no user-visible change, tests, tooling, CI, dev-only scripts, and typos in comments or private types. Don't create or expand docs for work the user scoped as code-only unless they ask.
