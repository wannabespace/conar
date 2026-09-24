import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  AI_SQL_LIMITS,
} from '@tamery/shared/constants'
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
  parseStatements,
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

/** Which connection resource a SQL model belongs to; unbound models get keywords only. */
const boundResources = new WeakMap<editor.ITextModel, ConnectionResource>()

export const bindSqlModel = (
  model: editor.ITextModel,
  connectionResource: ConnectionResource
) => {
  boundResources.set(model, connectionResource)
  queryClient.prefetchQuery(
    resourceTablesAndSchemasQueryOptions({ connectionResource })
  )
  queryClient.prefetchQuery(resourceEnumsQueryOptions({ connectionResource }))
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
              type: column.type,
            })) ?? null,
        kind: table.type,
        name: table.name,
      })),
    })),
  }
}

/** Fetches the columns of every table a statement reads, so catalog lookups can see them. */
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
    ?.some((item) =>
      ACTIVE_SUBSCRIPTION_STATUSES.includes(
        item.status as (typeof ACTIVE_SUBSCRIPTION_STATUSES)[number]
      )
    ) ?? false

const GHOST_TEXT_DELAY = 150
/** The text as it would read with the highlighted suggestion accepted, and where the ghost text starts. */
const textWithPick = (
  model: editor.ITextModel,
  position: Position,
  selected: languages.SelectedSuggestionInfo | undefined
) => {
  const typed = model.getValue()
  const caret = model.getOffsetAt(position)
  if (!selected) {
    return { offset: caret, start: position, text: typed }
  }
  const start = Range.lift(selected.range).getStartPosition()
  const pickStart = model.getOffsetAt(start)
  return {
    offset: pickStart + selected.text.length,
    start,
    text: typed.slice(0, pickStart) + selected.text + typed.slice(caret),
  }
}

/** A caret past a finished statement has nothing to continue. */
const continuesStatement = (statement: Statement | undefined, offset: number) =>
  statement !== undefined &&
  statement.tokens.length > 0 &&
  !(
    offset >= statement.terminatorEnd && statement.terminatorEnd > statement.end
  )

/** Ghost text last offered on top of a highlighted list row, valid only for the text it was made for. */
const pickPreviews = new WeakMap<
  editor.ITextModel,
  { start: Position; text: string; versionId: number }
>()

/** The last ghost text per editor, so typing along with it keeps it on screen without a new request. */
const lastGhostText = new WeakMap<
  editor.ITextModel,
  { before: string; after: string; text: string }
>()

/** What is left of the last suggestion when the user typed its beginning, else nothing. */
const rememberedGhostText = (
  model: editor.ITextModel,
  typed: string,
  offset: number
) => {
  const last = lastGhostText.get(model)
  const before = typed.slice(0, offset)
  if (
    !last ||
    typed.slice(offset) !== last.after ||
    !before.startsWith(last.before)
  ) {
    return
  }
  const typedAlong = before.slice(last.before.length)
  return last.text.startsWith(typedAlong) &&
    typedAlong.length < last.text.length
    ? last.text.slice(typedAlong.length)
    : undefined
}

/**
 * Monaco's default range swallows the rest of the line (an auto-closed quote, a `;`) and drops a
 * suggestion that does not end with it. Replace the rest only when the suggestion repeats it.
 */
