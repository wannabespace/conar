import { createRequire } from 'node:module'

import type * as ClickHouse from '@clickhouse/client'
import { memoize } from 'memoza'

const clickhouse = createRequire(import.meta.url)(
  '@clickhouse/client'
) as typeof ClickHouse

export const getClient = memoize((connectionString: string) => {
  let url = connectionString
  if (connectionString.startsWith('clickhouses')) {
    url = connectionString.replace('clickhouses', 'https')
  } else if (connectionString.startsWith('clickhouse')) {
    url = connectionString.replace('clickhouse', 'http')
  }
  return clickhouse.createClient({
    clickhouse_settings: {
      date_time_output_format: 'iso',
    },
    request_timeout: 0,
    url,
  })
})
