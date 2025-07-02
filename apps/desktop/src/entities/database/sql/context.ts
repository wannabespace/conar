import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'

// 'constraints', (
//   SELECT json_agg(
//     json_build_object(
//       'name', c.conname,
//       'type', c.contype,
//       'related_column', CASE
//         WHEN c.contype = 'f' THEN (
//           SELECT a2.attname
//           FROM pg_catalog.pg_attribute a2
//           WHERE a2.attrelid = c.confrelid
//             AND a2.attnum = c.confkey[1]
//         )
//         ELSE null
//       END,
//       'related_table', CASE
//         WHEN c.contype = 'f' THEN (
//           SELECT c2.relname
//           FROM pg_catalog.pg_class c2
//           WHERE c2.oid = c.confrelid
//         )
//         ELSE null
//       END
//     )
//   )
//   FROM pg_catalog.pg_constraint c
//   WHERE c.conrelid = t.oid
//     AND a.attnum = ANY(c.conkey)
// )

export function contextSql(): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(`
      WITH schema_data AS (
        SELECT
          s.nspname as schema_name,
          json_agg(
            json_build_object(
              'name', t.relname,
              'columns', (
                SELECT json_agg(
                  json_build_object(
                    'name', a.attname,
                    'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
                    'nullable', NOT a.attnotnull,
                    'editable', CASE
                      WHEN a.attidentity = 'a' THEN false
                      WHEN a.attidentity = 'd' THEN false
                      WHEN a.attgenerated = 's' THEN false
                      ELSE true
                    END,
                    'default', pg_get_expr(d.adbin, d.adrelid)
                  )
                )
                FROM pg_catalog.pg_attribute a
                LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
                WHERE a.attrelid = t.oid
                  AND a.attnum > 0
                  AND NOT a.attisdropped
              )
            )
          ) as tables
        FROM pg_catalog.pg_namespace s
        JOIN pg_catalog.pg_class t ON t.relnamespace = s.oid
        WHERE s.nspname NOT IN ('pg_catalog', 'information_schema')
          AND s.nspname NOT LIKE 'pg_toast%'
          AND s.nspname NOT LIKE 'pg_temp%'
          AND t.relkind = 'r'
        GROUP BY s.nspname
      ),
      enum_data AS (
        SELECT json_agg(
          json_build_object(
            'schema', ns.nspname,
            'name', t.typname,
            'value', e.enumlabel
          )
        ) as enums
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_catalog.pg_namespace ns ON ns.oid = t.typnamespace
        WHERE ns.nspname NOT IN ('pg_catalog', 'information_schema')
      )
      SELECT json_build_object(
        'schemas', (
          SELECT json_agg(
            json_build_object(
              'schema', sd.schema_name,
              'tables', sd.tables
            )
          )
          FROM schema_data sd
        ),
        'enums', (SELECT enums FROM enum_data)
      ) AS database_context;
    `),
  }
}
