import type { ConnectionType } from '@conar/shared/enums/connection-type'
import type { connectionsResources } from '~/drizzle/schema'
import { CONNECTION_TYPES_WITH_EXPLAIN } from '@conar/shared/constants'
import { Button } from '@conar/ui/components/button'
import { Checkbox } from '@conar/ui/components/checkbox'
import { ContentSwitch } from '@conar/ui/components/custom/content-switch'
import { Popover, PopoverContent, PopoverTrigger } from '@conar/ui/components/popover'
import { Separator } from '@conar/ui/components/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiCheckLine, RiFileCopyLine, RiLoader4Line, RiPieChart2Line, RiSaveLine } from '@remixicon/react'
import { useIsFetching, useMutation } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { customQuery } from '~/entities/connection/queries/custom'
import { connectionResourceToQueryParams } from '~/entities/connection/query'
import { getConnectionResourceStore, getEditorQueriesComputed } from '~/entities/connection/store'
import { wrapExplainQuery } from '~/entities/connection/utils/helpers'
import { queryClient } from '~/main'
import { runnerQueryOptions } from '.'

export function RunnerEditorQueryZone({
  connectionResource,
  connectionType,
  onRun,
  onSave,
  onCopy,
  lineNumber,
}: {
  connectionResource: typeof connectionsResources.$inferSelect
  connectionType: ConnectionType
  onRun: (index: number) => void
  onSave: () => void
  onCopy: () => void
  lineNumber: number
}) {
  const [isCopying, setIsCopying] = useState(false)
  const [explainOpen, setExplainOpen] = useState(false)
  const isFetching = useIsFetching(runnerQueryOptions(connectionResource), queryClient) > 0

  const { mutate: explain, isPending: isExplaining, isError: isExplainError, isSuccess: isExplainSuccess, data: explainData, error: explainError } = useMutation({
    mutationFn: async (query: string) => {
      const explainQuery = wrapExplainQuery(query)
      const startTime = performance.now()
      const result = await customQuery({ query: explainQuery }).run(connectionResourceToQueryParams(connectionResource))
      const duration = performance.now() - startTime
      const rows = Array.isArray(result) ? result : (result as { rows?: unknown[] })?.rows ?? []
      return { rows: rows as Record<string, unknown>[], duration, query }
    },
  }, queryClient)

  const store = getConnectionResourceStore(connectionResource.id)
  const isChecked = useSubscription(store, { selector: state => state.selectedLines.includes(lineNumber) })

  const editorQueriesStore = getEditorQueriesComputed(connectionResource.id)
  const { queriesLength, queryNumber } = useSubscription(editorQueriesStore, {
    selector: (state) => {
      const index = state.findIndex(query => query.startLineNumber === lineNumber)
      const queriesBefore = state.slice(0, index).reduce((sum, curr) => sum + curr.queries.length, 0) + 1
      const queriesLength = state[index]?.queries.length ?? 0

      return {
        queriesLength,
        queryNumber: queriesLength === 1 ? queriesBefore : `${queriesBefore} - ${queriesBefore + queriesLength - 1}`,
      }
    },
  })

  const onCheckedChange = () => {
    store.set(state => ({
      ...state,
      selectedLines: isChecked
        ? state.selectedLines.filter(l => l !== lineNumber)
        : [...state.selectedLines, lineNumber].toSorted((a, b) => a - b),
    } satisfies typeof state))
  }

  const handleExplain = (index: number) => {
    const editorQueries = editorQueriesStore.get()
    const editorQuery = editorQueries.find(query => query.startLineNumber === lineNumber)

    if (!editorQuery)
      return

    const query = editorQuery.queries.at(index)

    if (!query)
      return

    setExplainOpen(true)
    explain(query)
  }

  return (
    <TooltipProvider>
      <div className={cn(`
        flex h-full items-center justify-between gap-2 border-y px-2 py-1 pr-6
      `)}
      >
        <div className="flex flex-1 items-center justify-between gap-2">
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
            <Separator orientation="vertical" className="mx-1 h-4!" />
            {Array.from({ length: queriesLength }).map((_, idx) => {
              const key = `query-run-${connectionResource.id}-${lineNumber}-${idx}`
              return (
                <Fragment key={key}>
                  {CONNECTION_TYPES_WITH_EXPLAIN.includes(connectionType) && (
                    <Popover open={explainOpen} onOpenChange={setExplainOpen}>
                      <PopoverTrigger
                        render={(
                          <Button
                            size="xs"
                            variant="secondary"
                            className="focus:outline-none!"
                            disabled={isFetching || isExplaining}
                            onClick={() => handleExplain(idx)}
                          />
                        )}
                      >
                        {isExplaining
                          ? <RiLoader4Line className="size-3.5 animate-spin" />
                          : <RiPieChart2Line className="size-3.5" />}
                      </PopoverTrigger>
                      <PopoverContent
                        className="
                          max-h-[400px] w-auto max-w-[600px] overflow-auto p-0
                        "
                        side="bottom"
                        align="end"
                      >
                        {isExplaining && (
                          <div className="
                            flex items-center gap-2 p-3 text-xs
                            text-muted-foreground
                          "
                          >
                            <RiLoader4Line className="size-3.5 animate-spin" />
                            Running EXPLAIN...
                          </div>
                        )}
                        {isExplainError && (
                          <div className="p-3 text-xs text-destructive">
                            {explainError instanceof Error ? explainError.message : String(explainError)}
                          </div>
                        )}
                        {isExplainSuccess && (
                          <div className="flex flex-col">
                            <div className="
                              flex items-center gap-2 border-b px-3 py-2
                            "
                            >
                              <span className="text-xs font-medium">EXPLAIN</span>
                              <Separator orientation="vertical" className="h-3!" />
                              <span className="text-xs text-muted-foreground">
                                {explainData.rows.length}
                                {' '}
                                {explainData.rows.length === 1 ? 'row' : 'rows'}
                              </span>
                              <Separator orientation="vertical" className="h-3!" />
                              <span className="text-xs text-muted-foreground">
                                {explainData.duration.toFixed()}
                                ms
                              </span>
                            </div>
                            <div className="
                              overflow-auto p-3 font-mono text-xs whitespace-pre
                            "
                            >
                              {explainData.rows.map(row => Object.values(row).join('\t')).join('\n')}
                            </div>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  )}
                  <Button
                    size="xs"
                    className="focus:outline-none!"
                    disabled={isFetching}
                    onClick={() => onRun(idx)}
                  >
                    Run
                    {' '}
                    {queriesLength === 1 ? '' : idx + 1}
                  </Button>
                </Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
