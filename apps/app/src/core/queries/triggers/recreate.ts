import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { plsqlUnit } from '~/core/queries/shared/plsql'
import { createQuery } from '~/core/runtime/query'

import type { TriggerShape, TriggerTarget } from './shape'
import {
  createTriggerStatements,
  dropTriggerStatements,
  setTriggerEnabledStatements,
} from './shape'

export const recreateTriggerQuery = ({
  enabled,
  mode,
  name,
  schema,
  shape,
  table,
}: TriggerTarget & {
  enabled: boolean | null
  mode: string
  name: string
  shape: TriggerShape
}) => {
  const drop = dropTriggerStatements({ name, schema, table })
  const create = createTriggerStatements({ schema, shape, table })
  const restore =
    enabled === false || mode !== 'O'
      ? setTriggerEnabledStatements({
          enabled: enabled !== false,
          mode,
          name: shape.name,
          schema,
          table,
        })
      : undefined

  return createQuery({
    query: {
      clickhouse: unsupported('Triggers'),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.mssql.execute(tx)
          await create.mssql.execute(tx)
          await restore?.mssql.execute(tx)
        }),
      mysql: async (db) => {
        const saved = await db
          .selectFrom('information_schema.TRIGGERS')
          .select('DEFINER')
          .where('TRIGGER_SCHEMA', '=', schema)
          .where('TRIGGER_NAME', '=', name)
          .executeTakeFirst()
        const {
          rows: [original],
        } = await sql<{
          'SQL Original Statement': string | null
        }>`SHOW CREATE TRIGGER ${sql.id(schema, name)}`.execute(db)

        await drop.mysql.execute(db)
        try {
          await createTriggerStatements({
            definer: saved?.DEFINER,
            schema,
            shape,
            table,
          }).mysql.execute(db)
        } catch (error) {
          // MySQL commits the drop at once, so only its saved statement brings the trigger back.
          const statement = original?.['SQL Original Statement']

          if (statement) {
            await sql.raw(statement).execute(db)
          }
          throw error
        }
      },
      oracle: async (db) => {
        const renamed = name !== shape.name
        const original = await plsqlUnit.definition(db, {
          name,
          schema,
          type: 'TRIGGER',
        })
        // Oracle commits the drop at once, and CREATE OR REPLACE stores a trigger that fails to
        // compile over the old one, so only the saved source brings the old trigger back.
        const restoreOriginal = async () => {
          if (!original) {
            return
          }
          await sql.raw(original).execute(db)
          if (enabled === false) {
            await setTriggerEnabledStatements({
              enabled,
              mode,
              name,
              schema,
              table,
            }).oracle.execute(db)
          }
        }

        if (renamed) {
          await drop.oracle.execute(db)
        }
        try {
          await createTriggerStatements({
            replace: !renamed,
            schema,
            shape,
            table,
          }).oracle.execute(db)
        } catch (error) {
          if (renamed) {
            await restoreOriginal()
          }
          throw error
        }
        const errors = await plsqlUnit.errors(db, {
          name: shape.name,
          schema,
          type: 'TRIGGER',
        })

        if (errors) {
          if (renamed) {
            await dropTriggerStatements({
              name: shape.name,
              schema,
              table,
            }).oracle.execute(db)
          }
          await restoreOriginal()
          throw new Error(errors)
        }
        await restore?.oracle.execute(db)
      },
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.postgres.execute(tx)
          await create.postgres.execute(tx)
          await restore?.postgres.execute(tx)
        }),
      sqlite: (db) =>
        db.transaction().execute(async (tx) => {
          await drop.sqlite.execute(tx)
          await create.sqlite.execute(tx)
        }),
    },
  })
}
