import type { SQL } from 'drizzle-orm'
import type { PgAsyncTransaction, PgColumn } from 'drizzle-orm/pg-core'
import type { Context } from 'hono'
import type { ShapesVariables } from '~/routers/shapes'
import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from '@electric-sql/client'
import { sql } from 'drizzle-orm'
import { PgDialect, QueryBuilder } from 'drizzle-orm/pg-core'
import { proxy } from 'hono/proxy'
import { env } from '~/env'

const dialect = new PgDialect()
export const qb = new QueryBuilder()

export const ELECTRIC_EXPOSED_HEADERS = [
  'electric-offset',
  'electric-handle',
  'electric-schema',
  'electric-cursor',
] as const

export function sqlToQuery(sql: SQL) {
  return dialect.sqlToQuery(sql)
}

export function createShape(callback: (c: Context<{ Variables: ShapesVariables }>) => Promise<{
  where: SQL
  table: string
  columns?: PgColumn[]
}>) {
  return async (c: Context<{ Variables: ShapesVariables }>) => {
    const { where, table, columns } = await callback(c)

    const query = sqlToQuery(where)

    // Electric does not support table-qualified column references ("table"."col").
    // Strip all table prefixes, keeping only the bare quoted column name.
    const whereClause = query.sql.replace(/"[^"]+"\."([^"]+)"/g, '"$1"')

    const url = new URL(c.req.url)
    const electricUrl = new URL(`${env.ELECTRIC_URL}/v1/shape`)

    url.searchParams.forEach((value, key) => {
      if (ELECTRIC_PROTOCOL_QUERY_PARAMS.includes(key)) {
        electricUrl.searchParams.set(key, value)
      }
    })

    electricUrl.searchParams.set('secret', env.ELECTRIC_SECRET)
    electricUrl.searchParams.set('table', table)
    electricUrl.searchParams.set('where', whereClause)
    if (columns) {
      electricUrl.searchParams.set('columns', columns.map(col => col.name).join(','))
    }

    query.params.forEach((value, index) => {
      electricUrl.searchParams.set(`params[${index + 1}]`, String(value))
    })

    c.set('logEvent', {
      ...c.get('logEvent'),
      electricUrl: electricUrl.toString().replace(env.ELECTRIC_SECRET, '***'),
    })

    const headers = new Headers(c.req.raw.headers)

    headers.delete('content-encoding')
    headers.delete('content-length')

    return proxy(electricUrl.toString(), {
      raw: c.req.raw,
      headers,
    }).catch((error) => {
      c.set('logEvent', {
        ...c.get('logEvent'),
        error: {
          message: error instanceof Error ? error.message : String(error),
          cause: error instanceof Error ? error.cause : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        },
      })

      throw error
    })
  }
}

// eslint-disable-next-line ts/no-explicit-any
export async function generateTxId(tx: PgAsyncTransaction<any>) {
  const result = await tx.execute<{ txid: string }>(sql`SELECT pg_current_xact_id()::xid::text as txid`)
  return Number.parseInt(result.rows[0]!.txid, 10)
}
