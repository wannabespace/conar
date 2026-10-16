import type { QueryExecutor } from '../..'

/** What each place a SQLite database lives in implements; the transaction calls go through the shared registry. */
export type LocationQueries = Pick<
  QueryExecutor,
  'beginTransaction' | 'cancel' | 'execute' | 'openSession'
>

export const NO_OPEN_SESSION =
  'This database keeps no transaction open between runs. Run the whole BEGIN … COMMIT block with Run all, or select it.'
