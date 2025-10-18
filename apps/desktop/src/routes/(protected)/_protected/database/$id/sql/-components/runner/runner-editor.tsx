import type { editor, Position } from 'monaco-editor'
import { useStore } from '@tanstack/react-store'
import { KeyCode, KeyMod } from 'monaco-editor'
import { LanguageIdEnum } from 'monaco-sql-languages'
import { useEffect, useEffectEvent, useRef } from 'react'
import { Monaco } from '~/components/monaco'
import { databaseCompletionService } from '~/entities/database/utils/monaco'
import { Route } from '../..'
import { pageHooks } from '../../-page'
import { databaseStore, useSQLQueries } from '../../../../-store'
import { useRunnerEditorAIZone } from './runner-editor-ai-zone'
import { useRunnerEditorQueryZone } from './runner-editor-query-zone'

export function RunnerEditor({
  onRun,
  onSave,
}: {
  onRun: (queries: string[]) => void
  onSave: (query: string) => void
}) {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
  const sql = useStore(store, state => state.sql)
  const queries = useSQLQueries(database.id)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)

  const onRunEvent = useEffectEvent(onRun)

  useRunnerEditorQueryZone(monacoRef, {
    onRun,
    onSave,
  })

  useRunnerEditorAIZone(monacoRef)

  const completionService = databaseCompletionService(database)

  const getInlineQueriesEvent = useEffectEvent((position: Position) => {
    return queries.find(query =>
      position.lineNumber >= query.startLineNumber
      && position.lineNumber <= query.endLineNumber,
    )?.queries ?? []
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

        const inlineQuery = getInlineQueriesEvent(position).at(-1)

        if (!inlineQuery)
          return

        onRunEvent([inlineQuery])
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
