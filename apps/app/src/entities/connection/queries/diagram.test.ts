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

import type { DiagramDraft } from './diagram/shape'
import { diagramDraftType, draftStatement } from './diagram/shape'

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

const compilers = {
  [ConnectionType.ClickHouse]: mysql,
  [ConnectionType.MSSQL]: cold(
    () => new MssqlAdapter(),
    () => new MssqlQueryCompiler()
  ),
  [ConnectionType.MySQL]: mysql,
  [ConnectionType.Postgres]: cold(
    () => new PostgresAdapter(),
    () => new PostgresQueryCompiler()
  ),
}

const compiled = (dialectType: ConnectionType, draft: DiagramDraft) =>
  draftStatement(dialectType, compilers[dialectType], draft).sql

const target = { id: 'd', schema: 's', table: 't' }
const id = { name: 'id', nullable: false, primaryKey: true, type: 'integer' }
const note = { name: 'note', nullable: true, primaryKey: false, type: 'text' }
const columns = [id, note]

describe('createTable', () => {
  const draft: DiagramDraft = { ...target, columns, kind: 'createTable' }

  test('Postgres', () => {
    expect(compiled(ConnectionType.Postgres, draft)).toBe(
      'create table "s"."t" ("id" integer not null, "note" text, constraint "t_pkey" primary key ("id"))'
    )
  })

  test('MySQL', () => {
    expect(compiled(ConnectionType.MySQL, draft)).toBe(
      'create table `s`.`t` (`id` integer not null, `note` text, constraint `t_pkey` primary key (`id`))'
    )
  })

  test('SQL Server', () => {
    expect(compiled(ConnectionType.MSSQL, draft)).toBe(
      'create table "s"."t" ("id" integer not null, "note" text, constraint "t_pkey" primary key ("id"))'
    )
  })

  test('ClickHouse orders by the key and wraps nullable types', () => {
    expect(compiled(ConnectionType.ClickHouse, draft)).toBe(
      'CREATE TABLE `s`.`t` (`id` integer, `note` Nullable(text)) ENGINE = MergeTree ORDER BY (`id`)'
    )
  })

  test('ClickHouse without a key orders by tuple()', () => {
    expect(
      compiled(ConnectionType.ClickHouse, { ...draft, columns: [note] })
    ).toEndWith('ORDER BY tuple()')
  })
})

describe('renameTable', () => {
  const draft: DiagramDraft = { ...target, kind: 'renameTable', newName: 'u' }

  test('Postgres', () => {
    expect(compiled(ConnectionType.Postgres, draft)).toBe(
      'alter table "s"."t" rename to "u"'
    )
  })

  test('MySQL', () => {
    expect(compiled(ConnectionType.MySQL, draft)).toBe(
      'alter table `s`.`t` rename to `u`'
    )
  })

  test('SQL Server', () => {
    expect(compiled(ConnectionType.MSSQL, draft)).toBe('EXEC sp_rename @1, @2')
  })

  test('ClickHouse', () => {
    expect(compiled(ConnectionType.ClickHouse, draft)).toBe(
      'RENAME TABLE `s`.`t` TO `s`.`u`'
    )
  })
})

describe('dropTable', () => {
  const draft: DiagramDraft = { ...target, cascade: true, kind: 'dropTable' }

  test('only Postgres cascades', () => {
    expect(compiled(ConnectionType.Postgres, draft)).toBe(
      'drop table "s"."t" cascade'
    )
    expect(compiled(ConnectionType.MySQL, draft)).toBe('drop table `s`.`t`')
    expect(compiled(ConnectionType.MSSQL, draft)).toBe('drop table "s"."t"')
    expect(compiled(ConnectionType.ClickHouse, draft)).toBe(
      'drop table `s`.`t`'
    )
  })
})

describe('addColumn', () => {
  const draft: DiagramDraft = {
    ...target,
    column: id,
    kind: 'addColumn',
  }

  test('Postgres', () => {
    expect(compiled(ConnectionType.Postgres, draft)).toBe(
      'alter table "s"."t" add column "id" integer not null'
    )
  })

  test('MySQL', () => {
    expect(compiled(ConnectionType.MySQL, draft)).toBe(
      'alter table `s`.`t` add column `id` integer not null'
    )
  })

  test('SQL Server', () => {
    expect(compiled(ConnectionType.MSSQL, draft)).toBe(
      'alter table "s"."t" add "id" integer not null'
    )
  })

  test('ClickHouse wraps a nullable type', () => {
    expect(
      compiled(ConnectionType.ClickHouse, { ...draft, column: note })
    ).toBe('alter table `s`.`t` add column `note` Nullable(text)')
  })
})

