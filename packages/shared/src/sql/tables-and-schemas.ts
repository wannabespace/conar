import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

export const tablesAndSchemasType = type({
  table_schema: 'string',
  table_name: 'string',
}).array().pipe(tables => Object.entries(Object.groupBy(tables, table => table.table_schema)).map(([schema, tables]) => ({
  name: schema,
  tables: tables!.map(table => table.table_name),
})))

export function tablesAndSchemasSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        "table_schema",
        "table_name"
      FROM "information_schema"."tables"
      WHERE "table_schema" NOT IN ('pg_catalog', 'information_schema')
        AND "table_schema" NOT LIKE 'pg_toast%'
        AND "table_schema" NOT LIKE 'pg_temp%'
        AND "table_type" = 'BASE TABLE'
      ORDER BY "table_schema", "table_name";
    `),
  }
}
