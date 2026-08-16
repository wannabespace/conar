# Pricing model

Internal doc: how Tamery's pricing works and how to decide where a new feature lands. Not user-facing.

## Core principle

**No feature is a Pro feature. Scale is Pro.**

Every user sees the whole product. Free users hit quantity limits when they use it seriously; Pro removes the limits. We gate by _how much_ someone uses Tamery, not by _what_ they are allowed to touch.

Why this model (and not feature gating):

- Limits self-segment. A hobbyist with one database stays under the limits forever and spreads word of mouth. A professional with ten work databases hits the wall within a week and pays.
- Free users experience AI, sync, and workspaces before paying — conversion beats a paywall that hides the value.
- "Is this feature Free or Pro?" stops being a judgment call. New features ship to everyone; the only question is which existing limit they fall under.

## Tiers

| Metric | Free | Pro |
| --- | --- | --- |
| Connections | 3 | Unlimited |
| Workspaces | 1 (personal, auto-created) | Unlimited |
| AI requests | Limited per month, or unlimited with BYOK | Unlimited |
| Cloud sync | Included (within connection limit) | Included |
| Chats & query history | Limited retention | Unlimited |

Exact numbers are product decisions and may change; the structure should not.

BYOK (bring your own API key) keeps AI usable on Free at zero token cost to us. It also serves privacy-sensitive users who don't want their queries going through our provider account.

## Decision framework for new features

Run every new feature through these questions, in order. The first match wins.

### 1. Does it have a natural quantity?

Connections, workspaces, AI requests, saved queries, history retention, sync targets.

→ **Ship to everyone. Attach it to an existing limit, or define a new limit** (generous enough that casual use never hits it). Never invent a boolean gate for something countable.

### 2. Does it create recurring marginal cost per use?

AI tokens, storage, compute we pay for per request.

→ **Ship to everyone with a Free usage cap; Pro raises or removes the cap.** If the cost is user-transferable (AI), offer BYOK on Free.

### 3. Is it collaboration between people?

Members, invitations, shared workspaces, roles, audit.

→ **Team tier** (future). Per-seat pricing. Multi-player is the one category that is genuinely a different product promise, not a bigger quota.

### 4. None of the above — a pure capability?

New database driver, editor improvement, keyboard shortcuts, UI polish, export formats, local-only functionality.

→ **Free, for everyone, always.** Capabilities grow the funnel; limits monetize it. Gating a capability restarts the "randomly picking Pro features" problem this document exists to prevent.

### Litmus tests

Before shipping a gate, check:

- **Explainability**: can a user guess _why_ this is limited without reading docs? "3 connections free" explains itself; "table filters are Pro" does not.
- **Symmetry**: would we be embarrassed if a competitor's changelog said "we made X free"? If yes, X should be free here too.
- **No hostage features**: never gate something that makes the free product feel broken (e.g. viewing data, running queries, editing rows). Free must be a complete tool at small scale.

## What stays free forever

Commitments we don't walk back — churning these breaks trust:

- Working with a local connection end to end: connect, browse, query, edit.
- `SyncType: Local` — data never leaving the device is a right, not a plan feature.
- Anything already shipped as free. Limits may apply to _new_ accounts, but features don't move behind the paywall retroactively.

## Current enforcement map (as of 2026-08)

What the code actually gates today, per router middleware:

| Surface | Gating today | Target per framework |
| --- | --- | --- |
| `ai/chat`, `ai/enhance-prompt`, `ai/fix-sql`, `ai/update-sql` | Hard-gated (`subscriptionMiddleware`) | Metered free cap + Pro unlimited (question 2) |
| `ai/filters` | Metered: `optionalSubscriptionMiddleware` + Redis monthly counter, `FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT = 50` | Already correct — this is the reference implementation |
| `ai/generate-title` | Free (`authMiddleware`) | Free — negligible cost, part of chat UX |
| `chats/*`, `chats-messages/*` (create/update/remove) | Hard-gated (`subscriptionMiddleware`) | Follows AI chat: metered with it, not gated separately |
| `connections/*`, `connections-resources/*`, `queries/*` | Free (`authMiddleware`) | Free CRUD; connection _count_ limit when tiers go live |
| Workspace creation | Subscription-gated (`allowUserToCreateOrganization`, `apps/api/lib/auth.ts`) | Correct — quantity gate (1 free personal workspace) |
| Sync/events streams | Free (auth) | Free — sync is a property of the data, limits live on the data itself |

