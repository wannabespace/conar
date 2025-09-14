import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { type } from 'arktype'

export const tablesAndSchemasType = type({
  schema: 'string',
  table: 'string',
}).array().pipe(tables => Object.entries(Object.groupBy(tables, table => table.schema)).map(([schema, tables]) => ({
  name: schema,
  tables: tables!.map(table => table.table),
})))

export function tablesAndSchemasSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      SELECT
        "table_schema" as schema,
        "table_name" as table
      FROM "information_schema"."tables"
      WHERE "table_schema" NOT IN ('pg_catalog', 'information_schema')
        AND "table_schema" NOT LIKE 'pg_toast%'
        AND "table_schema" NOT LIKE 'pg_temp%'
        AND "table_type" = 'BASE TABLE'
      ORDER BY "table_schema", "table_name";
    `),
  }
}
