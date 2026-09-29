import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { Kysely } from 'kysely'

import { createQuery } from '../../runtime/query'
import type { DiagramDraft } from './shape'
import { draftStatement } from './shape'

export const applyDiagramDraftsQuery = ({
  drafts,
  onCommitted,
}: {
  drafts: DiagramDraft[]
  onCommitted: (draft: DiagramDraft) => void
}) => {
  const runEach = async (
    dialectType: ConnectionType,
    // oxlint-disable-next-line ts/no-explicit-any
    db: Kysely<any>,
    onEach?: (draft: DiagramDraft) => void
  ) => {
    for (const draft of drafts) {
      // A later draft may reference what an earlier one created.
      // oxlint-disable-next-line no-await-in-loop
      await db.executeQuery(draftStatement(dialectType, db, draft))
      onEach?.(draft)
    }
  }

  return createQuery({
    query: {
      // MySQL and ClickHouse commit each DDL statement implicitly, so a failed
      // draft leaves the earlier ones applied.
      clickhouse: (db) => runEach(ConnectionType.ClickHouse, db, onCommitted),
      mssql: (db) =>
        db.transaction().execute((tx) => runEach(ConnectionType.MSSQL, tx)),
      mysql: (db) => runEach(ConnectionType.MySQL, db, onCommitted),
      postgres: (db) =>
        db.transaction().execute((tx) => runEach(ConnectionType.Postgres, tx)),
    },
  })
}
