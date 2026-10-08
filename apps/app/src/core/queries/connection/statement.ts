import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import { dialects, leavesTransactionOpen, unwrapTransaction } from '@tamery/sql'

import { customQuery } from './custom'
import { transactionQuery } from './transaction'

export const statementQuery = (
  text: string,
  connectionType: ConnectionType
) => {
  const dialect = dialects[connectionType]
  const transaction = unwrapTransaction(text, dialect)
  if (transaction) {
    return transactionQuery(transaction)
  }
  if (leavesTransactionOpen(text, dialect)) {
    throw new Error(
      dialect.transactions
        ? 'Run BEGIN together with its COMMIT or ROLLBACK. A transaction left open would hold the connection the rest of the app uses.'
        : 'This database has no transactions. Run the statements without BEGIN.'
    )
  }
  return customQuery({ query: text })
}
