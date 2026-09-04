import {
  HelpCircleIcon,
  SaveIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { CONNECTION_TYPES_WITH_EXPLAIN } from '@tamery/shared/constants'
import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { Button } from '@tamery/ui/components/button'
import { Checkbox } from '@tamery/ui/components/checkbox'
import { ContentSwitch } from '@tamery/ui/components/custom/content-switch'
import { CopyButton } from '@tamery/ui/components/custom/copy-button'
import { LoadingContent } from '@tamery/ui/components/custom/loading-content'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@tamery/ui/components/popover'
import { Separator } from '@tamery/ui/components/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useIsFetching, useMutation } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { useSubscription } from 'seitu/react'

import type { ConnectionResource } from '~/entities/connection/core'
import { customQuery } from '~/entities/connection/queries/custom'
import { connectionResourceToQueryParams } from '~/entities/connection/runtime'
import { wrapExplainQuery } from '~/entities/connection/utils/helpers'
import { queryClient } from '~/main'

import { runnerQueryOptions } from '.'
import { getEditorQueriesComputed, runnerPageStore } from '../../-lib/store'

export const RunnerEditorQueryZone = ({
  connectionResource,
  connectionType,
  onRun,
  onSave,
  getQuery,
  lineNumber,
  tabId,
}: {
  connectionResource: ConnectionResource
  connectionType: ConnectionType
  onRun: (index: number) => void
  onSave: () => void
  getQuery: () => string
  lineNumber: number
  tabId: string
}) => {
  const [explainOpen, setExplainOpen] = useState(false)
  const isFetching =
    useIsFetching(
      runnerQueryOptions({ connectionResource, tabId }),
      queryClient
    ) > 0

  const {
    mutate: explain,
    isPending: isExplaining,
    isError: isExplainError,
    isSuccess: isExplainSuccess,
    data: explainData,
    error: explainError,
  } = useMutation(
    {
      mutationFn: async (query: string) => {
        const startTime = performance.now()
        const rows = await customQuery({ query: wrapExplainQuery(query) }).run(
          await connectionResourceToQueryParams(connectionResource)
        )
        const duration = performance.now() - startTime
        return { rows, duration, query }
      },
      onSettled: () => {
        setExplainOpen(true)
      },
    },
    queryClient
  )

  const store = runnerPageStore({
    resourceId: connectionResource.id,
    tabId,
  })
  const isChecked = useSubscription(store, {
    selector: (state) => state.selectedLines.includes(lineNumber),
  })

  const editorQueriesStore = getEditorQueriesComputed({
    resourceId: connectionResource.id,
    tabId,
  })
  const { queriesLength, queryNumber } = useSubscription(editorQueriesStore, {
    selector: (state) => {
      const index = state.findIndex(
        (query) => query.startLineNumber === lineNumber
      )
      const queriesBefore =
        state
          .slice(0, index)
          .reduce((sum, curr) => sum + curr.queries.length, 0) + 1
      const currentQueriesLength = state[index]?.queries.length ?? 0

      return {
        queriesLength: currentQueriesLength,
        queryNumber:
          currentQueriesLength === 1
            ? queriesBefore
            : `${queriesBefore} - ${queriesBefore + currentQueriesLength - 1}`,
      }
    },
  })

  const onCheckedChange = () => {
    store.set(
      (state) =>
        ({
          ...state,
          selectedLines: isChecked
            ? state.selectedLines.filter((l) => l !== lineNumber)
            : [...state.selectedLines, lineNumber].toSorted((a, b) => a - b),
        }) satisfies typeof state
    )
  }

  const handleExplain = (index: number) => {
    const editorQueries = editorQueriesStore.get()
    const editorQuery = editorQueries.find(
      (query) => query.startLineNumber === lineNumber
    )

    if (!editorQuery) {
      return
    }

    const query = editorQuery.queries.at(index)

    if (!query) {
      return
    }

    explain(query)
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          `flex h-full items-center justify-between gap-2 border-y px-2 py-1 pr-6`
        )}
      >
        <div className="flex flex-1 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                className="focus:outline-none!"
                checked={isChecked}
                onCheckedChange={() => onCheckedChange()}
              />
              Query {queryNumber}
            </label>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="focus:outline-none!"
                    onClick={() => onSave()}
                  />
                }
              >
                <HugeiconsIcon icon={SaveIcon} strokeWidth={2} />
              </TooltipTrigger>
              <TooltipContent>Save</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <CopyButton
                    variant="ghost"
                    size="icon-xs"
                    className="focus:outline-none!"
                    text={getQuery}
                  />
                }
              />
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mx-1 h-4!" />
            {Array.from({ length: queriesLength }).map((_, idx) => {
              const key = `query-run-${connectionResource.id}-${lineNumber}-${idx}`
              return (
                <Fragment key={key}>
                  {CONNECTION_TYPES_WITH_EXPLAIN.includes(connectionType) && (
                    <Popover open={explainOpen} onOpenChange={setExplainOpen}>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <PopoverTrigger
                              render={
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  className="focus:outline-none!"
                                  disabled={isFetching || isExplaining}
                                  onClick={() => handleExplain(idx)}
                                />
                              }
                            />
                          }
                        >
                          <LoadingContent loading={isExplaining}>
                            <ContentSwitch
                              active={isExplaining}
                              activeContent={
                                <HugeiconsIcon
                                  icon={Tick02Icon}
                                  strokeWidth={2}
                                  className="text-success"
                                />
                              }
                            >
                              <HugeiconsIcon
                                icon={HelpCircleIcon}
                                strokeWidth={2}
                              />
                            </ContentSwitch>
                          </LoadingContent>
                        </TooltipTrigger>
                        <TooltipContent>Explain</TooltipContent>
                      </Tooltip>
                      <PopoverContent
                        className="max-h-100 w-auto max-w-150 overflow-auto"
                        side="top"
                      >
                        {isExplainError && (
                          <div className="text-destructive text-xs">
                            {explainError instanceof Error
                              ? explainError.message
                              : String(explainError)}
                          </div>
                        )}
                        {isExplainSuccess && (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                EXPLAIN
                              </span>
                              <Separator
                                orientation="vertical"
                                className="h-3!"
                              />
                              <span className="text-muted-foreground text-xs">
                                {explainData.rows.length}{' '}
                                {explainData.rows.length === 1 ? 'row' : 'rows'}
                              </span>
                              <Separator
                                orientation="vertical"
                                className="h-3!"
                              />
                              <span className="text-muted-foreground text-xs">
                                {explainData.duration.toFixed(0)}
                                ms
                              </span>
                            </div>
                            <Separator className="my-2" />
                            <div className="overflow-auto font-mono text-xs whitespace-pre">
                              {explainData.rows
                                .map((row) => Object.values(row).join('\t'))
                                .join('\n')}
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
                    Run {queriesLength === 1 ? '' : idx + 1}
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
