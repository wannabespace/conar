import { unsupported } from '@tamery/shared/unsupported'
import { sql } from 'kysely'

import { plsqlUnit } from '~/core/queries/shared/plsql'
import { createQuery } from '~/core/runtime/query'

import type { FunctionShape, RoutineTarget } from './shape'
import {
  createFunctionStatements,
  dropRoutineStatements,
  routineKeyword,
  routineType,
} from './shape'

// replacesObject marks a signature the engine cannot replace in place.
export const recreateFunctionQuery = ({
  replacesObject,
  shape,
  ...target
}: RoutineTarget & { replacesObject: boolean; shape: FunctionShape }) => {
  const create = createFunctionStatements({
    replace: true,
    schema: target.schema,
    shape,
  })
  const drop = dropRoutineStatements(target)

  return createQuery({
    query: {
      clickhouse: unsupported('Functions'),
      mssql: (db) =>
        db.transaction().execute(async (tx) => {
          if (replacesObject) {
            await drop.mssql.execute(tx)
          }
          await create.mssql.execute(tx)
        }),
      mysql: async (db) => {
        const saved = await db
          .selectFrom('information_schema.ROUTINES')
          .select('DEFINER')
          .where('ROUTINE_SCHEMA', '=', target.schema)
          .where('ROUTINE_NAME', '=', target.name)
          .where(
            'ROUTINE_TYPE',
            '=',
            target.kind === 'procedure' ? 'PROCEDURE' : 'FUNCTION'
          )
          .executeTakeFirst()
        const column =
          target.kind === 'procedure' ? 'Create Procedure' : 'Create Function'
        const {
          rows: [original],
        } = await sql<
          Record<string, string | null>
        >`SHOW CREATE ${routineKeyword(target.kind)} ${sql.id(target.schema, target.name)}`.execute(
          db
        )

        await drop.mysql.execute(db)
        try {
          await createFunctionStatements({
            definer: saved?.DEFINER,
            replace: true,
            schema: target.schema,
            shape,
          }).mysql.execute(db)
        } catch (error) {
          // MySQL commits the drop at once, so only its saved statement brings the routine back.
          const statement = original?.[column]

          if (statement) {
            await sql.raw(statement).execute(db)
          }
          throw error
        }
      },
      oracle: async (db) => {
        const original = await plsqlUnit.definition(db, {
          name: target.name,
          schema: target.schema,
          type: routineType(target.kind),
        })
        // Oracle commits the drop at once, and CREATE OR REPLACE stores a routine that fails to
        // compile over the old one, so only the saved source brings the old routine back.
        const restoreOriginal = () =>
          original ? sql.raw(original).execute(db) : null

        if (replacesObject) {
          await drop.oracle.execute(db)
        }
        try {
          await createFunctionStatements({
            replace: !replacesObject,
            schema: target.schema,
            shape,
          }).oracle.execute(db)
        } catch (error) {
          if (replacesObject) {
            await restoreOriginal()
          }
          throw error
        }
        const errors = await plsqlUnit.errors(db, {
          name: shape.name,
          schema: target.schema,
          type: routineType(shape.kind),
        })

        if (errors) {
          if (replacesObject) {
            await dropRoutineStatements({
              identity: undefined,
              kind: shape.kind,
              name: shape.name,
              schema: target.schema,
            }).oracle.execute(db)
          }
          await restoreOriginal()
          throw new Error(errors)
        }
      },
      postgres: (db) =>
        db.transaction().execute(async (tx) => {
          if (replacesObject) {
            await drop.postgres.execute(tx)
          }
          await create.postgres.execute(tx)
        }),
      sqlite: unsupported('Functions'),
    },
  })
}
