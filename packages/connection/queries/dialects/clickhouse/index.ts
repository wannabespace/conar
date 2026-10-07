import { noop, tryParseJson } from '@tamery/shared/utils'

import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { cancel } from '../../cancellation'
import { registerTransaction, transactionQueries } from '../../transactions'
import { runQuery } from './run'

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(
    ({ accessMode, connectionString, ownerId }) => {
      const txId = registerTransaction(
        {
          commit: noop,
          execute: (sql, _values, options) =>
            query.execute({
              connectionString,
              query: sql,
              readOnly: accessMode === 'read only',
              ...options,
            }),
          release: noop,
          rollback: noop,
        },
        ownerId
      )
      return Promise.resolve({ txId })
    }
  ),

  cancel,

  execute: async (args: Parameters<typeof runQuery>[0]) => {
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
