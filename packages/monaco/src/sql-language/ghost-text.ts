import { AI_SQL_LIMITS } from '@tamery/ai/limits'
import { noop, sleep, tryCatchAsync } from '@tamery/shared/utils'
import type { DialectSpec, GhostTextOffer, Statement } from '@tamery/sql'
import {
  needsLeadingSpace,
  splitStatements,
  statementAt,
  tokenize,
  typedAlong,
  withinStatement,
} from '@tamery/sql'
import type { editor, Position } from 'monaco-editor'
import { KeyCode, languages, Range } from 'monaco-editor'

import type { SqlSource } from './source'
import { boundSources, catalogSummaryFor } from './source'

const GHOST_TEXT_DELAY = 150

/** Escape pressed over ghost text: no new ghost text until the user types again. */
const ghostTextSuppressed = new WeakSet<editor.ITextModel>()

/** The text version last sent to the AI while a list row was highlighted. */
const askedWithList = new WeakMap<editor.ITextModel, number>()

const ghostTextOff = (model: editor.ITextModel, source: SqlSource) =>
  ghostTextSuppressed.has(model) || !source.ghostTextEnabled()

const continuesStatement = (statement: Statement | undefined, offset: number) =>
  statement !== undefined &&
  statement.tokens.length > 0 &&
  !(
    offset >= statement.terminatorEnd && statement.terminatorEnd > statement.end
  )

/**
 * The ghost text last offered, valid only for the text it was made for: Tab takes it over the list's
 * row while both show, Escape over it stops suggesting. Every request clears it first, so a stale
 * entry never claims ghost text that a newer request dropped.
 */
const offeredGhostText = new WeakMap<
  editor.ITextModel,
  { text: string; versionId: number }
>()

/** Typing along with the last ghost text keeps it on screen without a new request. */
const lastGhostText = new WeakMap<editor.ITextModel, GhostTextOffer>()

/**
 * Monaco's default range swallows the rest of the line (an auto-closed quote, a `;`) and drops a
 * suggestion that does not end with it. A suggestion that repeats the rest is cut back to the new
 * text, so accepting it leaves the caret right after what was inserted, not at the line's end.
 */
const ghostItem = (
  model: editor.ITextModel,
  position: Position,
  insertText: string
) => {
  const restOfLine = model
    .getLineContent(position.lineNumber)
    .slice(position.column - 1)
  const repeatsRest = restOfLine !== '' && insertText.endsWith(restOfLine)
  return {
    insertText: repeatsRest
      ? insertText.slice(0, insertText.length - restOfLine.length)
      : insertText,
    range: Range.fromPositions(position),
  }
}

const typedAlongItem = (model: editor.ITextModel, position: Position) => {
  const last = lastGhostText.get(model)
  const remembered =
    last && typedAlong(last, model.getValue(), model.getOffsetAt(position))
  if (!remembered) {
    return
  }
  offeredGhostText.set(model, {
    text: remembered,
    versionId: model.getVersionId(),
  })
  return ghostItem(model, position, remembered)
}

const neighbourhood = (
  statements: Statement[],
  statement: Statement | undefined,
  length: number
) => {
  const index = statement ? statements.indexOf(statement) : -1
  if (index === -1) {
    return { end: length, start: 0 }
  }
  return {
    end: statements[index + 1]?.terminatorEnd ?? length,
    start: statements[index - 1]?.start ?? 0,
  }
}

/** Monaco's classes for drawn ghost text; `-preview` is the variant drawn while the suggestion list is open. */
export const GHOST_TEXT_SELECTOR =
  '.ghost-text-decoration, .ghost-text-decoration-preview, .ghost-text'

/** Our ghost text is the one on screen, not the list's row preview. */
const ghostTextLive = (
  codeEditor: editor.IStandaloneCodeEditor,
  model: editor.ITextModel
) =>
  offeredGhostText.get(model)?.versionId === model.getVersionId() &&
  Boolean(codeEditor.getDomNode()?.querySelector(GHOST_TEXT_SELECTOR))

/**
 * Ghost text shown beside the open list is not the highlighted row, so Tab takes the ghost text:
 * Monaco alone would insert the row. Runs before Monaco's own Tab binding.
 */
const acceptGhostTextOverList = (codeEditor: editor.IStandaloneCodeEditor) => {
  const model = codeEditor.getModel()
  const position = codeEditor.getPosition()
  const preview = model && offeredGhostText.get(model)
  // Any open list counts: one opened by a trigger character has no highlighted row, and Tab would indent.
  const shown = codeEditor
    .getDomNode()
    ?.querySelector('.suggest-widget.visible')
  if (
    !model ||
    !position ||
    !preview ||
    !shown ||
    !ghostTextLive(codeEditor, model)
  ) {
    return false
  }
  codeEditor.trigger('runner', 'hideSuggestWidget', null)
  const item = ghostItem(model, position, preview.text)
  codeEditor.executeEdits('ai-ghost-text', [
    { forceMoveMarkers: true, range: item.range, text: item.insertText },
  ])
  codeEditor.pushUndoStop()
  return true
}

