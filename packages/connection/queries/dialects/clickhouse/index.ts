import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { cancel } from '../../cancellation'
import { registerTransaction, transactionQueries } from '../../transactions'
import { wrapClickhouseError } from './error'
import { runQuery } from './run'

const emptyAsync = async () => {
  /* empty */
}

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(
    ({
      connectionString,
      ownerId,
    }: {
      connectionString: string
      ownerId?: string
    }) => {
      const txId = registerTransaction(
        {
          commit: emptyAsync,
          execute: (q, _values, options) =>
            query.execute({ connectionString, query: q, ...options }),
          release: emptyAsync,
          rollback: emptyAsync,
        },
        ownerId
      )

      return Promise.resolve({ txId })
    }
  ),

  cancel,
  execute: wrapClickhouseError(runQuery),
} satisfies QueryExecutor
