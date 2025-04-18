import type { DatabaseType } from '@connnect/shared/enums/database-type'

export function totalSql(schema: string, table: string): Record<DatabaseType, string> {
  return {
    postgres: `
      SELECT
        CASE
          WHEN reltuples < 0 THEN (
            SELECT
              COUNT(*)
            FROM
              "${schema}"."${table}"
          )
          ELSE reltuples::bigint
        END AS total
      FROM
        pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE
        n.nspname = '${schema}'
        AND c.relname = '${table}';
    `,
  }
}
