import type { editor } from 'monaco-editor'
import type { RefObject } from 'react'
import type { databases } from '~/drizzle'
import { Button } from '@conar/ui/components/button'
import { Checkbox } from '@conar/ui/components/checkbox'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { LoadingContent } from '@conar/ui/components/custom/loading-content'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { copy } from '@conar/ui/lib/copy'
import { render } from '@conar/ui/lib/render'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiFileCopyLine, RiSaveLine, RiSparkling2Line } from '@remixicon/react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { orpcQuery } from '~/lib/orpc'
import { queryClient } from '~/main'
import { runnerQueryOptions } from '.'
import { Route } from '../..'
import { databaseStore, useSQLQueries } from '../../../../-store'
import { useRunnerContext } from './runner-context'

// eslint-disable-next-line react-refresh/only-export-components
function RunnerEditorQueryZone({
  database,
  onRun,
  onSave,
  onCopy,
  onReplace,
  lineNumber,
}: {
  database: typeof databases.$inferSelect
  onRun: (index: number) => void
  onSave: () => void
  onCopy: () => void
  onReplace: (newQuery: string) => void
  lineNumber: number
}) {
  const store = databaseStore(database.id)
  const { data: queriesWithError, isFetching } = useQuery({
    ...runnerQueryOptions({ database }),
    select: data => data.filter((q): q is { data: null, error: string, sql: string } => !!q.error) ?? [],
  }, queryClient)
  const [isCopying, setIsCopying] = useState(false)
  const isChecked = useStore(store, state => state.selectedLines.includes(lineNumber))
  const queries = useSQLQueries(database.id)

  const index = queries.findIndex(query => query.startLineNumber === lineNumber)
  const currentQueries = queries[index]?.queries ?? []
  const queryWithError = queriesWithError?.find(q => currentQueries.includes(q.sql))

  const queriesBefore = queries.slice(0, index).reduce((sum, curr) => sum + curr.queries.length, 0)
  const startFrom = queriesBefore + 1

  const onCheckedChange = () => {
    store.setState(state => ({
      ...state,
      selectedLines: isChecked
        ? state.selectedLines.filter(l => l !== lineNumber)
        : [...state.selectedLines, lineNumber].toSorted((a, b) => a - b),
    } satisfies typeof state))
  }

  const { mutate, isPending } = useMutation(orpcQuery.ai.fixSQL.mutationOptions({
    onSuccess: (sql) => {
      onReplace(sql)
    },
  }), queryClient)

  return (
    <div className={cn(
      'flex gap-2 items-center justify-between h-full',
      'px-2 pr-6 py-1 border-y',
    )}
    >
      <div className="flex-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className={cn('flex items-center gap-2 text-xs', queryWithError && 'text-destructive')}>
            <Checkbox
              className="focus:outline-none!"
              checked={isChecked}
              onCheckedChange={() => onCheckedChange()}
            />
            Query
            {' '}
            {currentQueries.length === 1 ? startFrom : `${startFrom} - ${startFrom + currentQueries.length - 1}`}
          </label>
          {queryWithError && (
            <>
              <Separator orientation="vertical" className="h-4! mx-1" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="xs"
                      className="focus:outline-none!"
                      onClick={() => mutate({
                        sql: currentQueries.map(q => `${q};`).join(' '),
                        type: database.type,
                        error: queryWithError.error,
                      })}
                    >
                      <LoadingContent loading={isPending} loaderClassName="size-3">
                        <RiSparkling2Line className="size-3.5" />
                        Fix quer
                        {currentQueries.length === 1 ? 'y' : 'ies'}
                      </LoadingContent>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Run this query again (last run had an error)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
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
          {Array.from({ length: currentQueries.length }).map((_, index) => (
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
              {currentQueries.length === 1 ? '' : index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function useRunnerEditorQueryZone(monacoRef: RefObject<editor.IStandaloneCodeEditor | null>) {
  const { database } = Route.useRouteContext()
  const queries = useSQLQueries(database.id)
  const linesWithQueries = useMemo(() => queries.map(({ startLineNumber }) => startLineNumber), [queries])

  const getQueriesEvent = useEffectEvent((lineNumber: number) =>
    queries.find(query => query.startLineNumber === lineNumber),
  )

  const run = useRunnerContext(({ run }) => run)
  const runEvent = useEffectEvent(run)
  const save = useRunnerContext(({ save }) => save)
  const saveEvent = useEffectEvent(save)
  const replace = useRunnerContext(({ replace }) => replace)
  const replaceEvent = useEffectEvent(replace)

  useEffect(() => {
    if (!monacoRef.current)
      return

    const editor = monacoRef.current
    const viewZoneIds: string[] = []

    queueMicrotask(() => {
      editor.changeViewZones((changeAccessor) => {
        linesWithQueries.forEach((lineNumber) => {
          const element = render(
            <RunnerEditorQueryZone
              database={database}
              lineNumber={lineNumber}
              onRun={(index) => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  return

                runEvent([query.queries[index]!])
              }}
              onCopy={() => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  return

                copy(query.queries.map(q => `${q};`).join(' '))
              }}
              onSave={() => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  return

                saveEvent(query.queries.map(q => `${q};`).join(' '))
              }}
              onReplace={(sql) => {
                const query = getQueriesEvent(lineNumber)

                if (!query)
                  return

                replaceEvent({ sql, ...query })
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
