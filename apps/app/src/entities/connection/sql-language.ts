import { AI_SQL_LIMITS } from '@tamery/shared/constants'
import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { noop, silently, sleep, tryCatchAsync } from '@tamery/shared/utils'
import type {
  CompletionKind,
  SqlCatalog,
  Statement,
  TokenizerState,
} from '@tamery/sql'
import {
  catalogSummary,
  completionContext,
  completionItems,
  diagnose,
  dialects,
  findTable,
  locateTable,
  needsLeadingSpace,
  withinStatement,
  INITIAL_STATE,
  splitStatements,
  statementAt,
  statementScope,
  tokenize,
} from '@tamery/sql'
import type { IDisposable, IRange, Position } from 'monaco-editor'
import {
  editor,
  KeyCode,
  languages,
  MarkerSeverity,
  Range,
} from 'monaco-editor'

import type { ConnectionResource } from '~/entities/connection/core/sync'
import { resourceEnumsQueryOptions } from '~/entities/connection/queries/enums/list'
import { resourceTableColumnsQueryOptions } from '~/entities/connection/queries/tables/columns'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { isActiveSubscription } from '~/entities/user/hooks/use-subscription'
import { orpc } from '~/lib/orpc'
import { queryClient, subscriptionQueryClient } from '~/lib/query-client'
import { appStore } from '~/store'

import { defaultSchemaOf } from './capabilities'

export const sqlLanguageIds = {
  [ConnectionType.ClickHouse]: 'sql-clickhouse',
  [ConnectionType.MSSQL]: 'sql-mssql',
  [ConnectionType.MySQL]: 'sql-mysql',
  [ConnectionType.Postgres]: 'sql-postgres',
} satisfies Record<ConnectionType, string>

// Theme rule names in components/monaco.tsx.
const SCOPES = {
  comment: 'comment',
  function: 'predefined',
  identifier: 'identifier',
  keyword: 'keyword',
  number: 'number',
  operator: 'operator',
  punctuation: 'delimiter',
  string: 'string',
  type: 'type',
  variable: 'variable',
} as const

class LineState implements languages.IState {
  readonly state: TokenizerState

  constructor(state: TokenizerState) {
    this.state = state
  }

  clone() {
    return new LineState(this.state)
  }

  equals(other: languages.IState) {
    return (
      other instanceof LineState &&
      JSON.stringify(other.state) === JSON.stringify(this.state)
    )
  }
}

const COMPLETION_KINDS: Record<CompletionKind, languages.CompletionItemKind> = {
  column: languages.CompletionItemKind.Field,
  enum: languages.CompletionItemKind.EnumMember,
  function: languages.CompletionItemKind.Function,
  keyword: languages.CompletionItemKind.Keyword,
  operator: languages.CompletionItemKind.Operator,
  schema: languages.CompletionItemKind.Module,
  table: languages.CompletionItemKind.Class,
  value: languages.CompletionItemKind.Value,
  view: languages.CompletionItemKind.Interface,
}

/** Unbound models get keywords only. */
const boundResources = new WeakMap<editor.ITextModel, ConnectionResource>()

export const bindSqlModel = (
  model: editor.ITextModel,
  connectionResource: ConnectionResource
) => {
  boundResources.set(model, connectionResource)
  queryClient.prefetchQuery(resourceEnumsQueryOptions({ connectionResource }))
  queryClient.prefetchQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )
}

const EMPTY_CATALOG: SqlCatalog = {
  defaultSchema: null,
  enums: [],
  schemas: [],
}

