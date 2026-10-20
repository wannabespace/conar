# Documentation project instructions

## About this project

- Docs site is `apps/docs` (Fumadocs). Pages = MDX with YAML frontmatter in this folder; nav in `docs.json`

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
- Link to other pages as cards with `<Cards>` around `<Card href="/path" />`; the title and description come from that page's frontmatter
