import clickhouse from '@clickhouse/client'
import { memoize } from '@conar/shared/utils/helpers'

export const getClient = memoize((connectionString: string) => clickhouse.createClient({
  url: connectionString,
}))
