import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { mssqlQualified } from '../shared/sql-fragments'
import type { ConstraintTarget } from './shape'

export const renameConstraintQuery = ({
  name,
  newName,
  schema,
  table,
}: ConstraintTarget & { newName: string }) =>
  createQuery({
    query: {
      clickhouse: unsupported('Renaming constraints'),
      mssql: (db) =>
        sql`EXEC sp_rename ${sql.val(mssqlQualified(schema, name))}, ${sql.val(newName)}, 'OBJECT'`.execute(
          db
        ),
      mysql: unsupported('Renaming constraints'),
      postgres: (db) =>
        db
          .withSchema(schema)
          .schema.alterTable(table)
          .renameConstraint(name, newName)
          .execute(),
    },
  })
