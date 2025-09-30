import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

export const foreignKeysType = type({
  table_schema: 'string',
  table_name: 'string',
  column_name: 'string',
  foreign_table_schema: 'string',
  foreign_table_name: 'string',
  foreign_column_name: 'string',
  constraint_name: 'string',
}).pipe(item => ({
  schema: item.table_schema,
  table: item.table_name,
  column: item.column_name,
  foreignSchema: item.foreign_table_schema,
  foreignTable: item.foreign_table_name,
  foreignColumn: item.foreign_column_name,
  name: item.constraint_name,
}))

export function foreignKeysSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.constraint_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY';
    `),
  }
}
