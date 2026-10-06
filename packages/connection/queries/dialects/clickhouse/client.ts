import { createRequire } from 'node:module'

import type * as ClickHouse from '@clickhouse/client'
import { memoize } from 'memoza'

const clickhouse = createRequire(import.meta.url)(
  '@clickhouse/client'
) as typeof ClickHouse

export const getClient = memoize((connectionString: string) =>
  clickhouse.createClient({
    clickhouse_settings: { date_time_output_format: 'iso' },
    request_timeout: 0,
    url: connectionString.replace(/^clickhouse/u, 'http'),
  })
)
