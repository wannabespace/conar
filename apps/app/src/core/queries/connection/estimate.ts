import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { unsupported } from '@tamery/shared/unsupported'
import { dialects, splitStatements } from '@tamery/sql'
import type { Type } from 'arktype'
import { type } from 'arktype'
import type { Kysely } from 'kysely'
import { CompiledQuery } from 'kysely'

import { capabilitiesOf } from '~/core/catalog/capabilities'
import { createQuery } from '~/core/runtime/query'

import type { ResultSet } from './custom'
import { runInTransaction } from './transaction'

const postgresRows = type([
  {
    Plan: {
      'Node Type': 'string',
      'Plan Rows': 'number',
      'Plans?': type({ 'Plan Rows': 'number' }).array(),
    },
  },
]).pipe(
  ([{ Plan }]) =>
    (Plan['Node Type'] === 'ModifyTable'
      ? Plan.Plans?.[0]?.['Plan Rows']
      : Plan['Plan Rows']) ?? null
)

const mysqlRows = ({ columns, rows }: ResultSet) => {
  const rowsAt = columns.indexOf('rows')
  const row = rows.find((item) => typeof item[rowsAt] === 'number')
  const filtered = row?.[columns.indexOf('filtered')] ?? 100
  return row ? Math.round((Number(row[rowsAt]) * Number(filtered)) / 100) : null
}

// Only a statement that opens with a data verb: EXPLAIN takes no `ANALYZE …` or procedure call that would make it run.
const ESTIMATED_COMMANDS = new Set([
  'DELETE',
  'INSERT',
  'MERGE',
  'REPLACE',
  'UPDATE',
])

/** The planner's guess at how many rows one write touches, without running it; `null` where the engine or statement has none. */
export const estimateQuery = (
  text: string,
  connectionType: ConnectionType,
  signal: AbortSignal
) => {
  const [statement, ...rest] = splitStatements(text, dialects[connectionType])
  if (
    !capabilitiesOf(connectionType).explain ||
    rest.length > 0 ||
    !ESTIMATED_COMMANDS.has(statement?.tokens[0]?.text.toUpperCase() ?? '')
  ) {
    return null
  }
  // MySQL 9's JSON plan has no row estimate for a single-table UPDATE or DELETE; the tabular one always has.
  const mysql = CompiledQuery.raw(`EXPLAIN FORMAT=TRADITIONAL ${text}`)
  const postgres = CompiledQuery.raw(`EXPLAIN (FORMAT JSON) ${text}`)
  // Not read only: MySQL refuses even EXPLAIN of a write there.
  const explain = async <DB>(db: Kysely<DB>, query: CompiledQuery) => {
    const [set] = await runInTransaction(db, { commit: false }, [query], signal)
    return set
  }
  return {
    ...createQuery<Type<number | null>>({
      query: {
        clickhouse: unsupported('Row estimates'),
        mssql: unsupported('Row estimates'),
        mysql: async (db) => {
          const set = await explain(db, mysql)
          return set ? mysqlRows(set) : null
        },
        postgres: async (db) => {
          const set = await explain(db, postgres)
          return postgresRows.assert(set?.rows[0]?.[0])
        },
      },
    }),
    queryIds: [mysql.queryId.queryId, postgres.queryId.queryId],
  }
}
