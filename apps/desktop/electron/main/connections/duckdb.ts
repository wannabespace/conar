import { createRequire } from 'node:module'
import { memoize } from '@conar/shared/utils/helpers'

const { DuckDBInstance } = createRequire(import.meta.url)('@duckdb/node-api') as typeof import('@duckdb/node-api')

export const getConnection = memoize(async (connectionString: string) => {
  const instance = await DuckDBInstance.create(connectionString)
  return instance.connect()
})
