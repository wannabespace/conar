---
name: user-behavior-qa
description: Test the running app through its visible browser UI as a real user. Use when a developer asks for QA, a smoke test, user journey testing, to click through a feature or test it like a user, or wants a list of user-visible gaps without inspecting implementation code.
---

# User Behavior QA

Review the product from the user's side. Treat the browser as the product boundary: use visible controls, navigation, forms, feedback, and persisted results. Do not inspect source code, internal APIs, database clients, server logs, or implementation details unless the user explicitly expands the scope. The browser console is fair evidence (see §4).

## 1. Intake

Defaults, unless the developer says otherwise:

- **Target:** `https://app.local.tamery.app`, or the worktree's own dev URL when testing a branch (see `monorepo.md`).
- **Mutations:** create, edit and delete test data on local dev. Any other environment, or an unclear one, is read-only.
- **Browser:** the user's Chrome (`mcp__claude-in-chrome__*`), because the app is behind auth and the CLI browsers are signed out.

Only ask about what is still missing, in one message: the pages, workflows, entities, database engines (listed in `.agents/rules/dialects.md`) and roles in scope, and the expected behavior or baseline. If the invocation already covers these, do not ask. State the test charter in one sentence and start.

Before the first browser action, read:

- `.agents/rules/monorepo.md` → *Opening the running app in a browser*, including the user's-Chrome traps;
- `.agents/rules/domain.md` and the user docs for the area in scope. These give the product terms to use in the report and show which gaps are deliberate.

## 2. Operate like a user

- Stay inside the product UI. A built-in query editor or admin screen is allowed because it is part of the user experience.
- Use ordinary clicks, typing, keyboard navigation, and visible menus. Never call internal endpoints, inject application state, edit storage, or mutate the DOM to manufacture a result.
- Use browser evaluation only to read the rendered page or activate the same visible control when normal browser references fail.
- Use a recognizable test prefix such as `qa_<feature>_<purpose>` and record every artifact created.
- Do not enter credentials. If authentication is required, ask the developer to provide an authenticated browser session.
- Treat production or unclear environments as read-only until the developer explicitly allows mutations.
- Continue past isolated failures when another path remains testable. Do not repair the application during the review.

## 3. Exercise the scoped journey

Discover available surfaces from the UI itself. For every page or workflow in scope, test the applicable path end to end:

1. Open it through normal navigation and, when useful, its direct URL.
2. Check loading, empty, populated, and unsupported states that naturally occur.
3. Create a safe representative object or record. Cover meaningful subtypes when one form creates materially different objects.
4. Exercise required-field validation and one realistic database or server error that is safe to trigger, such as a duplicate name or a wrong type. Never run a destructive statement against shared cloud databases.
5. Verify success feedback, count, list row, displayed values, search, filters, and refresh persistence.
6. Open the created item and verify the detail or edit view reflects what was submitted.
7. Test visible lifecycle actions such as edit, enable or disable, revoke, and delete when offered.
8. Check labels, instructions, default values, disabled and loading states, focus, keyboard use, and accessible names while following the journey.

Use the smallest starter state that unlocks the workflow. If one created table or record supports several tests, reuse it.

A page is complete when every applicable step above has either been observed or recorded as untestable with the visible reason.

## 4. Evidence rules

- Report only what was observed through the UI. A browser console error seen during the journey can support a finding. Label it as console evidence and do not guess the cause from it.
- Before reporting that a control does not respond or an animation is stuck, rule out the user's-Chrome traps in `monorepo.md`: a hidden tab, or a dev-server reload.
- A gap that `domain.md` or the docs describe as deliberate is not a finding.
- Quote exact labels and errors when they identify the problem.
- Separate defects, missing capabilities, intentional unsupported states, and untested paths.
- Do not infer implementation causes.
- Do not label a database-native limitation as an application defect. State the visible limitation and its effect.
- Preserve useful test artifacts unless cleanup was requested. Always list the `qa_*` artifacts left behind, and name any that cannot be removed through the UI.
- Restore any UI preferences you changed, such as pane sizes, close the MCP tab, and ask the developer to reload their own tab.

## 5. Report

Return a concise report with:

### Tested

List the environment, role, pages, workflows, and objects created.

### Working

List completed user journeys without narrating every click.

### Missing or broken

For each finding include:

- page or workflow;
- short reproduction path;
- observed result;
- expected user-facing result or practical impact.

Order findings by how strongly they block the journey.

### Untested and cleanup

List blocked paths, their visible blockers, and any test artifacts left behind.
