import type { Dialect } from '@tamery/shared/enums/connection-type'
import { silently } from '@tamery/shared/utils'
import type { Statement } from '@tamery/sql'
import {
  closesTransaction,
  dialects,
  leavesTransactionOpen,
  splitStatements,
  statementsFromTokens,
  unwrapTransaction,
} from '@tamery/sql'
import { memoize } from 'memoza'
import { createStore } from 'seitu'

import { refreshAfterRun } from '~/core/connection/refresh-after-run'
import type { ConnectionResource } from '~/core/connection/sync'
import type { ResultSet } from '~/core/queries/connection/custom'
import { customQuery } from '~/core/queries/connection/custom'
import { statementQuery } from '~/core/queries/connection/statement'
import { createDialectProvider } from '~/core/runtime/dialects/driver'
import type { QueryParams } from '~/core/runtime/query'
import { posthog } from '~/lib/posthog'

import type { RunnerTab } from './store'

interface OpenTransaction {
  connectionResource: ConnectionResource
  params: QueryParams
  ran: string[]
  txId: string
}

type CloseReason = 'commit' | 'rollback' | 'statement' | 'tab_closed'

const state = memoize((_tab: RunnerTab) =>
  createStore<OpenTransaction | null>(null)
)

const close = async (tab: RunnerTab, reason: CloseReason) => {
  const open = state(tab).get()
  if (!open) {
    return
  }
  state(tab).set(null)
  const { connectionResource, params, ran, txId } = open
  posthog.capture('transaction_close', { reason, type: params.dialect })
  const provider = createDialectProvider(params.dialect, params)
  try {
    await (reason === 'commit'
      ? provider.commitTransaction({ txId })
      : provider.rollbackTransaction({ txId }))
  } finally {
    refreshAfterRun(connectionResource, params.dialect, ran.join(';\n'))
  }
}

/** The statement's SQL runs verbatim: a `BEGIN` left open moves the tab onto a session of its own until a `COMMIT` or `ROLLBACK` ends it. */
const run = async ({
  connectionResource,
  params,
  tab,
  text,
}: {
  connectionResource: ConnectionResource
  params: QueryParams
  tab: RunnerTab
  text: string
}): Promise<ResultSet[]> => {
  const store = state(tab)
  const dialect = dialects[params.dialect]
  const opening =
    !store.get() && dialect.transactions && leavesTransactionOpen(text, dialect)
  if (opening) {
    const { txId } = await createDialectProvider(
      params.dialect,
      params
    ).openSession()
    store.set({ connectionResource, params, ran: [], txId })
    posthog.capture('transaction_open', { type: params.dialect })
  }
  const open = store.get()
  if (!open) {
    return statementQuery(text, params.dialect).run(params)
  }
  const sets: ResultSet[] = []
  try {
    // A `BEGIN … COMMIT` group goes one statement at a time: MySQL rejects several in one string.
    for (const { text: part } of splitStatements(text, dialect, {
      groupTransactions: false,
    })) {
      // Sequential by design: the statements run in order on the session's connection.
      // oxlint-disable-next-line no-await-in-loop
      const partSets = await customQuery({ query: part }).run({
        ...params,
        txId: open.txId,
      })
      sets.push(...partSets)
      store.set(
        (current) => current && { ...current, ran: [...current.ran, part] }
      )
      if (closesTransaction(part, dialect)) {
        // The statement already ended it: this rollback only releases the connection, and SQL Server rejects it.
        // oxlint-disable-next-line no-await-in-loop
        await silently(() => close(tab, 'statement'))
      }
    }
  } catch (error) {
    if (opening) {
      await silently(() => close(tab, 'rollback'))
    }
    throw error
  }
  return sets
}

/** The statement of a `BEGIN … COMMIT` block whose turn it is: the opener until the tab has a transaction open, then the one after the last that ran in it. */
const step = ({
  dialect,
  statement,
  tab,
  text,
}: {
  dialect: Dialect
  statement: Statement
  tab: RunnerTab
  text: string
}) => {
  const spec = dialects[dialect]
  if (!unwrapTransaction(statement.text, spec)) {
    return statement
  }
  const steps = statementsFromTokens(text, statement.tokens, spec, {
    groupTransactions: false,
  })
  const ran = state(tab).get()?.ran.length ?? 0
  return steps[Math.min(ran, steps.length - 1)] ?? statement
}

export const runnerTransaction = { close, run, state, step }
