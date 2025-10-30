import type { editor, Position } from 'monaco-editor'
import { useStore } from '@tanstack/react-store'
import { KeyCode, KeyMod } from 'monaco-editor'
import { LanguageIdEnum } from 'monaco-sql-languages'
import { useEffect, useEffectEvent, useRef } from 'react'
import { Monaco } from '~/components/monaco'
import { databaseCompletionService } from '~/entities/database/utils/monaco'
import { Route } from '../..'
import { pageHooks } from '../../-page'
import { databaseStore, useEditorQueries } from '../../../../-store'
import { useRunnerContext } from './runner-context'
import { useRunnerEditorAIZone } from './runner-editor-ai-zone'
import { useRunnerEditorQueryZone } from './runner-editor-query-zone'

export function RunnerEditor() {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
  const sql = useStore(store, state => state.sql)
  const editorQueries = useEditorQueries(database.id)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)
  const run = useRunnerContext(({ run }) => run)

  const runEvent = useEffectEvent(run)

  useRunnerEditorQueryZone(monacoRef)
  useRunnerEditorAIZone(monacoRef)

  const completionService = databaseCompletionService(database)

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

        const sql = editorQuery.queries.at(-1)

        if (!sql)
          return

        runEvent([{
          startLineNumber: editorQuery.startLineNumber,
          endLineNumber: editorQuery.endLineNumber,
          sql,
        }])
      },
    })

    return () => enterAction.dispose()
  }, [monacoRef])

  useEffect(() => {
    return pageHooks.hook('focusRunner', () => {
      monacoRef.current?.focus()
    })
  }, [])

  return (
    <Monaco
      data-mask
      ref={monacoRef}
      language={LanguageIdEnum.PG}
      value={sql}
      onChange={q => store.setState(state => ({
        ...state,
        sql: q,
      } satisfies typeof state))}
      completionService={completionService}
      className="size-full"
      options={{
        wordWrap: 'on',
      }}
    />
  )
}
