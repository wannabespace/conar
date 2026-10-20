import { type } from 'arktype'

import { columnKind } from './column-kind'
import { Dialect } from './enums/connection-type'
import { ShareRefresh } from './enums/share-refresh'
import { FILTER_OPERATORS } from './filters'

export const SHARE_PAGE_SIZE = 100
export const SHARE_MAX_PAGES = 100

export const sharePage = type('number.integer')
  .atLeast(1)
  .atMost(SHARE_MAX_PAGES)

const orderDirection = type('"ASC" | "DESC"')

// `operator` reaches SQL through `sql.raw`, so only a known one passes.
const shareFilter = type({
  column: 'string',
  ref: {
    'hasValue?': 'boolean',
    'isArray?': 'boolean',
    label: 'string',
    operator: type.enumerated(...FILTER_OPERATORS),
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

const shareView = type({
  /** The type of every column in the table, which ClickHouse and SQLite bind filter values by. */
  columnTypes: type({ id: 'string', type: 'string' }).array(),
  /** The shown columns, in their order. */
  columns: type({ id: 'string', kind: columnKind, type: 'string | null' })
    .array()
    .atLeastLength(1),
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
