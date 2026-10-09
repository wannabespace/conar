import { describe, expect, test } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { DialectAdapter, QueryCompiler } from 'kysely'
import {
  DummyDriver,
  Kysely,
  MssqlAdapter,
  MssqlQueryCompiler,
  MysqlAdapter,
  MysqlQueryCompiler,
  PostgresAdapter,
  PostgresQueryCompiler,
} from 'kysely'

import { capabilitiesOf } from '~/core/catalog/capabilities'

import {
  addColumnStatement,
  createTableStatement,
  dropColumnStatement,
  dropTableStatement,
  renameColumnStatement,
  renameTableStatement,
} from '.'
import { alterColumnStatement } from './alter-column'

// The app's own cold dialects reach the browser runtime, so compiling here
// stays on Kysely's own compilers; ClickHouse compiles through MySQL's.
const cold = (
  adapter: () => DialectAdapter,
  queryCompiler: () => QueryCompiler
) =>
  new Kysely<never>({
    dialect: {
      createAdapter: adapter,
      createDriver: () => new DummyDriver(),
      createIntrospector: () => {
        throw new Error('A statement test never introspects')
      },
      createQueryCompiler: queryCompiler,
    },
  })

const mysql = cold(
  () => new MysqlAdapter(),
  () => new MysqlQueryCompiler()
)
const mssql = cold(
  () => new MssqlAdapter(),
  () => new MssqlQueryCompiler()
)
const postgres = cold(
  () => new PostgresAdapter(),
  () => new PostgresQueryCompiler()
)

const target = { schema: 's', table: 't' }
const id = { name: 'id', nullable: false, primaryKey: true, type: 'integer' }
const note = { name: 'note', nullable: true, primaryKey: false, type: 'text' }
const mssqlDropDefault =
  "DECLARE @default nvarchar(max), @definition nvarchar(max), @statement nvarchar(max);\nSELECT @default = QUOTENAME(name), @definition = definition FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(@1) AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(@2), @3, 'ColumnId');\nSET @statement = N'ALTER TABLE ' + @4 + N' DROP CONSTRAINT ' + @default;\nIF @statement IS NOT NULL EXEC sp_executesql @statement;\n"

describe('createTable', () => {
  test('a single key is a column constraint the engine names', () => {
    expect(
      createTableStatement(ConnectionType.Postgres, postgres, {
        ...target,
        columns: [id, note],
      }).sql
    ).toBe(
      'create table "s"."t" ("id" integer not null primary key, "note" text)'
    )
  })

  test("New table's id fills itself on every engine with a sequence", () => {
    const newTableId = (type: ConnectionType) => ({
      ...id,
      type: capabilitiesOf(type).columnTypes.id,
    })
    const engines = [
      [ConnectionType.Postgres, postgres],
      [ConnectionType.MySQL, mysql],
      [ConnectionType.MSSQL, mssql],
    ] as const
    expect(
      engines.map(
        ([type, db]) =>
          createTableStatement(type, db, {
            ...target,
            columns: [newTableId(type)],
          }).sql
      )
    ).toEqual([
      'create table "s"."t" ("id" serial not null primary key)',
      'create table `s`.`t` (`id` int auto_increment not null primary key)',
      'create table "s"."t" ("id" int identity not null primary key)',
    ])
  })

  test('a composite key is a table constraint', () => {
    expect(
      createTableStatement(ConnectionType.Postgres, postgres, {
        ...target,
        columns: [id, { ...note, nullable: false, primaryKey: true }],
      }).sql
    ).toBe(
      'create table "s"."t" ("id" integer not null, "note" text not null, constraint "t_pkey" primary key ("id", "note"))'
    )
  })

  test('ClickHouse orders by the key and wraps nullable types', () => {
    expect(
      createTableStatement(ConnectionType.ClickHouse, mysql, {
        ...target,
        columns: [id, note],
      }).sql
    ).toBe(
      'create table `s`.`t` (`id` integer, `note` Nullable(text)) ENGINE = MergeTree ORDER BY (`id`)'
    )
  })

  test('ClickHouse without a key orders by tuple()', () => {
    expect(
      createTableStatement(ConnectionType.ClickHouse, mysql, {
        ...target,
        columns: [note],
      }).sql
    ).toEndWith('ORDER BY tuple()')
  })
})

test('SQL Server renames through sp_rename with a bracketed name', () => {
  const renameTable = renameTableStatement(ConnectionType.MSSQL, mssql, {
    ...target,
    newName: 'u',
  })
  expect(renameTable.sql).toBe('EXEC sp_rename @1, @2')
  expect(renameTable.parameters).toEqual(['[s].[t]', 'u'])

  const renameColumn = renameColumnStatement(ConnectionType.MSSQL, mssql, {
    ...target,
    column: 'a',
    newName: 'b',
  })
  expect(renameColumn.sql).toBe("EXEC sp_rename @1, @2, 'COLUMN'")
  expect(renameColumn.parameters).toEqual(['[s].[t].[a]', 'b'])
})

