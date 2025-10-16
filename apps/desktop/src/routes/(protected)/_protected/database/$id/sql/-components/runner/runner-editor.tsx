import type { editor, Position } from 'monaco-editor'
import { useStore } from '@tanstack/react-store'
import { KeyCode, KeyMod } from 'monaco-editor'
import { LanguageIdEnum } from 'monaco-sql-languages'
import { useEffect, useEffectEvent, useMemo, useRef } from 'react'
import { Monaco } from '~/components/monaco'
import { databaseCompletionService } from '~/entities/database/utils/monaco'
import { Route } from '../..'
import { pageHooks, pageStore, queries } from '../../-lib'
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
  const sql = useStore(pageStore, state => state.sql)
  const queriesArray = useStore(queries)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)

  const onRunEvent = useEffectEvent(onRun)

  useRunnerEditorQueryZone(monacoRef, {
    onRun,
    onSave,
  })

  useRunnerEditorAIZone(monacoRef)

  const completionService = useMemo(() => databaseCompletionService(database), [database])

  const getInlineQueriesEvent = useEffectEvent((position: Position) => {
    return queriesArray.find(query =>
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
      onChange={q => pageStore.setState(state => ({
        ...state,
        sql: q,
      }))}
      completionService={completionService}
      className="size-full"
      options={{
        wordWrap: 'on',
      }}
    />
  )
}
