import type { ExpressionBuilder, Kysely } from 'kysely'
import { sql } from 'kysely'

import { userSchemas } from '~/core/queries/shared/oracle-catalog'
import type { Database as OracleDatabase } from '~/core/runtime/dialects/oracle/schema'

const QUOTED_COLUMN = /^"(?<column>[^"]+)"$/u

const backsConstraint = (
  eb: ExpressionBuilder<
    OracleDatabase & { i: OracleDatabase['ALL_INDEXES'] },
    'i'
  >,
  types: ('P' | 'U')[]
) =>
  eb.exists(
    eb
      .selectFrom('ALL_CONSTRAINTS as k')
      .select(sql.lit(1).as('one'))
      .whereRef('k.INDEX_OWNER', '=', 'i.OWNER')
      .whereRef('k.INDEX_NAME', '=', 'i.INDEX_NAME')
      .where('k.CONSTRAINT_TYPE', 'in', types)
  )

// A DESC key is stored as a function-based key on the quoted column, so the expression names the column.
export const oracleIndexes = async (db: Kysely<OracleDatabase>) => {
  const rows = await db
    .selectFrom('ALL_INDEXES as i')
    .innerJoin('ALL_IND_COLUMNS as ic', (join) =>
      join
        .onRef('ic.INDEX_OWNER', '=', 'i.OWNER')
        .onRef('ic.INDEX_NAME', '=', 'i.INDEX_NAME')
    )
    .leftJoin('ALL_IND_EXPRESSIONS as ie', (join) =>
      join
        .onRef('ie.INDEX_OWNER', '=', 'ic.INDEX_OWNER')
        .onRef('ie.INDEX_NAME', '=', 'ic.INDEX_NAME')
        .onRef('ie.COLUMN_POSITION', '=', 'ic.COLUMN_POSITION')
    )
    .select((eb) => {
      const enforces = (types: ('P' | 'U')[]) =>
        eb.case().when(backsConstraint(eb, types)).then(1).else(0).end()

      return [
        'i.TABLE_OWNER as schema',
        'i.TABLE_NAME as table',
        'i.INDEX_NAME as name',
        'ic.COLUMN_NAME as column',
        'ie.COLUMN_EXPRESSION as expression',
        eb
          .case()
          .when('i.UNIQUENESS', '=', 'UNIQUE')
          .then(1)
          .else(0)
          .end()
          .as('is_unique'),
        enforces(['P']).as('is_primary'),
        enforces(['P', 'U']).as('is_constraint'),
        'i.INDEX_TYPE as index_type',
        eb
          .case()
          .when(
            eb.or([
              eb('i.INDEX_TYPE', '!=', 'NORMAL'),
              eb('i.PARTITIONED', '=', 'YES'),
              eb('i.VISIBILITY', '=', 'INVISIBLE'),
              eb('i.COMPRESSION', '!=', 'DISABLED'),
            ])
          )
          .then(1)
          .else(0)
          .end()
          .as('is_custom'),
      ]
    })
    .$narrowType<{
      is_constraint: 1 | 0
      is_custom: 1 | 0
      is_primary: 1 | 0
      is_unique: 1 | 0
    }>()
    .where('i.TABLE_OWNER', 'in', userSchemas(db))
    .where('i.INDEX_TYPE', '!=', 'LOB')
    .where('i.INDEX_NAME', 'not like', 'BIN$%')
    // Oracle generates indexes for its own storage too; only one backing a key is the user's.
    .where((eb) =>
      eb.or([eb('i.GENERATED', '=', 'N'), backsConstraint(eb, ['P', 'U'])])
    )
    .orderBy('ic.COLUMN_POSITION')
    .execute()

  return rows.map(({ column, expression, ...row }) => {
    if (expression === null) {
      return { ...row, column, custom_expression: null }
    }
    const quoted = QUOTED_COLUMN.exec(expression)?.groups?.column ?? null

    return {
      ...row,
      column: quoted,
      custom_expression: quoted ? null : expression,
    }
  })
}
