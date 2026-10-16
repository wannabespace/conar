import type { QueryExecutor } from '../..'
import { readConnectionString } from '../../../parse-connection-string'
import { SQLITE_SCHEMES } from '../../../sqlite-remote'
import { transactionQueries } from '../../transactions'
import { d1Query } from './d1'
import { fileQuery } from './file'
import { libsqlQuery } from './libsql'
import type { LocationQueries } from './location'

const locate = (connectionString: string): LocationQueries => {
  const { scheme } = readConnectionString(connectionString)
  if (scheme === SQLITE_SCHEMES.libsql) {
    return libsqlQuery
  }
  return scheme === SQLITE_SCHEMES.d1 ? d1Query : fileQuery
}

export const query = {
  ...transactionQueries,
  beginTransaction: (args) =>
    locate(args.connectionString).beginTransaction(args),
  cancel: (args) => locate(args.connectionString).cancel(args),
  execute: (args) => locate(args.connectionString).execute(args),
  openSession: (args) => locate(args.connectionString).openSession(args),
} satisfies QueryExecutor
