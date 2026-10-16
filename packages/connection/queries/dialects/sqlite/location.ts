import type { QueryExecutor } from '../..'

/** What each place a SQLite database lives in implements; the transaction calls go through the shared registry. */
export type LocationQueries = Pick<
  QueryExecutor,
  'beginTransaction' | 'cancel' | 'execute' | 'openSession'
>

/** The runner wraps it in its own advice to run the whole block. */
export const NO_OPEN_SESSION =
  'this database keeps no transaction open between requests'
