import { RiChatAiLine, RiStopLine, RiVipCrownLine } from '@remixicon/react'
import { Button } from '@tamery/ui/components/button'
import { Spinner } from '@tamery/ui/components/spinner'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@tamery/ui/components/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tamery/ui/components/tooltip'
import { cn } from '@tamery/ui/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'

import { Link } from '~/components/link'
import { Monaco } from '~/components/monaco'
import { useSubscription } from '~/entities/user/hooks/use-subscription'
import { queryClient } from '~/main'
import { setIsSubscriptionDialogOpen } from '~/store'
import { formatSql } from '~/utils/formatter'

import { runnerQueryOptions } from '.'
import { toggleChat, useRunnerPageStore, useRunnerTab } from '../../-lib/store'
import { RunnerResultsTable } from './runner-results-table'

const { useRouteContext, useSearch } = getRouteApi(
  '/_protected/connection/$resourceId/$tabId'
)

const RunnerResultContent = ({
  chatId,
  connectionResourceId,
  connectionType,
  data,
  duration,
  endLineNumber,
  error,
  startLineNumber,
  subscription,
}: {
  chatId?: string
  connectionResourceId: string
  connectionType: Parameters<typeof formatSql>[1]
  data?: Record<string, unknown>[] | null
  duration: number
  endLineNumber: number
  error?: string | null
  startLineNumber: number
  subscription: unknown
}) => {
  const store = useRunnerPageStore()
  const { tabId } = useRunnerTab()

  if (error) {
    return (
      <div className="mx-auto flex h-full max-w-2/3 flex-col items-center justify-center gap-2">
        Error executing query
        <div
          data-mask
          className="bg-destructive/10 text-destructive mb-2 max-h-1/2 max-w-full overflow-auto rounded-sm px-2 py-1 font-mono text-xs text-balance"
        >
          {error}
        </div>
        {subscription ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleChat(store, true)}
            render={
              <Link
                to="/connection/$resourceId/$tabId"
                params={{ resourceId: connectionResourceId, tabId }}
                search={{
                  chatId,
                  error: [
                    `Fix the following SQL error by correcting the SQL query on the lines ${startLineNumber} - ${endLineNumber}:`,
                    error,
                  ].join('\n'),
                }}
              />
            }
          >
            <RiChatAiLine />
            Fix in chat
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSubscriptionDialogOpen(true)}
          >
            Fix in chat
            <RiVipCrownLine className="size-4" />
          </Button>
        )}
      </div>
    )
  }

  const firstRow = data?.[0]
  if (!data || !firstRow || data.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        No data returned{' '}
        <span className="text-muted-foreground">
          ({duration.toFixed(0)}
          ms)
        </span>
      </div>
    )
  }

  return (
    <RunnerResultsTable
      data={data}
      columns={Object.keys(firstRow).map((key) => ({ id: key }))}
      duration={duration}
      connectionType={connectionType}
    />
  )
}

export const RunnerResults = () => {
  const { chatId } = useSearch()
  const { subscription } = useSubscription()
  const { connection, connectionResource } = useRouteContext()
  const { tabId } = useRunnerTab()
  const { data: results, fetchStatus: queryStatus } = useQuery(
    runnerQueryOptions({ connectionResource, tabId })
  )

  const handleStop = () => {
    queryClient.cancelQueries(runnerQueryOptions({ connectionResource, tabId }))
  }

  if (queryStatus === 'fetching') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <Spinner className="text-primary size-6" />
        <p className="text-foreground text-center">Running...</p>
        <Button size="xs" variant="secondary" onClick={handleStop}>
          <RiStopLine className="size-3" />
          Stop
        </Button>
      </div>
    )
  }

  if (results && results.length > 0) {
    return (
      <Tabs defaultValue="table-0" className="size-full gap-0">
        <div className="no-scrollbar scroll-fade-x h-8 w-full min-w-0 shrink-0 overflow-x-auto">
          <TabsList className="bg-muted/50 w-max max-w-none rounded-none">
            {results.map(({ query, error }, index) => (
              <TabsTrigger
                // oxlint-disable-next-line react/no-array-index-key
                key={`query-${index}`}
                value={`table-${index}`}
                className="h-8"
              >
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span
                        className={cn(
                          `flex w-full items-center justify-center gap-1`,
                          error && `text-destructive`
                        )}
                      />
                    }
                  >
                    Result {results.length > 1 ? index + 1 : ''}
                  </TooltipTrigger>
                  <TooltipContent
                    data-mask
                    sideOffset={8}
                    className="w-lg p-0 pl-2"
                  >
                    <Monaco
                      value={formatSql(query, connection.type)}
                      language="sql"
                      options={{
                        scrollBeyondLastLine: false,
                        readOnly: true,
                        lineDecorationsWidth: 0,
                        lineNumbers: 'off',
                        folding: false,
                      }}
                      className="h-48 max-h-[50vh]"
                    />
                  </TooltipContent>
                </Tooltip>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {results.map(
          (
            { data, error, startLineNumber, endLineNumber, duration },
            index
          ) => (
            <TabsContent
              key={`result-${data?.length ?? 'error'}-${startLineNumber}`}
              value={`table-${index}`}
              className="h-[calc(100%-(--spacing(8)))]"
            >
              <RunnerResultContent
                chatId={chatId}
                connectionResourceId={connectionResource.id}
                connectionType={connection.type}
                data={data}
                duration={duration}
                endLineNumber={endLineNumber}
                error={error}
                startLineNumber={startLineNumber}
                subscription={subscription}
              />
            </TabsContent>
          )
        )}
      </Tabs>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <p className="text-center">No results to display</p>
      <p className="text-muted-foreground mt-1 text-center text-xs">
        Write and run a <span className="font-mono">SELECT</span> query above to
        see results here
      </p>
    </div>
  )
}
