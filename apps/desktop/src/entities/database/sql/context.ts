import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'

export function contextSql(): Record<DatabaseType, string> {
  return {
    // Just vibe code
    postgres: prepareSql(`
      SELECT json_build_object(
        'schemas', (
          SELECT json_agg(json_build_object(
            'schema', schemas.nspname,
            'tables', (
              SELECT json_agg(json_build_object(
                'name', tables.relname,
                'columns', (
                  SELECT json_agg(json_build_object(
                    'name', columns.attname,
                    'type', pg_catalog.format_type(columns.atttypid, columns.atttypmod),
                    'nullable', NOT columns.attnotnull,
                    'default', pg_get_expr(defaults.adbin, defaults.adrelid)
                  ))
                  FROM pg_catalog.pg_attribute columns
                  LEFT JOIN pg_catalog.pg_attrdef defaults
                    ON defaults.adrelid = columns.attrelid AND defaults.adnum = columns.attnum
                  WHERE columns.attrelid = tables.oid
                    AND columns.attnum > 0
                    AND NOT columns.attisdropped
                )
              ))
              FROM pg_catalog.pg_class tables
              WHERE tables.relnamespace = schemas.oid
                AND tables.relkind = 'r'
            )
          ))
          FROM pg_catalog.pg_namespace schemas
          WHERE schemas.nspname NOT IN ('pg_catalog', 'information_schema')
            AND schemas.nspname NOT LIKE 'pg_toast%'
            AND schemas.nspname NOT LIKE 'pg_temp%'
        ),
        'enums', (
          SELECT json_agg(json_build_object(
            'schema', enum_schemas.nspname,
            'name', enum_types.typname,
            'value', enum_labels.enumlabel
          ))
          FROM pg_type enum_types
          JOIN pg_enum enum_labels ON enum_types.oid = enum_labels.enumtypid
          JOIN pg_catalog.pg_namespace enum_schemas ON enum_schemas.oid = enum_types.typnamespace
          WHERE enum_schemas.nspname NOT IN ('pg_catalog', 'information_schema')
        )
      ) AS database_context;
    `),
  }
}
