import type { QueryExecutor } from '.'
import { handleQueryError } from '.'

/** Keyed by connection too, so cancelling needs access to the connection that runs the query, not just its id. */
const running = new Map<string, () => Promise<unknown>>()

const key = (connectionString: string, queryId: string) =>
  `${connectionString}\n${queryId}`

export const cancellable = async <T>(
  {
    cancel,
    connectionString,
    queryId,
  }: {
    cancel: () => Promise<unknown>
    connectionString: string
    queryId?: string
  },
  run: () => Promise<T>
) => {
  if (!queryId) {
    return run()
  }
  running.set(key(connectionString, queryId), cancel)
  try {
    return await run()
  } finally {
    running.delete(key(connectionString, queryId))
  }
}

export const cancellationQueries = {
  cancel: handleQueryError(
    async ({
      connectionString,
      queryId,
    }: {
      connectionString: string
      queryId: string
    }) => {
      await running.get(key(connectionString, queryId))?.()
    }
  ),
} satisfies Pick<QueryExecutor, 'cancel'>
