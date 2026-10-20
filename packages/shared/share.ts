import { type } from 'arktype'

import { Dialect } from './enums/connection-type'
import { ShareRefresh } from './enums/share-refresh'
import { SQL_OPERATORS } from './filters'
import { objectEntries } from './utils'

export const SHARE_PAGE_SIZE = 100
export const SHARE_EXPORT_LIMIT = 10_000

const orderDirection = type('"ASC" | "DESC"')

// `operator` reaches SQL through `sql.raw`, so only a known one passes.
const shareFilter = type({
  column: 'string',
  ref: {
    'hasValue?': 'boolean',
    'isArray?': 'boolean',
    label: 'string',
    operator: type.enumerated(
      ...objectEntries(SQL_OPERATORS).map(([operator]) => operator)
    ),
    symbol: 'string',
  },
  values: 'unknown[]',
  'via?': {
    key: 'string',
    schema: 'string',
    table: 'string',
    target: 'string',
  },
})

export const shareView = type({
  /** The type of every column in the table, which ClickHouse and SQLite bind filter values by. */
  columnTypes: type({ id: 'string', type: 'string' }).array(),
  columns: 'string[] > 0',
  filters: shareFilter.array(),
  orderBy: { '[string]': orderDirection },
  schema: 'string',
  table: 'string',
})

export type ShareView = typeof shareView.infer

export const shareSort = type({
  column: 'string',
  direction: orderDirection,
}).or('null')

export const shareCheckInput = shareView.merge({
  dialect: type.valueOf(Dialect),
  resourceId: 'string.uuid',
})

export const shareSaveInput = shareView.merge({
  connectionResourceId: 'string.uuid',
  description: 'string | null',
  expiresAt: 'Date | null',
  name: 'string > 0',
  /** Left out keeps the current password; `null` removes it. */
  'password?': 'string > 0 | null',
  refresh: type.valueOf(ShareRefresh),
})
