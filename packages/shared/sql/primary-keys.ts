import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import * as z from 'zod'

export const primaryKeySchema = z.object({
  table: z.string(),
  schema: z.string(),
  primary_keys: z.string(),
}).transform(({ primary_keys, ...rest }) => ({
  ...rest,
  primaryKeys: primary_keys.split(',').map(key => key.trim()),
}))

export function primaryKeysSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT DISTINCT
        tc.table_name AS table,
        tc.table_schema AS schema,
        string_agg(kcu.column_name, ',') AS primary_keys
      FROM
        information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema NOT LIKE 'pg_temp%'
        AND tc.table_schema NOT LIKE 'pg_toast_temp%'
        AND tc.table_schema NOT LIKE 'temp%'
        AND tc.constraint_type = 'PRIMARY KEY'
      GROUP BY
        tc.table_name,
        tc.table_schema;
    `),
  }
}