Known mismatch: AI chat is a hard paywall today but the framework says metered. Migrating it to the `ai/filters` pattern is the intended direction.

## Recommended reworks

Places where the current setup contradicts the framework, in priority order. Each one names the violated principle so the fix isn't a matter of taste.

### 1. Replace the AI hard paywall with one pooled monthly quota

**Today:** `ai/chat`, `ai/enhance-prompt`, `ai/fix-sql`, `ai/update-sql` are hard-gated; `ai/filters` has its own separate 50/month counter.

**Problems:** the hard gate hides the product's best conversion surface from free users (violates "free users experience the value before paying"), and per-feature counters produce a plan nobody can describe — "50 filters but zero chats" is not explainable.

**Proposed:** one pooled quota — `FREE_AI_USAGE_MONTHLY_LIMIT`, Redis key `ai:usage:{userId}:{yyyy-MM}` — shared by every AI endpoint. All AI routers move to `optionalSubscriptionMiddleware` and increment the same counter; subscription skips it. The user-facing story becomes one sentence: "N AI requests per month free, unlimited on Pro." Retire `FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT` in favor of the pooled constant.

### 2. Stop gating chat persistence — gate only generation

**Today:** `chats/*` and `chats-messages/*` mutations require a subscription.

**Problems:** storing a few rows of chat history costs nothing (fails question 2), and a lapsed subscriber loses the ability to edit or delete their own chat history (violates "downgrade must never lock users out of their data" and the hostage-feature test).

**Proposed:** drop `subscriptionMiddleware` from all chats/chats-messages mutations down to `authMiddleware`. The expensive step — the model call in `ai/chat` — is already the enforcement point once rework 1 lands. History retention limits, if ever needed, are a quantity limit per the framework, not a mutation gate.

### 3. Implement the connection limit before tiers launch

**Today:** connections are unlimited for everyone, which means the model's primary quantity lever doesn't exist yet — the only real gates are AI and workspaces.

**Proposed:** enforce `FREE_CONNECTIONS_LIMIT` (3) in `connections/create` per implementation rule 6: count server-side, block only new creates, existing over-limit connections stay fully usable. Ship the UI mirror (counter + upgrade prompt near the create button) in the same release — a silent server rejection here would feel like a bug, not a plan.

### 4. Add BYOK as the free-tier AI escape hatch

**Today:** no BYOK path; AI cost is always ours, which is what forced AI behind a paywall in the first place.

**Proposed:** let a user store their own provider API key (per-user secret in Infisical, same `['users', userId]` path as encryption secrets). When a key is present, AI endpoints route to it and skip the quota entirely. This makes the free tier's AI story honest ("limited on our key, unlimited on yours"), serves privacy-sensitive users, and removes token cost as an argument for hard gates. `packages/ai` provider env helpers are the natural seam.

### 5. Standardize every limit error on the `{ max, remaining, resetAt }` shape

**Today:** `ai/filters` returns typed FORBIDDEN data; the hard-gated AI routers return a bare message string.

**Proposed:** once reworks 1–3 land, every limit rejection in the API uses the typed shape from implementation rule 3, and clients get one shared upgrade-prompt component that renders any of them. One error contract, one UI, no per-feature paywall screens.

### 6. Leave workspace gating as is — but re-anchor it when Team ships

