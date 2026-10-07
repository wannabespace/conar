import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { dialects, splitStatements } from '@tamery/sql'
import { type } from 'arktype'

import type { QueryParams } from '~/core/runtime/query'

import type { ResultSet } from './custom'
import { transactionQuery } from './transaction'

const postgresPlan = type({
  Plan: {
    'Node Type': 'string',
    'Plan Rows': 'number',
    'Plans?': type({ 'Plan Rows': 'number' }).array(),
  },
}).array()

const postgresRows = (value: unknown) => {
  const top = postgresPlan.assert(value)[0]?.Plan
  if (!top) {
    return
  }
  return top['Node Type'] === 'ModifyTable'
    ? top.Plans?.[0]?.['Plan Rows']
    : top['Plan Rows']
}

const mysqlRows = ({ columns, rows }: ResultSet) => {
  const rowsAt = columns.indexOf('rows')
  const filteredAt = columns.indexOf('filtered')
  const row = rows.find((item) => typeof item[rowsAt] === 'number')
  return row && (Number(row[rowsAt]) * Number(row[filteredAt] ?? 100)) / 100
}

const plans: Record<
  ConnectionType,
  { explain: string; rows: (plan: ResultSet) => number | undefined } | null
> = {
  [ConnectionType.ClickHouse]: null,
  [ConnectionType.MSSQL]: null,
  // MySQL 9's JSON plan has no row estimate for a single-table UPDATE or DELETE; the tabular one always has.
  [ConnectionType.MySQL]: {
    explain: 'EXPLAIN FORMAT=TRADITIONAL',
    rows: mysqlRows,
  },
  [ConnectionType.Postgres]: {
    explain: 'EXPLAIN (FORMAT JSON)',
    rows: (plan) => postgresRows(plan.rows[0]?.[0]),
  },
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
  const plan = plans[connectionType]
  const [statement, ...rest] = splitStatements(text, dialects[connectionType])
  if (
    !plan ||
    rest.length > 0 ||
    !ESTIMATED_COMMANDS.has(statement?.tokens[0]?.text.toUpperCase() ?? '')
  ) {
    return null
  }
  // Not read only: MySQL refuses even EXPLAIN of a write there. EXPLAIN without ANALYZE never runs the statement.
  const query = transactionQuery(
    { commit: false, statements: [`${plan.explain} ${text}`] },
    signal
  )
  return {
    queryIds: query.queryIds,
    run: async (params: QueryParams) => {
      const [set] = await query.run(params)
      const rows = set && plan.rows(set)
      return rows === undefined ? null : Math.round(rows)
    },
  }
}
