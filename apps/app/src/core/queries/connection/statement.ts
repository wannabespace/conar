import type { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, leavesTransactionOpen, unwrapTransaction } from '@tamery/sql'

import { customQuery } from './custom'
import { transactionQuery } from './transaction'

export const statementQuery = (text: string, dialect: Dialect) => {
  const spec = dialects[dialect]
  const transaction = unwrapTransaction(text, spec)
  if (transaction) {
    return transactionQuery(transaction)
  }
  if (leavesTransactionOpen(text, spec)) {
    throw new Error(
      spec.transactions
        ? 'Run BEGIN together with its COMMIT or ROLLBACK. A transaction left open would hold the connection the rest of the app uses.'
        : 'This database has no transactions. Run the statements without BEGIN.'
    )
  }
  return customQuery({ query: text })
}
