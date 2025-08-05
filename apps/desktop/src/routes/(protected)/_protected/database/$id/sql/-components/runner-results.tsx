import { Tabs, TabsContent, TabsList, TabsTrigger } from '@conar/ui/components/tabs'
import { RiLoader4Line } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { Route } from '..'
import { pageStore } from '../-lib'
import { runnerQueryOptions } from './runner-editor'
import { RunnerResultsTable } from './runner-results-table'

export function RunnerResults() {
  const { id } = Route.useParams()
  const { database } = Route.useLoaderData()
  const query = useStore(pageStore, state => state.query)

  const { data: results, fetchStatus: queryStatus } = useQuery(
    runnerQueryOptions({ id, database, query }),
  )

  if (queryStatus === 'fetching') {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <RiLoader4Line className="size-6 text-muted-foreground mb-2 animate-spin" />
        <p className="text-sm text-center">Running query...</p>
      </div>
    )
  }

  if (Array.isArray(results) && results.length > 0) {
    return (
      <Tabs defaultValue="table-0" className="size-full gap-0">
        {results.length > 1 && (
          <TabsList className="rounded-none w-full bg-muted/20">
            {results.map((_, i) => (
              <TabsTrigger
                key={i}
                value={`table-${i}`}
                className="h-9"
              >
                Result
                {' '}
                {i + 1}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
        {results.map((r, i) => (
          <TabsContent className="h-[calc(100%-theme(spacing.9))]" key={i} value={`table-${i}`}>
            <RunnerResultsTable result={r.rows} columns={r.columns} />
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
