import { tryParseJson } from '@tamery/shared/utils'

import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { cancel } from '../../cancellation'
import { registerTransaction, transactionQueries } from '../../transactions'
import { runQuery } from './run'

const noop = async () => {
  /* empty */
}

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(({ connectionString, ownerId }) => {
    const txId = registerTransaction(
      {
        commit: noop,
        execute: (sql, _values, options) =>
          query.execute({ connectionString, query: sql, ...options }),
        release: noop,
        rollback: noop,
      },
      ownerId
    )
    return Promise.resolve({ txId })
  }),

  cancel,

  execute: async (args) => {
    try {
      return await handleQueryError(runQuery)(args)
    } catch (error) {
      const message =
        error instanceof Error &&
        tryParseJson<{ message?: string }>(error.message)?.message
      if (message) {
        throw new Error(message, { cause: error })
      }
      throw error
    }
  },
} satisfies QueryExecutor
