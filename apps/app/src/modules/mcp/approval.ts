import { silently, tryCatchAsync } from '@tamery/shared/utils'
import { createStore } from 'seitu'

import type { Connection } from '~/core/connection/sync'
import type { ResultSet } from '~/core/queries/connection/custom'
import { estimateQuery } from '~/core/queries/connection/estimate'
import { previewQuery } from '~/core/queries/connection/preview'
import type { QueryParams } from '~/core/runtime/query'
import { cancelQuery } from '~/core/runtime/query'
import { posthog } from '~/lib/posthog'

export const PREVIEW_BUDGET_MS = 3000

export type Impact =
  | { state: 'checking' }
  | { state: 'unavailable' }
  | { state: 'tooSlow' }
  | { error: string; state: 'failed' }
  | { sets: ResultSet[]; state: 'checked' }

interface Approval {
  connection: Connection
  decide: (approved: boolean) => void
  estimate?: number
  id: string
  impact: Impact
  sql: string
}

const store = createStore<{ pending: Approval[] }>({ pending: [] })

const update = (
  id: string,
  change: Partial<Pick<Approval, 'estimate' | 'impact'>>
) =>
  store.set(({ pending }) => ({
    pending: pending.map((item) =>
      item.id === id ? { ...item, ...change } : item
    ),
  }))

/** Resolves once the user approves the statement; rejects when they decline or the agent stops waiting. */
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
  const previewing = new AbortController()
  const previewSignal = AbortSignal.any([signal, previewing.signal])
  const estimate = estimateQuery(sql, connection.type, previewSignal)
  const preview = previewQuery(sql, connection.type, previewSignal)
  let checking = !!(estimate ?? preview)
  const stopChecking = () => {
    if (!checking) {
      return
    }
    previewing.abort()
    for (const queryId of [
      ...(estimate?.queryIds ?? []),
      ...(preview?.queryIds ?? []),
    ]) {
      void silently(() => cancelQuery(params, queryId))
    }
  }
  const check = async () => {
    if (estimate) {
      const { data: rows } = await tryCatchAsync(() => estimate.run(params))
      if (rows !== null) {
        update(id, { estimate: rows })
      }
    }
    if (!preview || previewSignal.aborted) {
      return
    }
    let tooSlow = false
    const budget = setTimeout(() => {
      tooSlow = true
      stopChecking()
    }, PREVIEW_BUDGET_MS)
    try {
      update(id, {
        impact: { sets: await preview.run(params), state: 'checked' },
      })
    } catch (error) {
      update(id, {
        impact: tooSlow
          ? { state: 'tooSlow' }
          : {
              error: error instanceof Error ? error.message : String(error),
              state: 'failed',
            },
      })
    } finally {
      clearTimeout(budget)
    }
  }
  const checked = (async () => {
    try {
      await check()
    } finally {
      checking = false
    }
  })()

  const decision = Promise.withResolvers<boolean>()
  signal.addEventListener(
    'abort',
    () => decision.reject(new Error('The agent stopped waiting.')),
    { once: true }
  )
  store.set(({ pending }) => ({
    pending: [
      ...pending,
      {
        connection,
        decide: decision.resolve,
        id,
        impact: { state: preview ? 'checking' : 'unavailable' },
        sql,
      },
    ],
  }))

  try {
    const approved = await decision.promise
    posthog.capture('mcp_write_reviewed', {
      approved,
      connection_type: connection.type,
      previewed: !!preview,
    })
    if (!approved) {
      throw new Error('The user declined to run this statement.')
    }
  } finally {
    store.set(({ pending }) => ({
      pending: pending.filter((item) => item.id !== id),
    }))
    stopChecking()
    // The pool holds one connection: the approved statement must not start before the preview has rolled back.
    await checked
  }
}

export const approval = { request, store }
