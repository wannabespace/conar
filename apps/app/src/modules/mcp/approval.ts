import { silently, tryCatchAsync } from '@tamery/shared/utils'
import { createStore } from 'seitu'

import type { Connection } from '~/core/connection/sync'
import { estimateQuery } from '~/core/queries/connection/estimate'
import type { QueryParams } from '~/core/runtime/query'
import { cancelQuery } from '~/core/runtime/query'
import { posthog } from '~/lib/posthog'

interface Approval {
  connection: Connection
  decide: (approved: boolean) => void
  estimate?: number
  id: string
  sql: string
}

const ESTIMATE_BUDGET_MS = 3000

const store = createStore<{ pending: Approval[] }>({ pending: [] })

/** Resolves once the user approves the statement; rejects when they decline or the agent stops waiting. Nothing the agent sent runs before that. */
const request = async ({
  connection,
  params,
  signal,
  sql,
}: {
  connection: Connection
  params: QueryParams
  signal: AbortSignal
  sql: string
}) => {
  signal.throwIfAborted()
  const id = crypto.randomUUID()
  const estimating = new AbortController()
  const estimate = estimateQuery(
    sql,
    connection.type,
    AbortSignal.any([signal, estimating.signal])
  )
  let isEstimating = !!estimate
  const stopEstimating = () => {
    if (!isEstimating) {
      return
    }
    estimating.abort()
    for (const queryId of estimate?.queryIds ?? []) {
      void silently(() => cancelQuery(params, queryId))
    }
  }
  // A lock (a migration's, say) can stall EXPLAIN, and it holds the pool's only connection while the dialog is open.
  const budget = setTimeout(stopEstimating, ESTIMATE_BUDGET_MS)
  const estimated = (async () => {
    if (!estimate) {
      return
    }
    const { data: rows } = await tryCatchAsync(() => estimate.run(params))
    isEstimating = false
    clearTimeout(budget)
    if (rows !== null) {
      store.set(({ pending }) => ({
        pending: pending.map((item) =>
          item.id === id ? { ...item, estimate: rows } : item
        ),
      }))
    }
  })()

  const decision = Promise.withResolvers<boolean>()
  signal.addEventListener(
    'abort',
    () => decision.reject(new Error('The agent stopped waiting.')),
    { once: true }
  )
  store.set(({ pending }) => ({
    pending: [...pending, { connection, decide: decision.resolve, id, sql }],
  }))
  void window.electron?.mcp.notify({
    body: 'Review the statement in Tamery to run or decline it.',
    title: `An agent wants to change ${connection.name}`,
  })

  try {
    const approved = await decision.promise
    posthog.capture('mcp_write_reviewed', {
      approved,
      connection_type: connection.type,
      estimated: !!estimate,
    })
    if (!approved) {
      throw new Error('The user declined to run this statement.')
    }
  } finally {
    store.set(({ pending }) => ({
      pending: pending.filter((item) => item.id !== id),
    }))
    clearTimeout(budget)
    stopEstimating()
    // The pool holds one connection: the approved statement must not start before the estimate has rolled back.
    await estimated
  }
}

export const approval = { request, store }
