import { createRequire } from 'node:module'

import { tries } from '@tamery/shared/tries'
import { memoize } from 'memoza'
import type { Pool, PoolClient, PoolConfig } from 'pg'
import type * as PgModule from 'pg'

import type { QueryExecutor, RunOptions, TransactionSettings } from '..'
import { handleQueryError, resultSet } from '..'
import { parseConnectionString } from '../..'
import { readSSLFiles } from '../../read-ssl-files'
import { defaultSSLConfig, parseSSLConfig } from '../../ssl/pg'
import { cancellable, cancellationQueries } from '../cancellation'
import { registerTransaction, transactionQueries } from '../transactions'

const pg = createRequire(import.meta.url)('pg') as typeof PgModule

const parseDate = (value: string) => value

pg.types.setTypeParser(pg.types.builtins.DATE, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMP, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMESTAMPTZ, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIME, parseDate)
pg.types.setTypeParser(pg.types.builtins.TIMETZ, parseDate)

const getPool = memoize((connectionString: string) => {
  const { searchParams, ...config } = parseConnectionString(connectionString)
  const ssl = parseSSLConfig(searchParams)
  const conf: PoolConfig = {
    ...config,
    max: 1,
    ...(typeof ssl === 'object' ? { ssl: readSSLFiles(ssl) } : {}),
    ...(typeof ssl === 'boolean' ? { ssl } : {}),
  }
  const hasSsl = conf.ssl !== undefined && conf.ssl !== false

  return tries(
    async () => {
      const pool = new pg.Pool(conf)
      await pool.query('SELECT 1')
      return pool
    },
    !hasSsl &&
      (async ({ previousError }) => {
        const pool = new pg.Pool({
          ...conf,
          ssl: defaultSSLConfig,
        })
        await pool.query('SELECT 1').catch(() => {
          throw previousError
        })
        return pool
      })
  )
})

const backendPids = new WeakMap<PoolClient, number>()

const backendPid = async (client: PoolClient) => {
  const cached = backendPids.get(client)
  if (cached !== undefined) {
    return cached
  }
  const { rows } = await client.query<{ pid: number }>(
    'SELECT pg_backend_pid() AS pid'
  )
  const pid = rows[0]?.pid
  if (pid !== undefined) {
    backendPids.set(client, pid)
  }
  return pid
}

/** The pool holds one connection and it is busy, so the cancel request needs its own. */
const cancelBackend = async (pool: Pool, pid: number | undefined) => {
  if (pid === undefined) {
    return
  }
  const canceller = new pg.Client(pool.options)
  await canceller.connect()
  try {
    await canceller.query('SELECT pg_cancel_backend($1)', [pid])
  } finally {
    await canceller.end()
  }
}

const runOn = async (
  {
    client,
    connectionString,
    pool,
  }: { client: PoolClient; connectionString: string; pool: Pool },
  sqlText: string,
  values: unknown[],
  { maxRows, queryId }: RunOptions
) => {
  const pid = queryId ? await backendPid(client) : undefined
  const cancel = () => cancelBackend(pool, pid)
  const start = performance.now()
  const result = await cancellable({ cancel, connectionString, queryId }, () =>
    client.query({ rowMode: 'array', text: sqlText, values })
  )
  return {
    duration: performance.now() - start,
    // A text holding several statements answers with one result each.
    result: [result].flat().map((item) =>
      resultSet(
        {
          affectedRows: item.fields.length === 0 ? item.rowCount : null,
          columns: item.fields.map((field) => field.name),
          rows: item.rows,
        },
        maxRows
      )
    ),
  }
}

export const query = {
  ...transactionQueries,
  ...cancellationQueries,

  beginTransaction: handleQueryError(
    async ({
      accessMode,
      connectionString,
      isolationLevel,
      ownerId,
    }: {
      connectionString: string
      ownerId?: string
    } & TransactionSettings) => {
      const pool = await getPool(connectionString)
      const client = await pool.connect()

      try {
        await client.query(
          [
            'BEGIN',
            isolationLevel && `ISOLATION LEVEL ${isolationLevel}`,
            accessMode,
          ]
            .filter(Boolean)
            .join(' ')
        )
      } catch (error) {
        client.release()
        throw error
      }

      const txId = registerTransaction(
        {
          commit: async () => {
            await client.query('COMMIT')
          },
          execute: (sqlText, values, options) =>
            runOn({ client, connectionString, pool }, sqlText, values, options),
          release: () => {
            client.release()
            return Promise.resolve()
          },
          rollback: async () => {
            await client.query('ROLLBACK')
          },
        },
        ownerId
      )

      return { txId }
    }
  ),
  execute: handleQueryError(
    async ({ connectionString, query: sqlText, values = [], ...options }) => {
      const pool = await getPool(connectionString)
      const client = await pool.connect()
      try {
        return await runOn(
          { client, connectionString, pool },
          sqlText,
          values,
          options
        )
      } finally {
        client.release()
      }
    }
  ),
} satisfies QueryExecutor
