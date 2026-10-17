import { Provider } from '@tamery/shared/enums/connection-type'
import {
  endsTransaction,
  leavesTransactionOpen,
  readsOnly,
  unwrapTransaction,
} from '@tamery/sql'

import type { QueryExecutor } from '../..'
import { handleQueryError } from '../..'
import { readConnectionString } from '../../../parse-connection-string'
import { getProviderOfScheme } from '../../../provider'
import type { TxHandle } from '../../transactions'
import { registerTransaction, transactionQueries } from '../../transactions'
import { d1Location } from './d1'
import { fileLocation } from './file'
import { libsqlLocation } from './libsql'
import type {
  LocationTransaction,
  RunStatements,
  SqliteLocationQueries,
} from './location'
import { runTimed, SQLITE, statementTexts } from './run'

const SERVER_LOCATIONS: Record<Provider, SqliteLocationQueries> = {
  [Provider.CloudflareD1]: d1Location,
  [Provider.Turso]: libsqlLocation,
}

/** Only an empty host opens a file, whatever the scheme says, so no server ever opens one on its own disk. */
const locate = (connectionString: string) => {
  const { host, scheme } = readConnectionString(connectionString)
  if (!host) {
    return fileLocation
  }
  const provider = getProviderOfScheme(scheme)
  if (!provider) {
    throw new Error(
      `Tamery cannot tell which provider serves this SQLite server: its string starts with ${scheme}://, not libsql:// or d1://.`
    )
  }
  return SERVER_LOCATIONS[provider]
}

/** Turso and D1 let a read-only transaction write, so every location refuses a write before sending it. */
const readingOnly =
  (run: RunStatements): RunStatements =>
  (texts, values, maxRows) =>
    texts.every((text) => readsOnly(text, SQLITE))
      ? run(texts, values, maxRows)
      : Promise.reject(
          new Error('A read-only transaction runs only statements that read.')
        )

const toHandle = ({ run, ...tx }: LocationTransaction): TxHandle => ({
  ...tx,
  execute: (sql, values, options) =>
    runTimed(run, statementTexts(sql, values), values, options),
})

export const query = {
  ...transactionQueries,

  beginTransaction: handleQueryError(
    async ({ accessMode, connectionString, ownerId }) => {
      const readOnly = accessMode === 'read only'
      const tx = await locate(connectionString).transaction(
        connectionString,
        readOnly
      )
      return {
        txId: registerTransaction(
          toHandle(readOnly ? { ...tx, run: readingOnly(tx.run) } : tx),
          ownerId
        ),
      }
    }
  ),

  cancel: () => Promise.resolve(),

  execute: handleQueryError(
    async ({ connectionString, query: sql, values = [], ...options }) => {
      const location = locate(connectionString)
      const texts = statementTexts(sql, values)
      if (!location.openSession) {
        const block = unwrapTransaction(sql, SQLITE)
        if (block) {
          const tx = await location.transaction(connectionString, false)
          try {
            const answer = await runTimed(tx.run, block.statements, [], options)
            await (block.commit ? tx.commit() : tx.rollback())
            return answer
          } finally {
            await tx.release()
          }
        }
        // A lone BEGIN or COMMIT would act on a connection the next statement never sees.
        if (
          texts.some(
            (text) =>
              leavesTransactionOpen(text, SQLITE) ||
              endsTransaction(text, SQLITE)
          )
        ) {
          throw new Error(
            'This database keeps no transaction open between requests, so run BEGIN through COMMIT as one whole script.'
          )
        }
      }
      return runTimed(
        (...args) => location.run(connectionString, ...args),
        texts,
        values,
        options
      )
    }
  ),

  openSession: handleQueryError(({ connectionString, ownerId }) => {
    const { openSession } = locate(connectionString)
    if (!openSession) {
      // The runner wraps it in its own advice to run the whole block.
      return Promise.reject(
        new Error('this database keeps no transaction open between requests')
      )
    }
    return Promise.resolve({
      txId: registerTransaction(
        toHandle(openSession(connectionString)),
        ownerId
      ),
    })
  }),
} satisfies QueryExecutor
