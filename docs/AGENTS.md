# Documentation project instructions

## About this project

- Docs site on [Mintlify](https://mintlify.com); pages = MDX with YAML frontmatter; config in `docs.json`
- Mintlify MCP server `https://mcp.mintlify.com` edits content/settings; docs MCP server `https://www.mintlify.com/docs/mcp` answers Mintlify usage questions

## Terminology

Follow domain terms in `.agents/rules/domain.md` (Connection, Workspace, Tab, Navigator — with their avoid-words).

## Style preferences

- Write in English for someone using Tamery, with the shortest explanation that lets them finish the task.
- Start with what the feature does and how to open it. Use numbered steps for setup and tables for choices.
- Describe shipped behavior verified in code. Keep implementation details and future features out of product docs.
- Give each topic one home and link to it instead of repeating it. Keep warnings beside the action they affect.
- Active voice, second person ("you")
- Concise sentences — one idea each
- Sentence case headings
- Bold for UI elements: Click **Settings**
- Code formatting for file names, commands, paths, code references
