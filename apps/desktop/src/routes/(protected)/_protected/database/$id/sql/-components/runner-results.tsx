import { Button } from '@conar/ui/components/button'
import { RiLoader4Line, RiStopLine } from '@remixicon/react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-store'
import { queryClient } from '~/main'
import { Route } from '..'
import { pageStore } from '../-lib'
import { runnerQueryOptions } from './runner-editor'
import { RunnerResultsTable } from './runner-results-table'

export function RunnerResults() {
  const { database } = Route.useLoaderData()
  const query = useStore(pageStore, state => state.query)

  const { data: results, fetchStatus: queryStatus } = useQuery(runnerQueryOptions({ database, query }))

  function handleStop() {
    queryClient.cancelQueries(runnerQueryOptions({ database, query }))
  }

  if (queryStatus === 'fetching') {
    return (
      <div className="h-full flex flex-col gap-2 items-center justify-center">
        <RiLoader4Line className="size-6 text-primary animate-spin" />
        <p className="text-center text-foreground">Running query...</p>
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
      <RunnerResultsTable
        data={results}
        columns={Object.keys(results[0]!).map(key => ({ id: key }))}
      />
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
