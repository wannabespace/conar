import { Monaco } from '@tamery/monaco/editor'
import {
  attachGhostTextEscape,
  attachSqlDiagnostics,
  bindSqlModel,
  sqlLanguageIds,
} from '@tamery/monaco/sql-language'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSubscription } from 'seitu/react'

import { resourceEnumsQueryOptions } from '~/entities/connection/queries/enums/list'
import { resourceTablesAndSchemasQueryOptions } from '~/entities/connection/queries/tables/list'
import { sqlSourceFor } from '~/entities/connection/sql-source'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'

import { useRunnerActions } from '../-lib/actions'
import { useEditorActions } from '../-lib/editor-actions'
import type { RunnerResult } from '../-lib/run'
import { runnerResultsOptions } from '../-lib/run'
import type { RunAnchor } from '../-lib/statement-band'
import { sameSpot, useStatementBand } from '../-lib/statement-band'
import { setQuery, useRunnerPageStore, useRunnerTab } from '../-lib/store'
import { openMenuFromKeyboard, StatementControls } from './statement-controls'

const { useRouteContext } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const MONACO_OPTIONS = {
  contextmenu: false,
  folding: false,
  inlineSuggest: {
    enabled: true,
    showToolbar: 'never',
  },
  lineNumbersMinChars: 3,
  // `other` defaults to 'offWhenInlineCompletions': the list would wait on the AI ghost-text request.
  quickSuggestions: { comments: 'off', other: 'on', strings: 'on' },
  quickSuggestionsDelay: 0,
  renderLineHighlight: 'none',
  scrollBeyondLastLine: false,
  // `preview` stays off: the row's own preview draws as ghost text and would read as an AI suggestion.
  suggest: {
    preview: false,
    selectionMode: 'whenQuickSuggestion',
    showWords: false,
  },
  wordWrap: 'on',
} satisfies editor.IStandaloneEditorConstructionOptions

export const RunnerEditor = ({
  editorRef,
  editing,
  reviewing,
  acceptAi,
  rejectAi,
}: {
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>
  editing: boolean
  reviewing: boolean
  acceptAi: () => void
  rejectAi: () => void
}) => {
  const { connection, connectionResource } = useRouteContext()
  const store = useRunnerPageStore()
  const query = useSubscription(store, { selector: (state) => state.query })
  const actions = useRunnerActions()
  const { data: run } = useQuery(runnerResultsOptions(useRunnerTab()))

  const chatOpened = useSubscription(
    getConnectionResourceStore(connectionResource.id),
    { selector: (state) => state.chatOpened }
  )
  const [runAnchor, setRunAnchor] = useState<RunAnchor | null>(null)
  const statementMenuRef = useRef<HTMLButtonElement>(null)

  const failed = runAnchor
    ? run?.results.find(
        (result): result is RunnerResult & { error: string } =>
          result.error !== null &&
          result.start === runAnchor.start &&
          result.source === runAnchor.source
      )
    : undefined

  useEditorActions(editorRef, {
    ...actions,
    acceptAi,
    failing: failed !== undefined,
    fixAi: () => failed && actions.fixWithAi(failed),
    openStatementMenu: () => openMenuFromKeyboard(statementMenuRef.current),
    rejectAi,
    reviewing,
  })
  useStatementBand(editorRef, (anchor) =>
    setRunAnchor((current) =>
      sameSpot(current, anchor) &&
      sameSpot(current?.suggestion, anchor?.suggestion) &&
      current?.start === anchor?.start &&
      current?.source === anchor?.source
        ? current
        : anchor
    )
  )

  // The editor's catalog reads these from the cache; observing them keeps them cached and refetched on invalidation.
  useQuery({
    ...resourceTablesAndSchemasQueryOptions({ connectionResource }),
    throwOnError: false,
  })
  useQuery({
    ...resourceEnumsQueryOptions({ connectionResource }),
    throwOnError: false,
  })

  useEffect(() => {
    editorRef.current?.focus()
  }, [editorRef])

  useEffect(() => {
    if (!chatOpened) {
      editorRef.current?.focus()
    }
  }, [chatOpened, editorRef])

  useEffect(() => {
    const codeEditor = editorRef.current
    const model = codeEditor?.getModel()
    if (!codeEditor || !model) {
      return
    }
    const source = sqlSourceFor(connectionResource, connection.type)
    bindSqlModel(model, source)
    const detachDiagnostics = attachSqlDiagnostics(codeEditor, source)
    const detachEscape = attachGhostTextEscape(codeEditor)
    return () => {
      detachDiagnostics()
      detachEscape()
    }
  }, [editorRef, connectionResource, connection.type])

  return (
    <div className="relative size-full">
      <Monaco
        data-mask
        ref={editorRef}
        language={sqlLanguageIds[connection.type]}
        value={query}
        onChange={(next) => setQuery(store, next)}
        className="size-full"
        options={MONACO_OPTIONS}
      />
      {runAnchor && !editing && (
        <StatementControls
          anchor={runAnchor}
          editorRef={editorRef}
          failed={failed}
          menuRef={statementMenuRef}
        />
      )}
    </div>
  )
}