export const attachGhostTextEscape = (
  codeEditor: editor.IStandaloneCodeEditor
) => {
  const keyListener = codeEditor.onKeyDown((event) => {
    const model = codeEditor.getModel()
    // Escape over a shown suggestion means "stop suggesting" — Monaco would otherwise ask again the
    // moment the list closes. With only the list open, Escape closes the list and the request goes on.
    if (
      event.keyCode === KeyCode.Escape &&
      model &&
      ghostTextLive(codeEditor, model)
    ) {
      ghostTextSuppressed.add(model)
    }
    if (event.keyCode === KeyCode.Tab && acceptGhostTextOverList(codeEditor)) {
      event.preventDefault()
      event.stopPropagation()
    }
  })
  const contentListener = codeEditor.onDidChangeModelContent(() => {
    const model = codeEditor.getModel()
    if (model) {
      ghostTextSuppressed.delete(model)
    }
  })
  return () => {
    keyListener.dispose()
    contentListener.dispose()
  }
}

// A reply that is a sentence ("There's nothing to add.") explained instead of completing.
// `?` stays out: it is Postgres's jsonb key-exists operator.
const PROSE = /[.!:…]\s|[.!:…]$/u

export const registerGhostText = (id: string, dialect: DialectSpec) =>
  languages.registerInlineCompletionsProvider(id, {
    disposeInlineCompletions: noop,
    provideInlineCompletions: async (model, position, context, token) => {
      const source = boundSources.get(model)
      offeredGhostText.delete(model)
      if (!source || ghostTextOff(model, source)) {
        return { items: [] }
      }
      const remembered = typedAlongItem(model, position)
      if (remembered) {
        return { items: [remembered] }
      }
      // Monaco asks again on every move through the list, with the text unchanged: an answer comes back
      // through `typedAlongItem` above, and a version already asked about is not sent to the AI again.
      if (context.selectedSuggestionInfo) {
        if (askedWithList.get(model) === model.getVersionId()) {
          return { items: [] }
        }
        askedWithList.set(model, model.getVersionId())
      }
      const text = model.getValue()
      const offset = model.getOffsetAt(position)
      const statements = splitStatements(text, dialect)
      const statement = statementAt(statements, offset, text)
      // The model sees the statement being written and one on each side for style, not the whole tab.
      const window = neighbourhood(statements, statement, text.length)
      // Codestral reads an auto-closed `''` as a finished value and writes past it.
      if (
        !continuesStatement(statement, offset) ||
        tokenize(text.slice(0, offset), dialect).state.kind === 'string'
      ) {
        return { items: [] }
      }
      await sleep(GHOST_TEXT_DELAY)
      if (token.isCancellationRequested) {
        return { items: [] }
      }
      const explicit =
        context.triggerKind === languages.InlineCompletionTriggerKind.Explicit
      const before = text.slice(window.start, offset)
      // An explicit ask treats the word before the caret as finished (see `needsLeadingSpace`); without the
      // space Codestral reads `from accounts` as a whole statement and only closes it with `;`.
      const prefix = (
        explicit && /\w$/u.test(before) ? `${before} ` : before
      ).slice(-AI_SQL_LIMITS.sql)
      const suffix = text.slice(
        offset,
        Math.min(window.end, offset + AI_SQL_LIMITS.sql)
      )
      const schema = await catalogSummaryFor(source, prefix + suffix)
      if (token.isCancellationRequested) {
        return { items: [] }
      }
      const controller = new AbortController()
      token.onCancellationRequested(() => controller.abort())
      // A keystroke cancels the request mid-flight; that is not an error to surface.
      const { data: reply } = await tryCatchAsync(() =>
        source.complete({ context: schema, prefix, suffix }, controller.signal)
      )
      if (!reply?.trim() || PROSE.test(reply.trim())) {
        return { items: [] }
      }
      const suggestion = withinStatement(text.slice(0, offset), reply, dialect)
      const insertText = needsLeadingSpace(
        text.slice(0, offset),
        suggestion,
        explicit,
        dialect
      )
        ? ` ${suggestion}`
        : suggestion
      offeredGhostText.set(model, {
        text: insertText,
        versionId: model.getVersionId(),
      })
      lastGhostText.set(model, {
        after: text.slice(offset),
        before: text.slice(0, offset),
        text: insertText,
      })
      return { items: [ghostItem(model, position, insertText)] }
    },
  })
