import type * as mssqlModule from 'mssql'

import type { RunOptions } from '../..'
import { bindable, resultSet } from '../..'
import { cancellable } from '../../cancellation'

interface ColumnMetadata {
  name: string
  scale?: number
  type?: { declaration?: string }
}

const fractionOf = (
  date: Date & { nanosecondsDelta?: number },
  scale: number
) => {
  const tenthsOfMicroseconds = Math.round(
    (date.getUTCMilliseconds() / 1000 + (date.nanosecondsDelta ?? 0)) * 1e7
  )
  return scale === 0
    ? ''
    : `.${String(tenthsOfMicroseconds).padStart(7, '0').slice(0, scale)}`
}

// Text, as pg and mysql give: a `Date` drops datetime2's last four digits and shifts a `time` into the viewer's zone. tedious reads every value as UTC.
const dateAsText = (value: unknown, column?: ColumnMetadata) => {
  if (!(value instanceof Date)) {
    return value
  }
  const iso = value.toISOString()
  const day = iso.slice(0, 10)
  const seconds = iso.slice(11, 19)
  const time = `${seconds}${fractionOf(value, column?.scale ?? 3)}`
  switch (column?.type?.declaration) {
    case 'date': {
      return day
    }
    case 'time': {
      return time
    }
    case 'smalldatetime': {
      return `${day} ${seconds}`
    }
    case 'datetimeoffset': {
      return `${day} ${time} +00:00`
    }
    default: {
      return `${day} ${time}`
    }
  }
}

export const runRequest = async (
  request: mssqlModule.Request,
  {
    connectionString,
    sql,
    values,
  }: { connectionString: string; sql: string; values: unknown[] },
  { maxRows, queryId }: RunOptions
) => {
  for (const [index, value] of bindable(values).entries()) {
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
    const columns: ColumnMetadata[] = Array.isArray(columnSets[index])
      ? columnSets[index]
      : []
    return resultSet(
      {
        affectedRows: null,
        columns: columns.map((column) => column.name),
        rows: rows.map((row) =>
          row.map((value, position) => dateAsText(value, columns[position]))
        ),
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
