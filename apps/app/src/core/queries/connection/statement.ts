import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  dialects,
  invalidatesCatalog,
  leavesTransactionOpen,
  unwrapTransaction,
  writesData,
} from '@tamery/sql'

import type { ConnectionResource } from '~/core/connection/sync'
import { resourceColumnsQueryKey } from '~/core/queries/tables/columns'
import { queryClient } from '~/lib/query-client'

import { customQuery } from './custom'
import { transactionQuery } from './transaction'

export const statementQuery = (
  text: string,
  connectionType: ConnectionType,
  signal: AbortSignal
) => {
  const dialect = dialects[connectionType]
  const transaction = unwrapTransaction(text, dialect)
  if (transaction) {
    return transactionQuery(transaction, signal)
  }
  if (leavesTransactionOpen(text, dialect)) {
    throw new Error(
      dialect.transactions
        ? 'Run BEGIN together with its COMMIT or ROLLBACK. A transaction left open would hold the connection the rest of the app uses.'
        : 'This database has no transactions. Run the statements without BEGIN.'
    )
  }
  const single = customQuery({ query: text })
  return { queryIds: [single.queryId], run: single.run }
}

export const refreshAfterRun = (
  connectionResource: ConnectionResource,
  connectionType: ConnectionType,
  statements: { text: string }[]
) => {
  const text = statements.map((statement) => statement.text).join(';\n')
  if (invalidatesCatalog(text, dialects[connectionType])) {
    void queryClient.invalidateQueries({
      queryKey: ['connection-resource', connectionResource.id],
    })
    queryClient.removeQueries({
      queryKey: resourceColumnsQueryKey({ connectionResource }),
      type: 'inactive',
    })
  } else if (writesData(text, dialects[connectionType])) {
    // Sync with resourceRowsQueryKey and resourceTableTotalQueryKey: every row-data key starts with this prefix.
    void queryClient.invalidateQueries({
      queryKey: ['connection-resource', connectionResource.id, 'schema'],
    })
  }
}
