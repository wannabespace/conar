import { createRequire } from 'node:module'

import { Result } from 'better-result'
import { memoize } from 'memoza'
import type { PoolConfig } from 'pg'
import type * as PgModule from 'pg'

import { parseConnectionString } from '../../..'
import { readSSLFiles } from '../../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../../ssl/pg'

export const pg = createRequire(import.meta.url)('pg') as typeof PgModule

const POINT_OID = 600
// oxlint-disable-next-line ts/no-inferrable-types -- widened: `TypeId` rejects a literal OID missing from builtins
const TEXT_ARRAY_OID: number = 1009
const asTextArray = pg.types.getTypeParser(TEXT_ARRAY_OID)

// Edited cells write this text back verbatim — the default parsers return a Date, object or Buffer Postgres can't re-parse.
const OIDS_KEPT_AS_POSTGRES_TEXT: [oid: number, arrayOid: number][] = [
  [pg.types.builtins.BYTEA, 1001],
  [pg.types.builtins.CIRCLE, 719],
  [pg.types.builtins.DATE, 1182],
  [pg.types.builtins.INTERVAL, 1187],
  [POINT_OID, 1017],
  [pg.types.builtins.TIME, 1183],
  [pg.types.builtins.TIMESTAMP, 1115],
  [pg.types.builtins.TIMESTAMPTZ, 1185],
  [pg.types.builtins.TIMETZ, 1270],
]

for (const [oid, arrayOid] of OIDS_KEPT_AS_POSTGRES_TEXT) {
  pg.types.setTypeParser(oid, (value: string) => value)
  pg.types.setTypeParser(arrayOid, asTextArray)
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
