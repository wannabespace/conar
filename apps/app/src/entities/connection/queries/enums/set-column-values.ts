import { unsupported } from '@tamery/shared/utils/unsupported'
import { sql } from 'kysely'

import { createQuery } from '../../runtime/query'
import { literals } from '../shared/sql-fragments'

export const setColumnEnumValuesQuery = ({
  charset,
  collation,
  column,
  comment,
  defaultValue,
  isSet,
  nullable,
  schema,
  table,
  values,
}: {
  charset: string | null
  collation: string | null
  column: string
  comment: string | undefined
  defaultValue: string | null
  isSet: boolean
  nullable: boolean
  schema: string
  table: string
  values: string[]
}) =>
  createQuery({
    query: {
      clickhouse: unsupported('Editing enums'),
      mssql: unsupported('Enums'),
      mysql: (db) =>
        sql`ALTER TABLE ${sql.id(schema, table)} MODIFY COLUMN ${sql.id(column)} ${sql.raw(isSet ? 'SET' : 'ENUM')}(${literals(values)})${charset ? sql` CHARACTER SET ${sql.id(charset)}` : sql``}${collation ? sql` COLLATE ${sql.id(collation)}` : sql``} ${sql.raw(nullable ? 'NULL' : 'NOT NULL')}${defaultValue === null ? sql`` : sql` DEFAULT ${sql.lit(defaultValue)}`}${comment ? sql` COMMENT ${sql.lit(comment)}` : sql``}`.execute(
          db
        ),
      postgres: unsupported('Column-bound enums'),
    },
  })
