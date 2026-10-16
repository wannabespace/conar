import type { Kysely } from 'kysely'
import { sql } from 'kysely'

import type { Database as MssqlDatabase } from '~/core/runtime/dialects/mssql/schema'

import { LISTED_CONSTRAINT_TYPES } from '../shape'

export const mssqlConstraints = (db: Kysely<MssqlDatabase>) =>
  db
    .selectFrom('information_schema.TABLE_CONSTRAINTS as tc')
    .leftJoin('information_schema.KEY_COLUMN_USAGE as kcu', (join) =>
      join
        .onRef('tc.CONSTRAINT_NAME', '=', 'kcu.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'kcu.CONSTRAINT_SCHEMA')
        .onRef('tc.TABLE_SCHEMA', '=', 'kcu.TABLE_SCHEMA')
        .onRef('tc.TABLE_NAME', '=', 'kcu.TABLE_NAME')
    )
    .leftJoin('information_schema.REFERENTIAL_CONSTRAINTS as rc', (join) =>
      join
        .onRef('tc.CONSTRAINT_NAME', '=', 'rc.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'rc.CONSTRAINT_SCHEMA')
    )
    .leftJoin('information_schema.CHECK_CONSTRAINTS as cc', (join) =>
      join
        .onRef('tc.CONSTRAINT_NAME', '=', 'cc.CONSTRAINT_NAME')
        .onRef('tc.CONSTRAINT_SCHEMA', '=', 'cc.CONSTRAINT_SCHEMA')
    )
    // A key may reference a unique index rather than a constraint, which
    // KEY_COLUMN_USAGE never lists, so the referenced side comes from sys.
    .leftJoin('sys.schemas as fs', 'fs.name', 'tc.CONSTRAINT_SCHEMA')
    .leftJoin('sys.foreign_keys as fk', (join) =>
      join
        .onRef('fk.name', '=', 'tc.CONSTRAINT_NAME')
        .onRef('fk.schema_id', '=', 'fs.schema_id')
    )
    .leftJoin('sys.foreign_key_columns as fkc', (join) =>
      join
        .onRef('fkc.constraint_object_id', '=', 'fk.object_id')
        .onRef('fkc.constraint_column_id', '=', 'kcu.ORDINAL_POSITION')
    )
    .leftJoin('sys.columns as referenced_column', (join) =>
      join
        .onRef('referenced_column.object_id', '=', 'fkc.referenced_object_id')
        .onRef('referenced_column.column_id', '=', 'fkc.referenced_column_id')
    )
    .leftJoin(
      'sys.tables as referenced_table',
      'referenced_table.object_id',
      'fkc.referenced_object_id'
    )
    .leftJoin(
      'sys.schemas as referenced_schema',
      'referenced_schema.schema_id',
      'referenced_table.schema_id'
    )
    .select([
      'tc.TABLE_SCHEMA as schema',
      'tc.TABLE_NAME as table',
      'tc.CONSTRAINT_NAME as name',
      'tc.CONSTRAINT_TYPE as type',
      'kcu.COLUMN_NAME as column',
      'referenced_schema.name as foreign_schema',
      'referenced_table.name as foreign_table',
      'referenced_column.name as foreign_column',
      'rc.DELETE_RULE as onDelete',
      'rc.UPDATE_RULE as onUpdate',
      'cc.CHECK_CLAUSE as expression',
      // A disabled, untrusted or not-for-replication key or check comes
      // back plain from a drop-and-add, so the form only renames it.
      (eb) =>
        eb
          .case()
          .when(
            eb.or([
              eb.exists(
                eb
                  .selectFrom('sys.foreign_keys as fk')
                  .innerJoin(
                    'sys.schemas as fs',
                    'fs.schema_id',
                    'fk.schema_id'
                  )
                  .select(sql.lit(1).as('one'))
                  .whereRef('fk.name', '=', 'tc.CONSTRAINT_NAME')
                  .whereRef('fs.name', '=', 'tc.CONSTRAINT_SCHEMA')
                  .where((sub) =>
                    sub.or([
                      sub('fk.is_disabled', '=', true),
                      sub('fk.is_not_trusted', '=', true),
                      sub('fk.is_not_for_replication', '=', true),
                    ])
                  )
              ),
              eb.exists(
                eb
                  .selectFrom('sys.check_constraints as ck')
                  .innerJoin(
                    'sys.schemas as ks',
                    'ks.schema_id',
                    'ck.schema_id'
                  )
                  .select(sql.lit(1).as('one'))
                  .whereRef('ck.name', '=', 'tc.CONSTRAINT_NAME')
                  .whereRef('ks.name', '=', 'tc.CONSTRAINT_SCHEMA')
                  .where((sub) =>
                    sub.or([
                      sub('ck.is_disabled', '=', true),
                      sub('ck.is_not_trusted', '=', true),
                      sub('ck.is_not_for_replication', '=', true),
                    ])
                  )
              ),
            ])
          )
          .then(1)
          .else(0)
          .end()
          .as('is_custom'),
    ])
    .$narrowType<{ is_custom: 1 | 0 }>()
    .where('tc.CONSTRAINT_TYPE', 'in', LISTED_CONSTRAINT_TYPES)
    .where('tc.TABLE_SCHEMA', 'not in', ['INFORMATION_SCHEMA', 'sys'])
    .orderBy('kcu.ORDINAL_POSITION')
    .execute()
