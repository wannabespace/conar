import type * as mssqlModule from 'mssql'

import type { RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'

export const runRequest = async (
  request: mssqlModule.Request,
  {
    connectionString,
    sql,
    values,
  }: { connectionString: string; sql: string; values: unknown[] },
  { maxRows, queryId }: RunOptions
) => {
  for (const [index, value] of values.entries()) {
    request.input(`${index + 1}`, value)
  }
  request.arrayRowMode = true
  const start = performance.now()
  const result = await cancellable(
    {
      cancel: () => Promise.resolve(request.cancel()),
      connectionString,
      queryId,
    },
    () => request.query<unknown[][]>(sql)
  )
  // Array row mode puts each recordset's columns on `result.columns`, which the typings lack.
  const columnSets: unknown[] =
    'columns' in result && Array.isArray(result.columns) ? result.columns : []
  const sets = result.recordsets.map((rows, index) => {
    const columns = columnSets[index]
    return resultSet(
      {
        affectedRows: null,
        columns: Array.isArray(columns)
          ? columns.map((column: { name: string }) => column.name)
          : [],
        rows,
      },
      maxRows
    )
  })
  return {
    duration: performance.now() - start,
    result:
      sets.length > 0
        ? sets
        : [
            resultSet(
              {
                affectedRows: result.rowsAffected.reduce(
                  (sum, n) => sum + n,
                  0
                ),
                columns: [],
                rows: [],
              },
              maxRows
            ),
          ],
  }
}
