import { createRequire } from 'node:module'
import { memoize } from '@conar/shared/utils/helpers'

const duckdb = createRequire(import.meta.url)('duckdb') as typeof import('duckdb')

export const getDatabase = memoize((connectionString: string) => {
  const db = new duckdb.Database(connectionString)

  return new Promise<InstanceType<typeof duckdb.Connection>>((resolve, reject) => {
    db.connect((err, conn) => {
      if (err)
        reject(err)
      else
        resolve(conn)
    })
  })
})
