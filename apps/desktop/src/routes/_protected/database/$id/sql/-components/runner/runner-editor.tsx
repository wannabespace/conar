import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { editor, Position } from 'monaco-editor'
import type { RefObject } from 'react'
import { useStore } from '@tanstack/react-store'
import { KeyCode, KeyMod } from 'monaco-editor'
import { LanguageIdEnum, setupLanguageFeatures } from 'monaco-sql-languages'
import { useEffect, useEffectEvent, useRef } from 'react'
import { Monaco } from '~/components/monaco'
import { connectionStore } from '~/entities/connection/store'
import { connectionCompletionService } from '~/entities/connection/utils/monaco'
import { Route } from '../..'
import { runnerHooks } from '../../-page'
import { useRunnerContext } from './runner-context'
import { useRunnerEditorAIZones } from './runner-editor-ai-zones'
import { useRunnerEditorQueryZones } from './runner-editor-query-zones'

const dialectsMap = {
  postgres: LanguageIdEnum.PG,
  mysql: LanguageIdEnum.MYSQL,
  mssql: LanguageIdEnum.PG,
  clickhouse: LanguageIdEnum.MYSQL,
  sqlite: LanguageIdEnum.MYSQL, // Using MYSQL as SQLite has similar SQL syntax
} satisfies Record<ConnectionType, LanguageIdEnum>

function useRunnerEditorHooks(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { connection } = Route.useRouteContext()
  const store = connectionStore(connection.id)

  const replace = ({
    query,
    startLineNumber,
    endLineNumber,
  }: {
    query: string
    startLineNumber: number
    endLineNumber: number
  }) => {
    const lines = store.state.sql.split('\n')
    const newSqlLines = query.split('\n')
    const updatedLines = [
      ...lines.slice(0, startLineNumber - 1),
      ...newSqlLines,
      ...lines.slice(endLineNumber),
    ]

    store.setState(state => ({
      ...state,
      sql: updatedLines.join('\n'),
    } satisfies typeof state))
  }

  const replaceEvent = useEffectEvent(replace)

  useEffect(() => {
    const appendToBottomHook = runnerHooks.hook('appendToBottom', (query) => {
      const editor = monacoRef.current
      if (!editor)
        return

      store.setState(state => ({
        ...state,
        sql: `${state.sql}\n\n${query}`,
      } satisfies typeof state))
    })
    const appendToBottomAndFocusHook = runnerHooks.hook('appendToBottomAndFocus', (query) => {
      runnerHooks.callHook('appendToBottom', query)
      window.requestAnimationFrame(() => {
        runnerHooks.callHook('scrollToBottom')
        runnerHooks.callHook('focus')
      })
    })
    const focusRunnerHook = runnerHooks.hook('focus', (lineNumber) => {
      const editor = monacoRef.current
      if (!editor)
        return

      if (lineNumber) {
        editor.setPosition({
          column: 1,
          lineNumber,
        })
      }

      editor.focus()
    })
    const scrollToLineHook = runnerHooks.hook('scrollToLine', (lineNumber) => {
      const editor = monacoRef.current
      if (!editor)
        return

      editor.revealLineInCenter(lineNumber)
    })
    const scrollToBottomHook = runnerHooks.hook('scrollToBottom', () => {
      const editor = monacoRef.current
      if (!editor)
        return

      const lineCount = editor.getModel()?.getLineCount()

      if (lineCount) {
        editor.revealLineInCenter(lineCount)
      }
    })
    const replaceQueryHook = runnerHooks.hook('replaceQuery', ({ query, startLineNumber, endLineNumber }) => {
      replaceEvent({ query, startLineNumber, endLineNumber })
    })

    return () => {
      appendToBottomHook()
      appendToBottomAndFocusHook()
      focusRunnerHook()
      scrollToLineHook()
      scrollToBottomHook()
      replaceQueryHook()
    }
  }, [store, monacoRef])
}

export function RunnerEditor() {
  const { connection } = Route.useRouteContext()
  const store = connectionStore(connection.id)
  const sql = useStore(store, state => state.sql)
  const editorQueries = useStore(store, state => state.editorQueries)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const run = useRunnerContext(({ run }) => run)

  const runEvent = useEffectEvent(run)

  useRunnerEditorHooks(monacoRef)

  useRunnerEditorQueryZones(monacoRef)
  useRunnerEditorAIZones(monacoRef)

  useEffect(() => {
    setupLanguageFeatures(dialectsMap[connection.type], {
      completionItems: {
        enable: true,
        completionService: connectionCompletionService(connection),
      },
    })
  }, [connection])

  const getEditorQueriesEvent = useEffectEvent((position: Position) => {
    return editorQueries.find(query =>
      position.lineNumber >= query.startLineNumber
      && position.lineNumber <= query.endLineNumber,
    ) ?? null
  })

  useEffect(() => {
    if (!monacoRef.current)
      return

    const enterAction = monacoRef.current?.addAction({
      id: 'conar.execute-on-enter',
      label: 'Execute on Enter',
      keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
      run: (e) => {
        const position = e.getPosition()

        if (!position)
          return

        const editorQuery = getEditorQueriesEvent(position)

        if (!editorQuery)
          return

        const query = editorQuery.queries.at(-1)

        if (!query)
          return

        runEvent([{
          startLineNumber: editorQuery.startLineNumber,
          endLineNumber: editorQuery.endLineNumber,
          query,
        }])
      },
    })

    return () => enterAction.dispose()
  }, [])

  return (
    <Monaco
      data-mask
      ref={monacoRef}
      language={dialectsMap[connection.type]}
      value={sql}
      onChange={q => store.setState(state => ({
        ...state,
        sql: q,
      } satisfies typeof state))}
      className="size-full"
      options={{
        wordWrap: 'on',
      }}
    />
  )
}
