import { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, splitStatements } from '@tamery/sql'
import type * as OracleDb from 'oracledb'

import type { ResultSet, RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { oracledb } from './client'
import { bindable, fetchTypeHandler } from './values'

/** Oracle runs one statement per call, so a text without bound values is split first; a PL/SQL unit keeps its own semicolons. */
const statementTexts = (sql: string, values: unknown[]) =>
  values.length > 0
    ? [sql]
    : splitStatements(sql, dialects[Dialect.Oracle], {
        groupTransactions: false,
      }).map((statement) => statement.text)

const runStatement = async (
  connection: OracleDb.Connection,
  text: string,
  values: unknown[],
  { autoCommit, maxRows }: { autoCommit: boolean; maxRows: number }
): Promise<Omit<ResultSet, 'truncated'>> => {
  const result = await connection.execute<unknown[]>(
    text,
    values.map(bindable),
    {
      autoCommit,
      fetchTypeHandler,
      // One row past the cap tells the set was truncated; 0 reads them all.
      maxRows: Number.isFinite(maxRows) ? maxRows + 1 : 0,
      outFormat: oracledb.OUT_FORMAT_ARRAY,
    }
  )
  if (result.rows) {
    return {
      affectedRows: null,
      columns: result.metaData?.map((column) => column.name) ?? [],
      rows: result.rows,
    }
  }
  return { affectedRows: result.rowsAffected ?? null, columns: [], rows: [] }
}

export const runOn = async (
  connection: OracleDb.Connection,
  {
    autoCommit,
    connectionString,
    sql,
    values,
  }: {
    autoCommit: boolean
    connectionString: string
    sql: string
    values: unknown[]
  },
  { maxRows = Infinity, queryId }: RunOptions
) => {
  const start = performance.now()
  const sets: Omit<ResultSet, 'truncated'>[] = []
  await cancellable(
    { cancel: () => connection.break(), connectionString, queryId },
    async () => {
      for (const text of statementTexts(sql, values)) {
        sets.push(
          // oxlint-disable-next-line no-await-in-loop -- a script's statements run in order on one connection
          await runStatement(connection, text, values, { autoCommit, maxRows })
        )
      }
    }
  )
  return {
    duration: performance.now() - start,
    result: sets.map((set) => resultSet(set, maxRows)),
  }
}
