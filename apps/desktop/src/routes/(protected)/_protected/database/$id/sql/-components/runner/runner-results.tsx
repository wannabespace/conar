import { Button } from '@conar/ui/components/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@conar/ui/components/tooltip'
import { cn } from '@conar/ui/lib/utils'
import { RiChatAiLine, RiLoader4Line, RiStopLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Monaco } from '~/components/monaco'
import { formatSql } from '~/lib/formatter'
import { queryClient } from '~/main'
import { runnerQueryOptions } from '.'
import { Route } from '../..'
import { RunnerResultsTable } from './runner-results-table'

export function RunnerResults() {
  const { chatId } = Route.useSearch()
  const { database } = Route.useRouteContext()
  const { data: results, fetchStatus: queryStatus } = useQuery(runnerQueryOptions({ database }))

  function handleStop() {
    queryClient.cancelQueries(runnerQueryOptions({ database }))
  }

  if (queryStatus === 'fetching') {
    return (
      <div className="h-full flex flex-col gap-2 items-center justify-center">
        <RiLoader4Line className="size-6 text-primary animate-spin" />
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
        <TabsList className="rounded-none w-full bg-muted/50">
          {results.map(({ query, error }, index) => (
            <TabsTrigger
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              value={`table-${index}`}
              className="h-8"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn('flex items-center justify-center gap-1 w-full', error && 'text-destructive')}>
                    Result
                    {' '}
                    {results.length > 1 ? index + 1 : ''}
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={8} className="p-0 pl-2 w-lg">
                  <Monaco
                    value={formatSql(query, database.type)}
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
        {results.map(({ data, error, startLineNumber, endLineNumber }, index) => (
          <TabsContent
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            value={`table-${index}`}
            className={results.length > 1 ? 'h-[calc(100%-(--spacing(8)))]' : 'h-full'}
          >
            {error
              ? (
                  <div className="h-full flex flex-col gap-2 items-center justify-center">
                    Error executing query
                    <pre className="bg-red-50 text-red-700 py-1 px-2 mb-2 rounded text-xs font-mono overflow-x-auto dark:bg-red-950 dark:text-red-300">
                      {error}
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link
                        to="/database/$id/sql"
                        params={{ id: database.id }}
                        search={{
                          chatId,
                          error: [
                            `Fix the following SQL error by correcting the SQL query on the lines ${startLineNumber} - ${endLineNumber}:`,
                            error,
                          ].join('\n'),
                        }}
                      >
                        <RiChatAiLine />
                        Fix in chat
                      </Link>
                    </Button>
                  </div>
                )
              : !data || data.length === 0
                  ? (
                      <div className="h-full flex flex-col gap-2 items-center justify-center">
                        No data returned
                      </div>
                    )
                  : (
                      <RunnerResultsTable
                        data={data}
                        columns={Object.keys(data[0]!).map(key => ({ id: key }))}
                      />
                    )}
          </TabsContent>
        ))}
      </Tabs>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <p className="text-center">No results to display</p>
      <p className="text-xs text-muted-foreground mt-1 text-center">
        Write and run a
        {' '}
        <span className="font-mono">SELECT</span>
        {' '}
        query above to see results here
      </p>
    </div>
  )
}
