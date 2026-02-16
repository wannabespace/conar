import { Button } from '@conar/ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiChatAiLine, RiLoader4Line, RiStopLine, RiVipCrownLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Monaco } from '~/components/monaco'
import { toggleChat } from '~/entities/connection/store'
import { useSubscription } from '~/entities/user/hooks/use-subscription'
import { formatSql } from '~/lib/formatter'
import { queryClient } from '~/main'
import { setIsSubscriptionDialogOpen } from '~/store'
import { runnerQueryOptions } from '.'
import { Route } from '../..'
import { RunnerResultsTable } from './runner-results-table'

export function RunnerResults() {
  const { chatId } = Route.useSearch()
  const { subscription } = useSubscription()
  const { connection } = Route.useRouteContext()
  const { data: results, fetchStatus: queryStatus } = useQuery(runnerQueryOptions({ connection }))

  function handleStop() {
    queryClient.cancelQueries(runnerQueryOptions({ connection }))
  }

  if (queryStatus === 'fetching') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <RiLoader4Line className="size-6 animate-spin text-primary" />
        <p className="text-center text-foreground">Running...</p>
        <Button
          size="xs"
          variant="secondary"
          onClick={handleStop}
        >
          <RiStopLine className="size-3" />
          Stop
        </Button>
      </div>
    )
  }

  if (results && results.length > 0) {
    return (
      <Tabs defaultValue="table-0" className="size-full gap-0">
        <TabsList className="w-full rounded-none bg-muted/50">
          {results.map(({ query, error }, index) => (
            <TabsTrigger
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              value={`table-${index}`}
              className="h-8"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(`
                    flex w-full items-center justify-center gap-1
                  `, error && `text-destructive`)}
                  >
                    Result
                    {' '}
                    {results.length > 1 ? index + 1 : ''}
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="w-lg p-0 pl-2">
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
        {results.map(({ data, error, startLineNumber, endLineNumber, duration }, index) => (
          <TabsContent
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            value={`table-${index}`}
            className="h-[calc(100%-(--spacing(8)))]"
          >
            {error
              ? (
                  <div className={`
                    mx-auto flex h-full max-w-2/3 flex-col items-center
                    justify-center gap-2
                  `}
                  >
                    Error executing query
                    <div className={`
                      mb-2 max-h-1/2 max-w-full overflow-auto rounded-sm
                      bg-red-50 px-2 py-1 font-mono text-xs text-balance
                      text-red-700
                      dark:bg-red-950 dark:text-red-300
                    `}
                    >
                      {error}
                    </div>
                    {subscription
                      ? (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <Link
                              to="/database/$id/sql"
                              params={{ id: connection.id }}
                              search={{
                                chatId,
                                error: [
                                  `Fix the following SQL error by correcting the SQL query on the lines ${startLineNumber} - ${endLineNumber}:`,
                                  error,
                                ].join('\n'),
                              }}
                              onClick={() => toggleChat(connection.id, true)}
                            >
                              <RiChatAiLine />
                              Fix in chat
                            </Link>
                          </Button>
                        )
                      : (
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
              : !data || !data[0] || data.length === 0
                  ? (
                      <div className={`
                        flex h-full flex-col items-center justify-center gap-2
                      `}
                      >
                        No data returned
                      </div>
                    )
                  : (
                      <RunnerResultsTable
                        data={data}
                        columns={Object.keys(data[0]!).map(key => ({ id: key }))}
                        duration={duration}
                      />
                    )}
          </TabsContent>
        ))}
      </Tabs>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <p className="text-center">No results to display</p>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Write and run a
        {' '}
        <span className="font-mono">SELECT</span>
        {' '}
        query above to see results here
      </p>
    </div>
  )
}
