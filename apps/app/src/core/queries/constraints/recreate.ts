import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { readDefinition } from '~/core/queries/shared/definition'
import { createQuery } from '~/core/runtime/query'

import type { ConstraintKind, ConstraintShape, ConstraintTarget } from './shape'
import {
  addConstraint,
  constraintClause,
  dropConstraint,
  mysqlDropKey,
  oracleAddConstraint,
} from './shape'

export const recreateConstraintQuery = ({
  kind,
  name,
  schema,
  shape,
  table,
}: ConstraintTarget & { kind: ConstraintKind; shape: ConstraintShape }) => {
  const target = { name, schema, table }

  return createQuery({
    query: {
      clickhouse: (db) =>
        sql`
          ALTER TABLE ${sql.id(schema, table)}
          DROP ${mysqlDropKey(kind, name)},
          ADD ${constraintClause(shape)}
        `.execute(db),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          await dropConstraint(tx, target).execute()
          await addConstraint(tx, target, shape).execute()
        }),
      mysql: (db) =>
        sql`
          ALTER TABLE ${sql.id(schema, table)}
          DROP ${mysqlDropKey(kind, name)},
          ADD ${constraintClause(shape)}
        `.execute(db),
      oracle: async (db) => {
        const { definition } = await readDefinition(
          sql<string>`DBMS_METADATA.GET_DDL(${kind === 'foreignKey' ? 'REF_CONSTRAINT' : 'CONSTRAINT'}, ${name}, ${schema})`
        )(db)

        await dropConstraint(db, target).execute()
        try {
          await oracleAddConstraint(db, target, shape).execute()
        } catch (error) {
          // Oracle commits the drop at once, so only its saved DDL brings the constraint back.
          if (definition) {
            await sql.raw(definition).execute(db)
          }
          throw error
        }
      },
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          await dropConstraint(tx, target).execute()
          await addConstraint(tx, target, shape).execute()
        }),
      sqlite: unsupported('Editing constraints'),
    },
  })
}
