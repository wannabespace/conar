import type { editor, Position } from 'monaco-editor'
import type { ComponentProps } from 'react'
import { copy } from '@conar/ui/lib/copy'
import { render } from '@conar/ui/lib/render'
import { cn } from '@conar/ui/lib/utils'
import { useStore } from '@tanstack/react-store'
import { LanguageIdEnum } from 'monaco-sql-languages'
import { useEffect, useEffectEvent, useMemo, useRef } from 'react'
import { Monaco } from '~/components/monaco'
import { databaseCompletionService } from '~/entities/database/utils/monaco'
import { Route } from '../..'
import { pageHooks, pageStore, queries } from '../../-lib'
import { RunnerEditorZone } from './runner-editor-zone'

export function RunnerEditor({
  className,
  onRun,
  onSave,
  ...props
}: ComponentProps<'div'> & {
  onRun: (queries: string[]) => void
  onSave: (query: string) => void
}) {
  const { database } = Route.useRouteContext()
  const sql = useStore(pageStore, state => state.sql)
  const queriesArray = useStore(queries)
  const monacoRef = useRef<editor.IStandaloneCodeEditor>(null)

  const completionService = useMemo(() => databaseCompletionService(database), [database])

  const getQueriesEvent = useEffectEvent((lineNumber: number) =>
    queriesArray.find(query => query.lineNumber === lineNumber)?.queries || [],
  )

  const linesWithQueries = useMemo(() => queriesArray.map(({ lineNumber }) => lineNumber), [queriesArray])

  const onRunEvent = useEffectEvent(onRun)

  useEffect(() => {
    if (!monacoRef.current)
      return

    const editor = monacoRef.current
    const viewZoneIds: string[] = []

    queueMicrotask(() => {
      editor.changeViewZones((changeAccessor) => {
        linesWithQueries.forEach((lineNumber) => {
          const element = render(
            <RunnerEditorZone
              database={database}
              lineNumber={lineNumber}
              onRun={(index) => {
                onRunEvent([getQueriesEvent(lineNumber)[index]!])
              }}
              onCopy={() => {
                copy(getQueriesEvent(lineNumber).map(q => `${q};`).join(' '))
              }}
              onSave={() => {
                onSave(getQueriesEvent(lineNumber).map(q => `${q};`).join(' '))
              }}
            />,
          )

          element.style.zIndex = '100'

          const zoneId = changeAccessor.addZone({
            afterLineNumber: lineNumber - 1,
            heightInPx: 32,
            domNode: element,
          })

          viewZoneIds.push(zoneId)
        })
      })
    })

    return () => {
      editor.changeViewZones((changeAccessor) => {
        viewZoneIds.forEach(id => changeAccessor.removeZone(id))
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monacoRef, JSON.stringify(linesWithQueries), database])

  useEffect(() => {
    return pageHooks.hook('focusRunner', () => {
      monacoRef.current?.focus()
    })
  }, [monacoRef])

  function findQueriesByPosition(position: Position | null) {
    if (!position)
      return ''

    const matchingQuery = queriesArray.find(query =>
      position.lineNumber >= query.lineNumber
      && position.lineNumber <= query.endLineNumber,
    )
    return matchingQuery?.queries.at(-1) || ''
  }

  return (
    <div
      className={cn('relative', className)}
      {...props}
    >
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
        onEnter={e => onRun([findQueriesByPosition(e.getPosition())])}
      />
    </div>
  )
}
