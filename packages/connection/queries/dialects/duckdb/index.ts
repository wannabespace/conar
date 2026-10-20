import { Provider } from '@tamery/shared/enums/connection-type'
import {
  endsTransaction,
  leavesTransactionOpen,
  splitStatements,
  unwrapTransaction,
} from '@tamery/sql'

import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { getProviderOfScheme } from '../../../connection-parts'
import { readConnectionString } from '../../../parse-connection-string'
import { cancel } from '../../cancellation'
import type { TxHandle } from '../../transactions'
import { registerTransaction, transactionQueries } from '../../transactions'
import { fileTransport } from './file'
import { quackTransport } from './quack'
import type { DuckdbTransaction, DuckdbTransport } from './run'
import { DUCKDB, runTimed } from './run'

/** Only an empty host opens a file, whatever the scheme says, so no server ever opens one on its own disk. */
const getTransport = (connectionString: string): DuckdbTransport => {
  const { host, scheme } = readConnectionString(connectionString)
  if (!host) {
    return fileTransport
  }
  if (getProviderOfScheme(scheme) !== Provider.Quack) {
    throw new Error(
      `Tamery reaches a DuckDB server only over Quack: its string starts with ${scheme}://, not quack://.`
    )
  }
  return quackTransport
}

const toHandle = ({ run, ...tx }: DuckdbTransaction): TxHandle => ({
  ...tx,
  execute: (sql, values, options) => runTimed(run, sql, values, options),
})

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(
    async ({ accessMode, connectionString, ownerId }) => ({
      txId: registerTransaction(
        toHandle(
          await getTransport(connectionString).transaction(
            connectionString,
            accessMode === 'read only'
          )
        ),
        ownerId
      ),
    })
  ),

  cancel,

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [], ...options }) => {
      const transport = getTransport(connectionString)
      if (!transport.openSession) {
        const block = unwrapTransaction(sql, DUCKDB)
        if (block) {
          const tx = await transport.transaction(connectionString, false)
          try {
            const answer = await runTimed(
              tx.run,
              block.statements.join('\n;\n'),
              [],
              options
            )
            await (block.commit ? tx.commit() : tx.rollback())
            return answer
          } finally {
            await tx.release()
          }
        }
        // A lone BEGIN or COMMIT would act on a request the next statement never sees.
        if (
          values.length === 0 &&
          splitStatements(sql, DUCKDB).some(
            ({ text }) =>
              leavesTransactionOpen(text, DUCKDB) ||
              endsTransaction(text, DUCKDB)
          )
        ) {
          throw new Error(
            'This database keeps no transaction open between requests, so run BEGIN through COMMIT as one whole script.'
          )
        }
      }
      return runTimed(
        (...args) => transport.run(connectionString, ...args),
        sql,
        values,
        options
      )
    }
  ),

  openSession: handleQueryError(async ({ connectionString, ownerId }) => {
    const { openSession } = getTransport(connectionString)
    if (!openSession) {
      // The runner wraps it in its own advice to run the whole block.
      throw new Error(
        'this database keeps no transaction open between requests'
      )
    }
    return {
      txId: registerTransaction(
        toHandle(await openSession(connectionString)),
        ownerId
      ),
    }
  }),
} satisfies QueryExecutor
