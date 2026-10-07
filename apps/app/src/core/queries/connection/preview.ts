import type { ConnectionType } from '@tamery/shared/enums/connection-type'
import {
  dialects,
  invalidatesCatalog,
  runsDynamicSql,
  unwrapTransaction,
} from '@tamery/sql'

import { capabilitiesOf } from '~/core/catalog/capabilities'

import { transactionQuery } from './transaction'

/** Runs the statement inside a transaction that always rolls back; `null` where the rollback would not undo it. */
export const previewQuery = (
  text: string,
  connectionType: ConnectionType,
  signal: AbortSignal
) => {
  const dialect = dialects[connectionType]
  if (
    !dialect.transactions ||
    runsDynamicSql(text, dialect) ||
    (!capabilitiesOf(connectionType).ddlRollback &&
      invalidatesCatalog(text, dialect))
  ) {
    return null
  }
  const transaction = unwrapTransaction(text, dialect)
  return transactionQuery(
    { ...(transaction ?? { statements: [text] }), commit: false },
    signal
  )
}
