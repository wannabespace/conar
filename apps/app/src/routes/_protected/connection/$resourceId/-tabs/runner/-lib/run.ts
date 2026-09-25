import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { noop, silently, tryCatchAsync } from '@tamery/shared/utils'
import {
  changesSchema,
  dialects,
  leavesTransactionOpen,
  transactionParts,
} from '@tamery/sql'
import { queryOptions, skipToken } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ConnectionResource } from '~/entities/connection/core/sync'
import type { ResultSet } from '~/entities/connection/queries/connection/custom'
import { customQuery } from '~/entities/connection/queries/connection/custom'
import { transactionQuery } from '~/entities/connection/queries/connection/transaction'
import type { QueryParams } from '~/entities/connection/runtime/query'
import {
  cancelQuery,
  connectionResourceToQueryParams,
} from '~/entities/connection/runtime/query'
import { getConnectionResourceStore } from '~/entities/connection/store/stores'
import { queryClient } from '~/lib/query-client'

import { runHistory } from './history'
import type { RunnerTab } from './store'

export interface RunnerStatement {
  /** What is sent: the source, or a wrapped form of it such as `EXPLAIN …`. */
  text: string
  source: string
  start: number
  end: number
}

export interface RunnerResult extends Omit<RunnerStatement, 'text'> {
  duration: number
  set: ResultSet | null
  error: string | null
  stopped: boolean
  pending: boolean
}

export interface RunnerRun {
  id: string
  results: RunnerResult[]
  running: boolean
}

const MAX_RESULT_ROWS = 10_000

export const runnerResultsOptions = ({ resourceId, tabId }: RunnerTab) =>
  queryOptions<RunnerRun>({
    // Results outlive the view: switching tabs must not drop them. Closing the tab removes them.
    gcTime: Number.POSITIVE_INFINITY,
    queryFn: skipToken,
    queryKey: ['query-runner', resourceId, tabId],
  })

const runs = new Map<string, AbortController>()
const watchedTabs = new Set<string>()
const runKey = ({ resourceId, tabId }: RunnerTab) => `${resourceId}\n${tabId}`

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

const watchTab = (tab: RunnerTab) => {
  const key = runKey(tab)
  if (watchedTabs.has(key)) {
    return
  }
  watchedTabs.add(key)
  const unsubscribe = getConnectionResourceStore(tab.resourceId).subscribe(
    (state) => {
      if (state.tabs.some((item) => item.id === tab.tabId)) {
        return
      }
      runs.get(key)?.abort()
      queryClient.removeQueries({
        queryKey: runnerResultsOptions(tab).queryKey,
      })
      watchedTabs.delete(key)
      unsubscribe()
    }
  )
}

const queryFor = (
  text: string,
  connectionType: ConnectionType,
  signal: AbortSignal
) => {
  const dialect = dialects[connectionType]
  const transaction = transactionParts(text, dialect)
  if (transaction) {
    return transactionQuery(transaction, signal)
  }
  if (leavesTransactionOpen(text, dialect)) {
    throw new Error(
      dialect.transactions
        ? 'Run BEGIN together with its COMMIT or ROLLBACK. A transaction left open would hold the connection the rest of the app uses.'
        : 'This database has no transactions. Run the statements without BEGIN.'
    )
  }
  const single = customQuery({ query: text })
  return { queryIds: [single.queryId], run: single.run }
}

const resultOf = (
  statement: RunnerStatement,
  patch: Partial<RunnerResult> = {}
): RunnerResult => ({
  duration: 0,
  end: statement.end,
  error: null,
  pending: false,
  set: null,
  source: statement.source,
  start: statement.start,
  stopped: false,
  ...patch,
})

const runOne = async (
  params: QueryParams,
  statement: RunnerStatement,
  signal: AbortSignal
): Promise<RunnerResult[]> => {
  const startedAt = performance.now()
  let cancel = noop
  try {
    const { queryIds, run } = queryFor(statement.text, params.type, signal)
    cancel = () => {
      for (const queryId of queryIds) {
        void silently(() => cancelQuery(params, queryId))
      }
    }
    signal.addEventListener('abort', cancel, { once: true })
    const sets = await run(params)
    const duration = performance.now() - startedAt
    return (sets.length > 0 ? sets : [null]).map((set) =>
      resultOf(statement, { duration, set })
    )
  } catch (error) {
    return [
      resultOf(statement, {
        duration: performance.now() - startedAt,
        error: signal.aborted ? null : messageOf(error),
        stopped: signal.aborted,
      }),
    ]
  } finally {
    signal.removeEventListener('abort', cancel)
  }
}

export const runStatements = async ({
  connectionResource,
  statements,
  tabId,
}: {
  connectionResource: ConnectionResource
  statements: RunnerStatement[]
  tabId: string
}) => {
  const tab = { resourceId: connectionResource.id, tabId }
  const key = runKey(tab)
  const { queryKey } = runnerResultsOptions(tab)
  runs.get(key)?.abort()
  const controller = new AbortController()
  runs.set(key, controller)
  watchTab(tab)
  const { signal } = controller
  // A newer run on the tab owns its results; this one finishes quietly.
  const current = () => runs.get(key) === controller
  const run: RunnerRun = { id: crypto.randomUUID(), results: [], running: true }
  const slots = statements.map((statement) => [
    resultOf(statement, { pending: true }),
  ])
  const publish = () => {
    run.results = slots.flat()
    if (current()) {
      queryClient.setQueryData(queryKey, { ...run, results: [...run.results] })
    }
  }
  publish()

  const [first] = statements
  const { data: params, error } = await tryCatchAsync(async () => ({
    ...(await connectionResourceToQueryParams(connectionResource)),
    resultSets: { maxRows: MAX_RESULT_ROWS },
  }))
  if (error && first) {
    slots.splice(0, slots.length, [
      resultOf(first, { error: messageOf(error) }),
    ])
  }
  const ran: Parameters<typeof runHistory.add>[1] = []
  let failedAt: number | undefined
  if (params) {
    for (const [index, statement] of statements.entries()) {
      if (signal.aborted || failedAt !== undefined) {
        slots[index] = [resultOf(statement, { stopped: true })]
        continue
      }
      const ranAt = Date.now()
      // Sequential by design: statements run in order on one connection.
      // oxlint-disable-next-line no-await-in-loop
      const results = await runOne(params, statement, signal)
      slots[index] = results
      const [head] = results
      if (head?.error) {
        failedAt = index
      }
      if (head && !head.stopped) {
        ran.push({
          duration: head.duration,
          error: head.error,
          ranAt,
          sql: statement.source,
        })
      }
      publish()
    }
  }
  run.running = false
  publish()
  runHistory.add(connectionResource.id, ran)

  const connectionType = params?.type
  if (
    connectionType &&
    changesSchema(
      statements.map((statement) => statement.text).join(';\n'),
      dialects[connectionType]
    )
  ) {
    void queryClient.invalidateQueries({
      queryKey: ['connection-resource', connectionResource.id],
    })
  }

  if (!current()) {
    return
  }
  runs.delete(key)
  if (signal.aborted) {
    toast.info('Run stopped')
  } else if (failedAt !== undefined && failedAt < statements.length - 1) {
    toast.warning(
      `Statement ${failedAt + 1} of ${statements.length} failed — the rest did not run`
    )
  }
}

export const stopRun = (tab: RunnerTab) => runs.get(runKey(tab))?.abort()
