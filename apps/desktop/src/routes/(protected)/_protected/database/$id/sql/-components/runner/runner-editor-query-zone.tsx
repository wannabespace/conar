import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Checkbox } from '@conar/ui/components/checkbox'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { render } from '@conar/ui/lib/render'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiFileCopyLine, RiSaveLine } from '@remixicon/react'
import { useIsFetching } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { queryClient } from '~/main'
import { runnerQueryOptions } from '.'
import { Route } from '../..'
import { databaseStore, useSQLQueries } from '../../../../-store'

function RunnerQueryEditorZone({
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
  const store = databaseStore(database.id)
  const isChecked = useStore(store, state => state.selectedLines.includes(lineNumber))
  const queries = useSQLQueries(database.id)
  const startFrom = useMemo(() => {
    const index = queries.findIndex(query => query.startLineNumber === lineNumber)
    const queriesBefore = queries.slice(0, index).reduce((sum, curr) => sum + curr.queries.length, 0)
    return queriesBefore + 1
  }, [lineNumber, queries])
  const queriesAmount = useMemo(
    () => queries.find(query => query.startLineNumber === lineNumber)?.queries.length || 0,
    [lineNumber, queries],
  )
  const isFetching = useIsFetching(runnerQueryOptions({ database }), queryClient) > 0

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
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            className="focus:outline-none!"
            checked={isChecked}
            onCheckedChange={() => onCheckedChange()}
          />
          Query
          {' '}
          {queriesAmount === 1 ? startFrom : `${startFrom} - ${startFrom + queriesAmount - 1}`}
        </label>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-xs"
                  className="focus:outline-none!"
                  onClick={() => onSave()}
                >
                  <RiSaveLine />
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
                  variant="secondary"
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
                    <RiFileCopyLine />
                  </ContentSwitch>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Copy
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {Array.from({ length: queriesAmount }).map((_, index) => (
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
              {queriesAmount === 1 ? '' : index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function useRunnerEditorQueryZone(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>, {
  onRun,
  onSave,
}: {
  onRun: (queries: string[]) => void
  onSave: (query: string) => void
}) {
  const { database } = Route.useRouteContext()
  const queries = useSQLQueries(database.id)
  const linesWithQueries = useMemo(() => queries.map(({ startLineNumber }) => startLineNumber), [queries])

  const getQueriesEvent = useEffectEvent((lineNumber: number) =>
    queries.find(query => query.startLineNumber === lineNumber)?.queries || [],
  )

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
            <RunnerQueryEditorZone
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
}
