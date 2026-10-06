import { createRequire } from 'node:module'

import { Result } from 'better-result'
import { memoize } from 'memoza'
import type { PoolConfig } from 'pg'
import type * as PgModule from 'pg'

import { parseConnectionString } from '../../..'
import { readSSLFiles } from '../../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../../ssl/pg'

export const pg = createRequire(import.meta.url)('pg') as typeof PgModule

// Missing from `pg.types.builtins`.
const POINT_OID = 600
// oxlint-disable-next-line ts/no-inferrable-types -- widened: `TypeId` rejects a literal OID missing from builtins
const TEXT_ARRAY_OID: number = 1009
const asTextArray = pg.types.getTypeParser(TEXT_ARRAY_OID)
// `pg_type.typarray` of each type parsed as text below; keep the two lists in sync.
const TEXT_ARRAY_OIDS = [719, 1001, 1017, 1115, 1182, 1183, 1185, 1187, 1270]

// Kept as Postgres prints them, so an edited cell writes back text Postgres parses; the default parsers hand back a Date, an object or a Buffer.
for (const oid of [
  pg.types.builtins.BYTEA,
  pg.types.builtins.CIRCLE,
  pg.types.builtins.DATE,
  pg.types.builtins.INTERVAL,
  POINT_OID,
  pg.types.builtins.TIME,
  pg.types.builtins.TIMESTAMP,
  pg.types.builtins.TIMESTAMPTZ,
  pg.types.builtins.TIMETZ,
]) {
  pg.types.setTypeParser(oid, (value: string) => value)
}
for (const oid of TEXT_ARRAY_OIDS) {
  pg.types.setTypeParser(oid, asTextArray)
}

const connect = (options: PoolConfig) =>
  Result.tryPromise({
    catch: (error) => error,
    try: async () => {
      const pool = new pg.Pool(options)
      pool.on('error', console.error)
      await pool.query('SELECT 1')
      return pool
    },
  })

export const getPool = memoize(async (connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf: PoolConfig = {
    ...config,
    connectionTimeoutMillis: 30_000,
    max: 1,
    ...(typeof ssl === 'object' ? { ssl: readSSLFiles(ssl) } : {}),
    ...(typeof ssl === 'boolean' ? { ssl } : {}),
  }
  const hasSsl = conf.ssl !== undefined && conf.ssl !== false

  const direct = await connect(conf)
  const result = hasSsl
    ? direct
    : await direct.tryRecoverAsync(async (error) => {
        const fallback = await connect({ ...conf, ssl: defaultSSLConfig })
        return fallback.mapError(() => error)
      })

  if (result.isErr()) {
    throw result.error
  }

  return result.value
})
