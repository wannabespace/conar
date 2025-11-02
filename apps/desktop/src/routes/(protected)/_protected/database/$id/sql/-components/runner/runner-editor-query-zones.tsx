import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Checkbox } from '@conar/ui/components/checkbox'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { render } from '@conar/ui/lib/render'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiFileCopyLine, RiSaveLine } from '@remixicon/react'
import { useIsFetching } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { queryClient } from '~/main'
import { runnerQueryOptions } from '.'
import { Route } from '../..'
import { databaseStore } from '../../../../-store'
import { useRunnerContext } from './runner-context'

// eslint-disable-next-line react-refresh/only-export-components
function RunnerEditorQueryZone({
  database,
  onRun,
  onSave,
  onCopy,
  lineNumber,
}: {
  database: typeof databases.$inferSelect
  onRun: (index: number) => void
  onSave: () => void
  onCopy: () => void
  lineNumber: number
}) {
  const [isCopying, setIsCopying] = useState(false)
  const isFetching = useIsFetching(runnerQueryOptions({ database }), queryClient) > 0

  const store = databaseStore(database.id)
  const isChecked = useStore(store, state => state.selectedLines.includes(lineNumber))

  const index = useStore(store, state => state.editorQueries.findIndex(query => query.startLineNumber === lineNumber))
  const { queriesLength, queryNumber } = useStore(store, (state) => {
    const queriesBefore = state.editorQueries.slice(0, index).reduce((sum, curr) => sum + curr.queries.length, 0) + 1
    const queriesLength = state.editorQueries[index]?.queries.length ?? 0

    return {
      queriesLength,
      queryNumber: queriesLength === 1 ? queriesBefore : `${queriesBefore} - ${queriesBefore + queriesLength - 1}`,
    }
  })

  const onCheckedChange = () => {
    store.setState(state => ({
      ...state,
      selectedLines: isChecked
        ? state.selectedLines.filter(l => l !== lineNumber)
        : [...state.selectedLines, lineNumber].toSorted((a, b) => a - b),
    } satisfies typeof state))
  }

  return (
    <div className={cn(
      'flex gap-2 items-center justify-between h-full',
      'px-2 pr-6 py-1 border-y',
    )}
    >
      <div className="flex-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              className="focus:outline-none!"
              checked={isChecked}
              onCheckedChange={() => onCheckedChange()}
            />
            Query
            {' '}
            {queryNumber}
          </label>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="focus:outline-none!"
                  onClick={() => onSave()}
                >
                  <RiSaveLine className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Save
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="focus:outline-none!"
                  onClick={() => {
                    onCopy()
                    setIsCopying(true)
                  }}
                >
                  <ContentSwitch
                    active={isCopying}
                    activeContent={<RiCheckLine className="text-success" />}
                    onSwitchEnd={() => setIsCopying(false)}
                  >
                    <RiFileCopyLine className="size-3.5" />
                  </ContentSwitch>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Copy
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="h-4! mx-1" />
          {Array.from({ length: queriesLength }).map((_, index) => (
            <Button
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              size="xs"
              className="focus:outline-none!"
              disabled={isFetching}
              onClick={() => onRun(index)}
            >
              Run
              {' '}
              {queriesLength === 1 ? '' : index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function useRunnerEditorQueryZones(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { database } = Route.useRouteContext()
  const store = databaseStore(database.id)
  const linesWithQueries = useStore(store, state => state.editorQueries.map(({ startLineNumber }) => startLineNumber))

  const getQueriesEvent = useEffectEvent((lineNumber: number) =>
    store.state.editorQueries.find(query => query.startLineNumber === lineNumber),
  )

  const run = useRunnerContext(({ run }) => run)
  const runEvent = useEffectEvent(run)
  const save = useRunnerContext(({ save }) => save)
  const saveEvent = useEffectEvent(save)

  const elementsRef = useRef<Record<number, HTMLDivElement>>([])

  useEffect(() => {
    if (!monacoRef.current)
      return

    const editor = monacoRef.current
    const elements = elementsRef.current
    const viewZoneIds: { id: string, lineNumber: number }[] = []

    queueMicrotask(() => {
      editor.changeViewZones((changeAccessor) => {
        linesWithQueries.forEach((lineNumber) => {
          elements[lineNumber] ||= render(
            <RunnerEditorQueryZone
              database={database}
              lineNumber={lineNumber}
              onRun={(index) => {
                const editorQuery = getQueriesEvent(lineNumber)

                if (!editorQuery)
                  return

                const query = editorQuery.queries.at(index)

                if (!query)
                  return

                runEvent([{
                  startLineNumber: editorQuery.startLineNumber,
                  endLineNumber: editorQuery.endLineNumber,
                  query,
                }])
              }}
              onCopy={() => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  return

                const { startLineNumber, endLineNumber } = query

                copy(store.state.sql.split('\n').slice(startLineNumber - 1, endLineNumber).join('\n'))
              }}
              onSave={() => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  return

                const { startLineNumber, endLineNumber } = query

                saveEvent(store.state.sql.split('\n').slice(startLineNumber - 1, endLineNumber).join('\n'))
              }}
            />,
          )

          elements[lineNumber]!.style.zIndex = '100'

          const zoneId = changeAccessor.addZone({
            afterLineNumber: lineNumber - 1,
            heightInPx: 32,
            domNode: elements[lineNumber]!,
          })

          viewZoneIds.push({ id: zoneId, lineNumber })
        })
      })
    })

    return () => {
      editor.changeViewZones((changeAccessor) => {
        viewZoneIds.forEach(({ id, lineNumber }) => {
          changeAccessor.removeZone(id)

          if (!linesWithQueries.includes(lineNumber)) {
            elements[lineNumber]?.remove()
            delete elements[lineNumber]
          }
        })
      })
    }
  }, [monacoRef, linesWithQueries, database, store])
}
