# On-device model for pastes the parsers don't read

Status: idea, not started. Tracked in `IMPROVEMENTS.md` → Connection form.

## Problem

The create-connection page fills its form from whatever the user pastes or drops. `guessConnection` (`packages/connection/guess/index.ts`) runs deterministic detectors in order: CLI commands (`psql`, `mysql`, …), JSON/JSON5 configs, URLs and JDBC, ADO.NET strings, `key=value` strings, `.env` files, web URLs, a bare host, plus SSH commands and `~/.ssh/config` forwards. When none matches it returns `null`, the page shakes and says it couldn't read the paste.

That misses the long tail: a `docker-compose.yml` service, a Kubernetes Secret or ConfigMap, Terraform outputs, Rails `database.yml`, Django `DATABASES`, Spring `application.properties`, a paragraph from a wiki or a Slack message ("prod db is on 10.0.3.7, user app_ro, port 5433").

## Goal

When the parsers find nothing, a small model running on the device pulls out host, port, user, password, database and engine, and the form shows the result for confirmation exactly like a parsed paste.

## Constraints

- **Secrets never leave the device.** The pasted text almost always holds a password, and the app promises that credentials are never sent. No cloud model, ever, for this.
- **Works in the web app and the desktop app.** In the browser through WebGPU, falling back to WASM.
- **No invented values.** A model that rewrites one character of a password gives a silent auth failure the user can't explain. Values must be copied from the text, not generated.
- **Fallback only.** The parsers stay first: they are exact, instant and cover the common formats. The model runs only when `guessConnection` returns `null`.
- **Lazy.** Weights download only on the first paste that needs them, then come from the browser cache. Nothing loads on page open.

## Approaches

1. **Extractive entity model (recommended).** A GLiNER-style model takes labels ("host", "port", "user", "password", "database") and returns spans of the input text. It can't invent a value, only point at one, which fits credentials. Small enough for the browser via transformers.js or ONNX Runtime Web.
2. **Small generative model returning JSON** (WebLLM, a sub-1B instruct model). More flexible (it can infer the engine, normalise a Kubernetes base64 value), but heavier, slower, and able to hallucinate. If used, every returned value must be checked to appear verbatim in the input, and anything that doesn't is dropped.

## Integration sketch

- In `use-paste-connection.ts`, where `guessConnection(text)` returns `null`: show a "Reading…" state on the paste hero, run the model, and map spans to `GuessedParts` (`packages/connection/guess/types.ts`).
- Feed the result through the existing `fixParts`/`mergeParts` path so it gets the same fixes, footnote and focus behaviour as a parsed paste. Add a `GuessFormat` such as `'model'` so analytics and the footnote can tell it apart.
- If the model finds nothing either, keep today's shake and refusal.
- Track a PostHog event (format and which fields were found, never the values).

## Open questions

- Which model and size: download budget per first use, accuracy on credentials, licence for redistribution.
- Where the weights are hosted (Hugging Face CDN or our own), and pinning a version.
- Whether the desktop app should bundle the weights instead of downloading them.
- How to label engine type when the text only implies it (port numbers, provider host suffixes from `hosts.ts` may cover most of it without the model).
- Base64 values in Kubernetes Secrets: decode before the model sees the text, or skip.

## First step

A prototype outside the app: a corpus of 20 to 30 real pastes (the formats under Problem), run through `guessConnection` and the candidate model, recording per field whether it was found, missed or wrong, plus load time and inference time in Chrome and Safari. Decide from those numbers.