test('ClickHouse and MySQL rename with RENAME TABLE, which also takes a view', () => {
  for (const dialectType of [ConnectionType.ClickHouse, ConnectionType.MySQL]) {
    expect(
      renameTableStatement(dialectType, mysql, { ...target, newName: 'u' }).sql
    ).toBe('RENAME TABLE `s`.`t` TO `s`.`u`')
  }
})

test('only Postgres cascades a table drop', () => {
  const drop = { ...target, cascade: true }
  expect(dropTableStatement(ConnectionType.Postgres, postgres, drop).sql).toBe(
    'drop table "s"."t" cascade'
  )
  expect(dropTableStatement(ConnectionType.MySQL, mysql, drop).sql).toBe(
    'drop table `s`.`t`'
  )
})

test('ClickHouse wraps a nullable type, except an Array', () => {
  expect(
    addColumnStatement(ConnectionType.ClickHouse, mysql, {
      ...target,
      column: note,
    }).sql
  ).toBe('alter table `s`.`t` add column `note` Nullable(text)')
  expect(
    addColumnStatement(ConnectionType.ClickHouse, mysql, {
      ...target,
      column: { ...note, type: 'Array(String)' },
    }).sql
  ).toBe('alter table `s`.`t` add column `note` Array(String)')
})

test('SQL Server drops a column default before the column', () => {
  expect(
    dropColumnStatement(ConnectionType.MSSQL, mssql, {
      ...target,
      column: 'a',
    }).sql
  ).toBe(`${mssqlDropDefault}ALTER TABLE "s"."t" DROP COLUMN "a"`)
})

describe('alterColumn', () => {
  const original = {
    attributes: '',
    collation: null,
    comment: null,
    nullable: true,
    type: 'integer',
  }
  const retype = {
    ...target,
    column: 'a',
    nullable: false,
    original,
    type: 'bigint',
  }
  const nullabilityOnly = { ...retype, type: 'integer' }

  test('Postgres retypes through a cast, only when the type changed', () => {
    expect(
      alterColumnStatement(ConnectionType.Postgres, postgres, retype).sql
    ).toBe(
      'alter table "s"."t" alter column "a" type bigint USING "a"::bigint, alter column "a" set not null'
    )
    expect(
      alterColumnStatement(ConnectionType.Postgres, postgres, nullabilityOnly)
        .sql
    ).toBe('alter table "s"."t" alter column "a" set not null')
  })

  test('MySQL restates the clauses MODIFY would drop', () => {
    const mysqlOriginal = {
      attributes: "DEFAULT 'x' INVISIBLE",
      collation: 'utf8mb4_bin',
      comment: "it's a note",
      nullable: true,
      type: 'varchar(20)',
    }
    expect(
      alterColumnStatement(ConnectionType.MySQL, mysql, {
        ...retype,
        original: mysqlOriginal,
        type: 'varchar(20)',
      }).sql
    ).toBe(
      "alter table `s`.`t` modify column `a` varchar(20) COLLATE utf8mb4_bin DEFAULT 'x' INVISIBLE COMMENT 'it''s a note' not null"
    )
  })

  test('SQL Server keeps the collation, and moves the default off a retyped column', () => {
    const mssqlOriginal = { ...original, collation: 'Latin1_General_BIN' }
    expect(
      alterColumnStatement(ConnectionType.MSSQL, mssql, {
        ...nullabilityOnly,
        original: mssqlOriginal,
      }).sql
    ).toBe(
      'ALTER TABLE "s"."t" ALTER COLUMN "a" integer COLLATE Latin1_General_BIN NOT NULL'
    )
    expect(
      alterColumnStatement(ConnectionType.MSSQL, mssql, {
        ...retype,
        nullable: true,
        original: mssqlOriginal,
      }).sql
    ).toBe(
      `${mssqlDropDefault}ALTER TABLE "s"."t" ALTER COLUMN "a" bigint NULL;\nSET @statement = N'ALTER TABLE ' + @5 + N' ADD CONSTRAINT ' + @default + N' DEFAULT ' + @definition + N' FOR ' + @6;\nIF @statement IS NOT NULL EXEC sp_executesql @statement;`
    )
  })

  test('ClickHouse wraps Nullable inside LowCardinality', () => {
    expect(
      alterColumnStatement(ConnectionType.ClickHouse, mysql, {
        ...retype,
        nullable: true,
      }).sql
    ).toBe('alter table `s`.`t` modify column `a` Nullable(bigint)')
    expect(
      alterColumnStatement(ConnectionType.ClickHouse, mysql, {
        ...retype,
        nullable: true,
        type: 'LowCardinality(String)',
      }).sql
    ).toBe(
      'alter table `s`.`t` modify column `a` LowCardinality(Nullable(String))'
    )
  })
})