describe('renameColumn', () => {
  const draft: DiagramDraft = {
    ...target,
    column: 'a',
    kind: 'renameColumn',
    newName: 'b',
  }

  test('Postgres', () => {
    expect(compiled(ConnectionType.Postgres, draft)).toBe(
      'alter table "s"."t" rename column "a" to "b"'
    )
  })

  test('MySQL', () => {
    expect(compiled(ConnectionType.MySQL, draft)).toBe(
      'alter table `s`.`t` rename column `a` to `b`'
    )
  })

  test('SQL Server', () => {
    expect(compiled(ConnectionType.MSSQL, draft)).toBe(
      "EXEC sp_rename @1, @2, 'COLUMN'"
    )
  })

  test('ClickHouse', () => {
    expect(compiled(ConnectionType.ClickHouse, draft)).toBe(
      'alter table `s`.`t` rename column `a` to `b`'
    )
  })
})

describe('alterColumn', () => {
  const draft: DiagramDraft = {
    ...target,
    column: 'a',
    kind: 'alterColumn',
    nullable: false,
    type: 'bigint',
  }

  test('Postgres', () => {
    expect(compiled(ConnectionType.Postgres, draft)).toBe(
      'alter table "s"."t" alter column "a" type bigint, alter column "a" set not null'
    )
    expect(
      compiled(ConnectionType.Postgres, { ...draft, nullable: true })
    ).toBe(
      'alter table "s"."t" alter column "a" type bigint, alter column "a" drop not null'
    )
  })

  test('MySQL', () => {
    expect(compiled(ConnectionType.MySQL, draft)).toBe(
      'alter table `s`.`t` modify column `a` bigint not null'
    )
  })

  test('SQL Server', () => {
    expect(compiled(ConnectionType.MSSQL, draft)).toBe(
      'ALTER TABLE "s"."t" ALTER COLUMN "a" bigint NOT NULL'
    )
    expect(compiled(ConnectionType.MSSQL, { ...draft, nullable: true })).toBe(
      'ALTER TABLE "s"."t" ALTER COLUMN "a" bigint NULL'
    )
  })

  test('ClickHouse', () => {
    expect(
      compiled(ConnectionType.ClickHouse, { ...draft, nullable: true })
    ).toBe('ALTER TABLE `s`.`t` MODIFY COLUMN `a` Nullable(bigint)')
  })
})

describe('dropColumn', () => {
  const draft: DiagramDraft = { ...target, column: 'a', kind: 'dropColumn' }

  test('every dialect', () => {
    expect(compiled(ConnectionType.Postgres, draft)).toBe(
      'alter table "s"."t" drop column "a"'
    )
    expect(compiled(ConnectionType.MySQL, draft)).toBe(
      'alter table `s`.`t` drop column `a`'
    )
    expect(compiled(ConnectionType.MSSQL, draft)).toBe(
      'alter table "s"."t" drop column "a"'
    )
    expect(compiled(ConnectionType.ClickHouse, draft)).toBe(
      'alter table `s`.`t` drop column `a`'
    )
  })
})

describe('addForeignKey', () => {
  const draft: DiagramDraft = {
    ...target,
    columns: ['a'],
    foreignColumns: ['x'],
    foreignSchema: 'r',
    foreignTable: 'o',
    kind: 'addForeignKey',
    name: 'fk',
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  }

  test('Postgres', () => {
    expect(compiled(ConnectionType.Postgres, draft)).toBe(
      'alter table "s"."t" add constraint "fk" foreign key ("a") references "r"."o" ("x") on delete cascade on update no action'
    )
  })

  test('MySQL', () => {
    expect(compiled(ConnectionType.MySQL, draft)).toBe(
      'alter table `s`.`t` add constraint `fk` foreign key (`a`) references `r`.`o` (`x`) on delete cascade on update no action'
    )
  })

  test('SQL Server', () => {
    expect(compiled(ConnectionType.MSSQL, draft)).toBe(
      'alter table "s"."t" add constraint "fk" foreign key ("a") references "r"."o" ("x") on delete cascade on update no action'
    )
  })

  test('ClickHouse has none', () => {
    expect(() => compiled(ConnectionType.ClickHouse, draft)).toThrow(
      'Foreign keys is not supported'
    )
  })
})

describe('dropForeignKey', () => {
  const draft: DiagramDraft = { ...target, kind: 'dropForeignKey', name: 'fk' }

  test('Postgres', () => {
    expect(compiled(ConnectionType.Postgres, draft)).toBe(
      'alter table "s"."t" drop constraint "fk"'
    )
  })

  test('MySQL drops the key, not a constraint', () => {
    expect(compiled(ConnectionType.MySQL, draft)).toBe(
      'ALTER TABLE `s`.`t` DROP FOREIGN KEY `fk`'
    )
  })

  test('SQL Server', () => {
    expect(compiled(ConnectionType.MSSQL, draft)).toBe(
      'alter table "s"."t" drop constraint "fk"'
    )
  })

  test('ClickHouse has none', () => {
    expect(() => compiled(ConnectionType.ClickHouse, draft)).toThrow(
      'Foreign keys is not supported'
    )
  })
})

test('a draft validates by kind', () => {
  expect(
    diagramDraftType.allows({ ...target, column: 'a', kind: 'dropColumn' })
  ).toBe(true)
  expect(diagramDraftType.allows({ ...target, kind: 'dropColumn' })).toBe(false)
})
