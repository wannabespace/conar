import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as DuckdbDatabase } from '~/core/runtime/dialects/duckdb/schema'

import { LISTED_CONSTRAINT_TYPES } from '../shape'

/** `greatest(…, 1)` keeps a check that names no column. DuckDB stores no referential action, so a foreign key's is NO ACTION. */
export const duckdbConstraints = (db: Kysely<DuckdbDatabase>) =>
  db
    .selectFrom('duckdb_constraints as c')
    .crossJoin(
      sql<{
        range: number
      }>`range(greatest(len(c.constraint_column_names), 1))`.as('k')
    )
    .select((eb) => {
      const foreignKey = eb('c.constraint_type', '=', 'FOREIGN KEY')
      return [
        'c.schema_name as schema',
        'c.table_name as table',
        'c.constraint_name as name',
        'c.constraint_type as type',
        sql<string | null>`c.constraint_column_names[k.range + 1]`.as('column'),
        eb
          .case()
          .when(foreignKey)
          .then(eb.ref('c.schema_name'))
          .end()
          .as('foreign_schema'),
        'c.referenced_table as foreign_table',
        sql<string | null>`c.referenced_column_names[k.range + 1]`.as(
          'foreign_column'
        ),
        eb.case().when(foreignKey).then('NO ACTION').end().as('onDelete'),
        eb.case().when(foreignKey).then('NO ACTION').end().as('onUpdate'),
        'c.constraint_text as definition',
        'c.expression',
      ]
    })
    .$narrowType<{ type: (typeof LISTED_CONSTRAINT_TYPES)[number] }>()
    .where('c.database_name', '=', sql<string>`current_database()`)
    .where('c.constraint_type', 'in', LISTED_CONSTRAINT_TYPES)
    .orderBy('c.schema_name')
    .orderBy('c.table_name')
    .orderBy('c.constraint_index')
    .orderBy(sql`k.range`)
    .execute()
