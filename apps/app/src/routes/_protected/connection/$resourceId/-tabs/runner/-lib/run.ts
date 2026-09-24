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
import {
  customQuery,
  resultSetType,
} from '~/entities/connection/queries/connection/custom'
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

/** A statement to run and where its source sat in the editor when the run started. */
export interface RunnerStatement {
  /** What is sent — the source, or a wrapped form of it such as `EXPLAIN …`. */
  text: string
  source: string
  start: number
  end: number
}

/** One result set of a statement; a statement answering with several sets yields one each. */
export interface RunnerResult extends Omit<RunnerStatement, 'text'> {
  duration: number
  set: ResultSet | null
  error: string | null
  /** Stop came before this statement finished — cancelled mid-flight or never started. */
  stopped: boolean
  /** Not run yet: every statement of a run is listed from its start, filled in as it finishes. */
  pending: boolean
}

export interface RunnerRun {
  /** Tells one run from the next, so a view keyed to it resets. */
  id: string
  /** One entry per statement from the start (pending), replaced as each finishes. */
  results: RunnerResult[]
  running: boolean
}

/** Rows the grid keeps per result: past this the page slows and the proxy's answer grows to tens of MB. */
const MAX_RESULT_ROWS = 10_000

/** Observes the last run; `runStatements` is the only writer. */
export const runnerResultsOptions = ({ resourceId, tabId }: RunnerTab) =>
  queryOptions<RunnerRun>({
    // Results outlive the view: switching tabs must not drop them. Closing the tab removes them.
    gcTime: Number.POSITIVE_INFINITY,
    queryFn: skipToken,
    queryKey: ['query-runner', resourceId, tabId],
  })

/** The in-flight run per tab, so Stop and closing the tab reach it. */
const runs = new Map<string, AbortController>()
/** Tabs whose results are cached, each watched until it closes. */
const watchedTabs = new Set<string>()
const runKey = ({ resourceId, tabId }: RunnerTab) => `${resourceId}\n${tabId}`

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

/** Closing the tab stops its run and drops its results; the database work would otherwise outlive the UI. */
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

const queryFor = (text: string, connectionType: ConnectionType) => {
  const dialect = dialects[connectionType]
  const transaction = transactionParts(text, dialect)
  if (transaction) {
    return transactionQuery(transaction)
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

/** Stop cancels the statement on the server too — aborting the request alone leaves it running. */
const runOne = async (
  params: QueryParams,
  statement: RunnerStatement,
  signal: AbortSignal
): Promise<RunnerResult[]> => {
  const { end, source, start } = statement
  const startedAt = performance.now()
  let cancel = noop
  try {
    const { queryIds, run } = queryFor(statement.text, params.type)
    cancel = () => {
      for (const queryId of queryIds) {
        void silently(() => cancelQuery(params, queryId))
      }
    }
    signal.addEventListener('abort', cancel, { once: true })
    // The queries check their sets themselves but declare no `type`, which would opt a write into retries.
    const sets = resultSetType.array().assert(await run(params))
    const duration = performance.now() - startedAt
    return (sets.length > 0 ? sets : [null]).map((set) => ({
      duration,
      end,
      error: null,
      set,
      pending: false,
      source,
      start,
      stopped: false,
    }))
  } catch (error) {
    return [
      {
        duration: performance.now() - startedAt,
        end,
        error: signal.aborted ? null : messageOf(error),
        set: null,
        pending: false,
        source,
        start,
        stopped: signal.aborted,
      },
    ]
  } finally {
    signal.removeEventListener('abort', cancel)
  }
}

const stoppedResult = (statement: RunnerStatement): RunnerResult => ({
  duration: 0,
  end: statement.end,
  error: null,
  set: null,
  pending: false,
  source: statement.source,
  start: statement.start,
  stopped: true,
})

const pendingResult = (statement: RunnerStatement): RunnerResult => ({
  ...stoppedResult(statement),
  pending: true,
  stopped: false,
})

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
  // One slot per statement, so the result tabs are all there from the first frame.
  const slots = statements.map((statement) => [pendingResult(statement)])
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
      { ...stoppedResult(first), error: messageOf(error), stopped: false },
    ])
  }
  const ran: Parameters<typeof runHistory.add>[1] = []
  if (params) {
    for (const [index, statement] of statements.entries()) {
      if (signal.aborted) {
        slots[index] = [stoppedResult(statement)]
        continue
      }
      const ranAt = Date.now()
      // Sequential by design: statements run in order on one connection.
      // oxlint-disable-next-line no-await-in-loop
      const results = await runOne(params, statement, signal)
      slots[index] = results
      const [head] = results
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
  const failed = run.results.filter((result) => result.error !== null).length
  if (signal.aborted) {
    toast.info('Run stopped')
  } else if (failed > 0 && statements.length > 1) {
    toast.warning(`${failed} of ${statements.length} statements failed`)
  }
}

export const stopRun = (tab: RunnerTab) => runs.get(runKey(tab))?.abort()