/** The catalog as far as the query cache knows it — columns stay `null` until a table's columns were fetched. */
export const sqlCatalogOf = (
  connectionResource: ConnectionResource,
  connectionType: ConnectionType
): SqlCatalog => {
  const tables = queryClient.getQueryData(
    resourceTablesAndSchemasQueryOptions({ connectionResource }).queryKey
  )
  const enums = queryClient.getQueryData(
    resourceEnumsQueryOptions({ connectionResource }).queryKey
  )
  if (!tables) {
    return EMPTY_CATALOG
  }
  return {
    defaultSchema: defaultSchemaOf(connectionType, connectionResource.name),
    enums: (enums ?? []).map(({ metadata, name, values }) => ({
      column: metadata?.column,
      name,
      table: metadata?.table,
      values,
    })),
    schemas: tables.schemas.map((schema) => ({
      name: schema.name,
      tables: schema.tables.map((table) => ({
        columns:
          queryClient
            .getQueryData(
              resourceTableColumnsQueryOptions({
                connectionResource,
                schema: schema.name,
                table: table.name,
              }).queryKey
            )
            ?.map((column) => ({
              name: column.id,
              nullable: column.isNullable,
              // Postgres reports enum columns as `USER-DEFINED`; the label names the enum.
              type: column.typeLabel,
            })) ?? null,
        kind: table.type,
        name: table.name,
      })),
    })),
  }
}

const loadColumns = (
  connectionResource: ConnectionResource,
  catalog: SqlCatalog,
  refs: { name: string; schema: string | null }[]
) =>
  Promise.all(
    refs.flatMap((ref) => {
      // Schema and table from one lookup, so the columns fetched are the table suggestions resolve to.
      const found = locateTable(catalog, ref.name, ref.schema)
      return found?.table.columns === null
        ? [
            queryClient.ensureQueryData(
              resourceTableColumnsQueryOptions({
                connectionResource,
                schema: found.schema,
                table: found.table.name,
              })
            ),
          ]
        : []
    })
  )

const rangeOf = (
  model: editor.ITextModel,
  start: number,
  end: number
): IRange => {
  const from = model.getPositionAt(start)
  const to = model.getPositionAt(end)
  return {
    endColumn: to.column,
    endLineNumber: to.lineNumber,
    startColumn: from.column,
    startLineNumber: from.lineNumber,
  }
}

const hasSubscription = () =>
  subscriptionQueryClient
    .getQueryData(orpc.account.subscription.list.queryOptions().queryKey)
    ?.some(isActiveSubscription) ?? false

const GHOST_TEXT_DELAY = 150

/** Escape pressed over ghost text: no new ghost text until the user types again. */
const ghostTextSuppressed = new WeakSet<editor.ITextModel>()

const ghostTextOff = (model: editor.ITextModel) =>
  ghostTextSuppressed.has(model) ||
  !appStore.get().isOnline ||
  !hasSubscription()

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
const lastGhostText = new WeakMap<
  editor.ITextModel,
  { before: string; after: string; text: string }
>()

const rememberedGhostText = (
  model: editor.ITextModel,
  typed: string,
  offset: number
) => {
  const last = lastGhostText.get(model)
  const before = typed.slice(0, offset)
  const after = typed.slice(offset)
  if (!last || !before.startsWith(last.before) || !after.endsWith(last.after)) {
    return
  }
  const typedAlong = before.slice(last.before.length)
  // Typing a quote or bracket auto-closes it after the caret; the suggestion already holds the closer.
  const autoClosed = after.slice(0, after.length - last.after.length)
  const rest = last.text.slice(typedAlong.length)
  return last.text.startsWith(typedAlong) &&
    rest.endsWith(autoClosed) &&
    rest.length > autoClosed.length
    ? rest.slice(0, rest.length - autoClosed.length)
    : undefined
}

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
  const remembered = rememberedGhostText(
    model,
    model.getValue(),
    model.getOffsetAt(position)
  )
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