const ghostItem = (
  model: editor.ITextModel,
  position: Position,
  start: Position,
  insertText: string
) => {
  const restOfLine = model
    .getLineContent(position.lineNumber)
    .slice(position.column - 1)
  const lineEnd = position.with(
    undefined,
    model.getLineMaxColumn(position.lineNumber)
  )
  return {
    insertText,
    range: Range.fromPositions(
      start,
      restOfLine && insertText.endsWith(restOfLine) ? lineEnd : position
    ),
  }
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

/** Models whose user just pressed Escape: no new ghost text until they type again. */
const ghostTextSuppressed = new WeakSet<editor.ITextModel>()

/** Escape means "stop suggesting" — Monaco would otherwise ask for a fresh ghost text the moment the list closes. */
/**
 * The ghost text drawn while the list is open continues the highlighted row, so Tab takes both:
 * Monaco alone would insert only the row. Runs before Monaco's own Tab binding.
 */
const acceptPickWithGhostText = (codeEditor: editor.IStandaloneCodeEditor) => {
  const model = codeEditor.getModel()
  const position = codeEditor.getPosition()
  const preview = model && pickPreviews.get(model)
  const shown = codeEditor
    .getDomNode()
    ?.querySelector('.suggest-widget.visible .monaco-list-row.focused')
  if (
    !model ||
    !position ||
    !preview ||
    !shown ||
    preview.versionId !== model.getVersionId() ||
    !codeEditor
      .getDomNode()
      ?.querySelector('.ghost-text-decoration-preview, .ghost-text-decoration')
  ) {
    return false
  }
  codeEditor.trigger('runner', 'hideSuggestWidget', null)
  const item = ghostItem(model, position, preview.start, preview.text)
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
    if (event.keyCode === KeyCode.Escape && model) {
      ghostTextSuppressed.add(model)
    }
    if (event.keyCode === KeyCode.Tab && acceptPickWithGhostText(codeEditor)) {
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
// The model sometimes answers "There's nothing to add…" instead of an empty reply; a sentence is never SQL.
// Sentence punctuation never occurs in SQL a model would continue with: a period, question or
// colon followed by a space or ending the text means it explained instead of completing.
const PROSE = /[.!?:…]\s|[.!?:…]$/u

const catalogSummaryOf = (
  connectionResource: ConnectionResource,
  connectionType: ConnectionType
) => catalogSummary(sqlCatalogOf(connectionResource, connectionType))

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
      if (
        (trigger.triggerCharacter === ' ' ||
          trigger.triggerCharacter === '(') &&
        context.expects === 'any'
      ) {
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
      const range = rangeOf(model, context.replaceStart, context.replaceEnd)
      return {
        incomplete: missingColumns,
        suggestions: completionItems(context, catalog, dialect).map((item) => ({
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
      // With the suggestion list open, Monaco shows only ghost text that continues the highlighted
      // row, and Tab still accepts that row. So the request is made as if the row were accepted.
      const selected = context.selectedSuggestionInfo
      if (
        selected?.isSnippetText ||
        !connectionResource ||
        ghostTextSuppressed.has(model) ||
        !appStore.get().isOnline ||
        !hasSubscription()
      ) {
        return { items: [] }
      }
      const typed = model.getValue()
      const remembered = selected
        ? undefined
        : rememberedGhostText(model, typed, model.getOffsetAt(position))
      if (remembered) {
        return { items: [ghostItem(model, position, position, remembered)] }
      }
      const { offset, start, text } = textWithPick(model, position, selected)
      const statements = parseStatements(
        text,
        tokenize(text, dialect).tokens,
        dialect
      )
      const statement = statementAt(statements, offset, text)
      // The model sees the statement being written and one on each side for style, not the whole tab.
      const window = neighbourhood(statements, statement, text.length)
      if (!continuesStatement(statement, offset)) {
        return { items: [] }
      }
      await sleep(GHOST_TEXT_DELAY)
      if (token.isCancellationRequested) {
        return { items: [] }
      }
      const controller = new AbortController()
      token.onCancellationRequested(() => controller.abort())
      // A keystroke cancels the request mid-flight; that is not an error to surface.
      const { data: reply } = await tryCatchAsync(() =>
        orpc.ai.completeSQL.call(
          {
            context: catalogSummaryOf(connectionResource, connectionType),
            prefix: text.slice(
              Math.max(window.start, offset - AI_SQL_LIMITS.sql),
              offset
            ),
            suffix: text.slice(
              offset,
              Math.min(window.end, offset + AI_SQL_LIMITS.sql)
            ),
            type: connectionType,
          },
          { context: { silent: true }, signal: controller.signal }
        )
      )
      if (!reply?.trim() || PROSE.test(reply.trim())) {
        return { items: [] }
      }
      const suggestion = withinStatement(text.slice(0, offset), reply, dialect)
      const continuation = needsLeadingSpace(
        text.slice(0, offset),
        suggestion,
        Boolean(selected) ||
          context.triggerKind ===
            languages.InlineCompletionTriggerKind.Explicit,
        dialect
      )
        ? ` ${suggestion}`
        : suggestion
      const insertText = (selected?.text ?? '') + continuation
      if (selected) {
        pickPreviews.set(model, {
          start,
          text: insertText,
          versionId: model.getVersionId(),
        })
      } else {
        lastGhostText.set(model, {
          after: typed.slice(offset),
          before: typed.slice(0, offset),
          text: insertText,
        })
      }
      return { items: [ghostItem(model, position, start, insertText)] }
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

/** Keeps the editor's markers in step with its text and with what the catalog learns. */
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
      loadColumns(
        connectionResource,
        catalog,
        parseStatements(text, tokenize(text, dialect).tokens, dialect).flatMap(
          (statement) => statementScope(statement.tokens).tables
        )
      )
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
