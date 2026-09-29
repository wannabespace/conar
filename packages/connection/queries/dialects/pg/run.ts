import type { Pool, PoolClient } from 'pg'

import type { RunOptions } from '../..'
import { resultSet } from '../..'
import { cancellable } from '../../cancellation'
import { backendPid, cancelBackend } from './cancel'

export const runOn = async (
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