const ASK_GHOST_TEXT = {
  id: 'editor.action.inlineSuggest.trigger',
  title: 'Suggest',
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
  const shown = codeEditor
    .getDomNode()
    ?.querySelector('.suggest-widget.visible .monaco-list-row.focused')
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

const tablesIn = (text: string, connectionType: ConnectionType) =>
  splitStatements(text, dialects[connectionType]).flatMap(
    (statement) => statementScope(statement.tokens).tables
  )

export const catalogSummaryFor = async (
  connectionResource: ConnectionResource,
  connectionType: ConnectionType,
  sql: string
) => {
  await silently(() =>
    loadColumns(
      connectionResource,
      sqlCatalogOf(connectionResource, connectionType),
      tablesIn(sql, connectionType)
    )
  )
  return catalogSummary(sqlCatalogOf(connectionResource, connectionType))
}

const registerSqlLanguage = (connectionType: ConnectionType) => {
  const id = sqlLanguageIds[connectionType]
  const dialect = dialects[connectionType]

  languages.register({ id })

  const configuration = languages.setLanguageConfiguration(id, {
    autoClosingPairs: [
      { close: ')', open: '(' },
      { close: ']', open: '[' },
      { close: "'", notIn: ['string', 'comment'], open: "'" },
      { close: '"', notIn: ['string', 'comment'], open: '"' },
      { close: '`', notIn: ['string', 'comment'], open: '`' },
    ],
    brackets: [
      ['(', ')'],
      ['[', ']'],
    ],
    comments: { blockComment: ['/*', '*/'], lineComment: '--' },
    surroundingPairs: [
      { close: ')', open: '(' },
      { close: "'", open: "'" },
      { close: '"', open: '"' },
    ],
  })

  const tokensProvider = languages.setTokensProvider(id, {
    getInitialState: () => new LineState(INITIAL_STATE),
    tokenize: (line, lineState) => {
      const { state, tokens } = tokenize(
        line,
        dialect,
        lineState instanceof LineState ? lineState.state : INITIAL_STATE
      )
      return {
        endState: new LineState(state),
        tokens: tokens.map((token) => ({
          scopes: SCOPES[token.kind],
          startIndex: token.start,
        })),
      }
    },
  })

  const completion = languages.registerCompletionItemProvider(id, {
    provideCompletionItems: (model, position, trigger) => {
      const text = model.getValue()
      const offset = model.getOffsetAt(position)
      const context = completionContext(text, offset, dialect)
      // A space or paren opens the list only where something specific is expected
      // (`FROM `, `WHERE `, `IN (`), not after every word.
      const openedByGap =
        trigger.triggerCharacter === ' ' || trigger.triggerCharacter === '('
      if (openedByGap && context.expects === 'any') {
        return { suggestions: [] }
      }
      const connectionResource = boundResources.get(model)
      let catalog = EMPTY_CATALOG
      let missingColumns = false
      if (connectionResource) {
        catalog = sqlCatalogOf(connectionResource, connectionType)
        // Never wait on the network: answer from the cache, start loading what a column
        // position needs, and mark the list incomplete so the next keystroke asks again.
        const [first, second] = context.qualifier
        const refs = [
          ...context.scope.tables,
          ...(first === undefined
            ? []
            : [
                second === undefined
                  ? { name: first, schema: null }
                  : { name: second, schema: first },
              ]),
        ]
        missingColumns =
          (context.expects === 'column' || first !== undefined) &&
          refs.some(
            (ref) => findTable(catalog, ref.name, ref.schema)?.columns === null
          )
        if (missingColumns) {
          void silently(() => loadColumns(connectionResource, catalog, refs))
        }
      }
      const items = completionItems(context, catalog, dialect)
      // In a value slot (`col = `, `IN (`) the gap opens the list only for the values the column
      // takes; a bare list of columns there reads as the value to type.
      if (
        openedByGap &&
        context.expects === 'column' &&
        context.subject &&
        !items.some((item) => item.kind === 'enum' || item.kind === 'value')
      ) {
        return { incomplete: missingColumns, suggestions: [] }
      }
      const range = rangeOf(model, context.replaceStart, context.replaceEnd)
      return {
        incomplete: missingColumns,
        suggestions: items.map((item) => ({
          // Accepting a pick is a good moment for ghost text to continue the statement.
          command: ASK_GHOST_TEXT,
          detail: item.detail,
          insertText: item.insertText,
          insertTextRules: item.snippet
            ? languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          kind: COMPLETION_KINDS[item.kind],
          label: item.label,
          range,
          sortText: item.sortText,
        })),
      }
    },
    triggerCharacters: ['.', ' ', '('],
  })

  const ghostText = languages.registerInlineCompletionsProvider(id, {
    disposeInlineCompletions: noop,
    provideInlineCompletions: async (model, position, context, token) => {
      const connectionResource = boundResources.get(model)
      offeredGhostText.delete(model)
      if (!connectionResource || ghostTextOff(model)) {
        return { items: [] }
      }
      const typedAlong = typedAlongItem(model, position)
      if (typedAlong) {
        return { items: [typedAlong] }
      }
      // Monaco asks again on every move through the list and shows only ghost text that extends the
      // highlighted row; ghost text already on screen stays through `showOnSuggestConflict` instead.
      if (context.selectedSuggestionInfo) {
        return { items: [] }
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
      const schema = await catalogSummaryFor(
        connectionResource,
        connectionType,
        prefix + suffix
      )
      if (token.isCancellationRequested) {
        return { items: [] }
      }
      const controller = new AbortController()
      token.onCancellationRequested(() => controller.abort())
      // A keystroke cancels the request mid-flight; that is not an error to surface.
      const { data: reply } = await tryCatchAsync(() =>
        orpc.ai.completeSQL.call(
          { context: schema, prefix, suffix, type: connectionType },
          { context: { silent: true }, signal: controller.signal }
        )
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

  return [configuration, tokensProvider, completion, ghostText]
}

declare global {
  // Monaco is a singleton the whole page shares; the providers registered by an earlier evaluation of
  // this module (a hot reload) must go, or every suggestion shows once per evaluation.
  var tamerySqlLanguage: IDisposable[] | undefined
}

for (const disposable of globalThis.tamerySqlLanguage ?? []) {
  disposable.dispose()
}
globalThis.tamerySqlLanguage =
  Object.values(ConnectionType).flatMap(registerSqlLanguage)

const DIAGNOSTICS_DELAY = 250
const MARKER_OWNER = 'tamery-sql'

const MARKER_SEVERITIES = {
  error: MarkerSeverity.Error,
  warning: MarkerSeverity.Warning,
}

export const attachSqlDiagnostics = (
  codeEditor: editor.IStandaloneCodeEditor,
  connectionResource: ConnectionResource,
  connectionType: ConnectionType
) => {
  const dialect = dialects[connectionType]
  let timer: ReturnType<typeof setTimeout> | undefined

  const run = () => {
    const model = codeEditor.getModel()
    if (!model) {
      return
    }
    const text = model.getValue()
    const catalog = sqlCatalogOf(connectionResource, connectionType)
    silently(() =>
      loadColumns(connectionResource, catalog, tablesIn(text, connectionType))
    )
    const markers = diagnose(text, dialect, catalog).map((diagnostic) => ({
      ...rangeOf(model, diagnostic.start, diagnostic.end),
      message: diagnostic.message,
      severity: MARKER_SEVERITIES[diagnostic.severity],
    }))
    editor.setModelMarkers(model, MARKER_OWNER, markers)
  }

  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(run, DIAGNOSTICS_DELAY)
  }

  schedule()
  const contentListener = codeEditor.onDidChangeModelContent(schedule)
  const unsubscribeCache = queryClient.getQueryCache().subscribe((event) => {
    if (
      event.type === 'updated' &&
      event.query.queryKey[1] === connectionResource.id
    ) {
      schedule()
    }
  })

  return () => {
    clearTimeout(timer)
    contentListener.dispose()
    unsubscribeCache()
    const model = codeEditor.getModel()
    if (model) {
      editor.setModelMarkers(model, MARKER_OWNER, [])
    }
  }
}
