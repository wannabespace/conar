import { createRequire } from 'node:module'
import { memoize } from '@conar/shared/utils/helpers'

const clickhouse = createRequire(import.meta.url)('@clickhouse/client') as typeof import('@clickhouse/client')

export const getClient = memoize((connectionString: string) => clickhouse.createClient({
  url: connectionString.startsWith('clickhouse')
    ? connectionString.replace(/^clickhouse/, 'http')
    : connectionString,
  max_open_connections: 1,
  clickhouse_settings: {
    date_time_output_format: 'iso',
  },
}))