The current gate (`allowUserToCreateOrganization` requires a subscription) is framework-correct: 1 free personal workspace is a quantity limit. When members/invitations ship, resist moving _collaboration_ under Pro — per the framework (question 3) multi-player belongs to a per-seat Team tier, and Pro stays a single-player scale upgrade. Deciding this now avoids re-gating workspaces twice.

## Implementation rules

How to wire a gate once the framework has decided where a feature lands:

1. **Gate at the API boundary, never only in the client.** The desktop app, web app, and CLI all speak to the same oRPC routers; a client-side check is a suggestion, not a limit. UI may _mirror_ the limit (disable buttons, show upgrade prompts) but the router enforces it.
2. **Metered features copy the `ai/filters` pattern** (`apps/api/orpc/routers/ai/filters.ts`): `optionalSubscriptionMiddleware`, Redis counter keyed `ai:usage:{userId}:{feature}:{yyyy-MM}` with expiry at end of month, skip the counter when `context.subscription` exists.
3. **Limit errors carry the numbers.** Follow the `ai/filters` FORBIDDEN error shape — `{ max, remaining, resetAt }` in `errors({...})` typed data — so every client can render "37 of 50 left, resets March 1" instead of a bare rejection. Never return a plain string error for a limit.
4. **Limit constants live in `packages/shared/constants.ts`**, named `FREE_<FEATURE>_..._LIMIT` (see `FREE_AI_FILTERS_USAGE_MONTHLY_LIMIT`). Shared package so clients render the same numbers the server enforces — no hardcoded copies in UI code.
5. **Boolean subscription gates use `subscriptionMiddleware`; metered ones use `optionalSubscriptionMiddleware`.** Reserve the hard middleware for things that are structurally Pro/Team (extra workspaces, future member management), not for capping usage.
6. **Quantity limits (connections, workspaces) are enforced on create**, counting server-side rows — never trust a client-reported count. Existing over-limit data stays readable when a subscription lapses; the limit blocks _new_ creates only. Downgrade must never lock users out of their data.
7. **Grandfathering by app version already has a pattern**: `subscriptionMiddleware` branches its message on `LATEST_VERSION_BEFORE_SUBSCRIPTION`. When a previously free surface gains a gate, keep the version-aware messaging so old clients get an actionable error.

## Surface-specific rules

- **CLI (`apps/cli`) and desktop (`apps/desktop`) are distribution channels, not tiers.** Never gate "CLI access" or "desktop app" — they call the same routers and inherit the same limits. A Pro-only client would just push users to the ungated one.
- **Proxy (`apps/proxy`) query execution stays free.** Running queries against the user's own database is core capability (question 4); the user's database does the work, not our infra.
- **Table browsing, query editor, definitions, visualizer** (`apps/app/src/routes/_protected/connection/$resourceId/*`) — capabilities, free. New pages under a connection default to free unless they call a metered AI endpoint, in which case the endpoint's meter is the gate, not the page.
- **Sync is never its own toggle.** `SyncType` is the user's privacy choice, not a plan feature. Cloud sync applies to whatever the user's limits allow them to have; you gate the _number of connections_, not their syncability.
- **Secrets resolution (`connections/resolve`, Infisical) follows the connection.** If the user may have the connection, they may resolve its string on any device — gating resolve separately would hold synced credentials hostage (violates the hostage-feature test).
- **AI title generation and similar micro-LLM calls stay free** while per-call cost is negligible; promote to metered only if a cost report shows otherwise, and then via rule 2, not a hard gate.

## Explicitly rejected models

- **Feature gating** (random features marked Pro) — no principle, every new feature reopens the debate, free product feels arbitrarily crippled.
- **Paid-only with trial** — kills word of mouth against free competitors (DBeaver, Beekeeper); our infra cost doesn't require it.
- **One-time license** (TablePlus model) — viable given near-zero infra cost, but weaker long-term revenue and awkward with recurring AI cost. Revisit only if the audience demands it; BYOK or AI credits would cover the token side.
