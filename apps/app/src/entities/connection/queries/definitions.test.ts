import { describe, expect, test } from 'bun:test'

import type { DialectAdapter, QueryCompiler, RawBuilder } from 'kysely'
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

import type { ConstraintShape } from './constraints/shape'
import {
  addConstraint,
  clickhouseConstraintsOf,
  constraintClause,
} from './constraints/shape'
import { createFunctionStatements } from './functions/shape'
import {
  addSkipIndexStatement,
  createIndexStatement,
  skipIndexColumnsOf,
} from './indexes/shape'
import {
  clickhouseRoleList,
  createPolicyStatement,
  securityPredicate,
} from './policies/shape'
import { accountOf, privilegeOn } from './privileges/shape'
import { mssqlModuleBody, mssqlModuleParts } from './shared/definition'
import {
  createTriggerStatements,
  setTriggerEnabledStatements,
} from './triggers/shape'

// The app's own cold dialects reach the browser runtime, so compiling here
// stays on Kysely's own compilers.
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

const compilers = {
  mssql: cold(
    () => new MssqlAdapter(),
    () => new MssqlQueryCompiler()
  ),
  mysql: cold(
    () => new MysqlAdapter(),
    () => new MysqlQueryCompiler()
  ),
  postgres: cold(
    () => new PostgresAdapter(),
    () => new PostgresQueryCompiler()
  ),
}

const compiled = (
  statement: RawBuilder<unknown>,
  dialect: keyof typeof compilers = 'postgres'
) => statement.compile(compilers[dialect]).sql.replaceAll(/\s+/gu, ' ').trim()

const routine = (
  overrides: Partial<Parameters<typeof createFunctionStatements>[0]['shape']>
) =>
  createFunctionStatements({
    replace: true,
    schema: 'app',
    shape: {
      args: '',
      behavior: '',
      body: 'BEGIN END',
      extras: '',
      kind: 'function',
      language: 'plpgsql',
      name: 'f',
      returnType: 'integer',
      schemaBound: false,
      securityDefiner: false,
      ...overrides,
    },
  })

const trigger = (
  overrides: Partial<Parameters<typeof createTriggerStatements>[0]['shape']>
) =>
  createTriggerStatements({
    schema: 'app',
    shape: {
      body: 'BEGIN END',
      events: ['INSERT'],
      functionName: 'audit',
      functionSchema: 'app',
      name: 't',
      orientation: 'ROW',
      timing: 'AFTER',
      ...overrides,
    },
    table: 'users',
  })

describe('routine statements', () => {
  test('SQL Server takes procedure parameters without parentheses', () => {
    expect(
      compiled(routine({ kind: 'procedure' }).mssql, 'mssql')
    ).not.toInclude('(')
    expect(
      compiled(routine({ args: '@id int', kind: 'procedure' }).mssql, 'mssql')
    ).toInclude('"app"."f" @id int AS')
  })

  test('SQL Server functions keep their parentheses and return type', () => {
    expect(compiled(routine({ args: 'id int' }).mssql, 'mssql')).toBe(
      'CREATE OR ALTER FUNCTION "app"."f" (id int) RETURNS integer AS BEGIN END'
    )
  })

  test('SQL Server binds a function to its schema before AS', () => {
    expect(
      compiled(
        routine({
          body: 'RETURN (SELECT 1 AS ok)',
          returnType: 'TABLE',
          schemaBound: true,
        }).mssql,
        'mssql'
      )
    ).toBe(
      'CREATE OR ALTER FUNCTION "app"."f" () RETURNS TABLE WITH SCHEMABINDING AS RETURN (SELECT 1 AS ok)'
    )
  })

  test('Postgres replaces in place and quotes a body around its own tag', () => {
    expect(compiled(routine({ body: 'SELECT $tamery$' }).postgres)).toBe(
      'CREATE OR REPLACE FUNCTION "app"."f"() RETURNS integer LANGUAGE plpgsql AS $tamery1$SELECT $tamery$$tamery1$'
    )
  })

  test('a procedure returns nothing', () => {
    expect(compiled(routine({ kind: 'procedure' }).postgres)).not.toInclude(
      'RETURNS'
    )
  })
})

describe('trigger statements', () => {
  test('Postgres calls the function in the schema it lives in', () => {
    expect(
      compiled(
        trigger({ events: ['INSERT', 'UPDATE'], functionSchema: 'util' })
          .postgres
      )
    ).toBe(
      'CREATE TRIGGER "t" AFTER INSERT OR UPDATE ON "app"."users" FOR EACH ROW EXECUTE FUNCTION "util"."audit"()'
    )
  })

  test('MySQL runs the body for each row', () => {
    expect(compiled(trigger({}).mysql, 'mysql')).toBe(
      'CREATE TRIGGER `app`.`t` AFTER INSERT ON `app`.`users` FOR EACH ROW BEGIN END'
    )
  })

  test('SQL Server names the table before the timing', () => {
    expect(compiled(trigger({ timing: 'INSTEAD OF' }).mssql, 'mssql')).toBe(
      'CREATE TRIGGER "app"."t" ON "app"."users" INSTEAD OF INSERT AS BEGIN END'
    )
  })

  test('a replica trigger comes back as a replica trigger', () => {
    const target = { name: 't', schema: 'app', table: 'users' }

    expect(
      compiled(
        setTriggerEnabledStatements({ ...target, enabled: true, mode: 'R' })
          .postgres
      )
    ).toInclude('ENABLE REPLICA TRIGGER')
    expect(
      compiled(
        setTriggerEnabledStatements({ ...target, enabled: false, mode: 'A' })
          .postgres
      )
    ).toInclude('DISABLE TRIGGER')
  })
})

describe('a foreign key names its columns in order', () => {
  const shape: ConstraintShape = {
    columns: ['a', 'b'],
    expression: '',
    foreignColumns: ['x', 'y'],
    foreignSchema: 'ref',
    foreignTable: 'other',
    kind: 'foreignKey',
    name: 'fk',
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  }

  test('through the builder', () => {
    expect(
      addConstraint(
        compilers.postgres,
        { schema: 's', table: 't' },
        shape
      ).compile().sql
    ).toBe(
      'alter table "s"."t" add constraint "fk" foreign key ("a", "b") references "ref"."other" ("x", "y") on delete cascade on update no action'
    )
  })

  test('as the MySQL clause', () => {
    expect(compiled(constraintClause(shape))).toBe(
      'CONSTRAINT "fk" FOREIGN KEY ("a", "b") REFERENCES "ref"."other" ("x", "y") ON DELETE CASCADE ON UPDATE NO ACTION'
    )
  })
})

describe('a check wraps its condition', () => {
  const shape: ConstraintShape = {
    columns: [],
    expression: 'price > 0',
    foreignColumns: [],
    foreignSchema: '',
    foreignTable: '',
    kind: 'check',
    name: 'ck',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  }

  test('through the builder', () => {
    expect(
      addConstraint(
        compilers.postgres,
        { schema: 's', table: 't' },
        shape
      ).compile().sql
    ).toBe('alter table "s"."t" add constraint "ck" check (price > 0)')
  })

  test('as the MySQL clause', () => {
    expect(compiled(constraintClause(shape))).toBe(
      'CONSTRAINT "ck" CHECK (price > 0)'
    )
  })
})

test('a unique index covers its columns in order', () => {
  expect(
    compiled(
      createIndexStatement({
        columns: ['a', 'b'],
        name: 'i',
        schema: 's',
        table: 't',
        unique: true,
      })
    )
  ).toBe('CREATE UNIQUE INDEX "i" ON "s"."t" ("a", "b")')
})

describe('policy statements', () => {
  const policy = (roles: string[], using: string | null) =>
    compiled(
      createPolicyStatement({
        schema: 's',
        shape: {
          check: null,
          command: 'SELECT',
          kind: 'PERMISSIVE',
          name: 'p',
          roles,
          using,
        },
        table: 't',
      })
    )

  test('no role means PUBLIC', () => {
    expect(policy([], null)).toBe(
      'CREATE POLICY "p" ON "s"."t" AS PERMISSIVE FOR SELECT TO PUBLIC'
    )
  })

  test('roles are identifiers, keywords are not', () => {
    expect(policy(['reader', 'CURRENT_USER'], null)).toInclude(
      'TO "reader", CURRENT_USER'
    )
  })

  test('an expression is sent as written', () => {
    expect(policy([], "id = current_setting('x')::int")).toInclude(
      "USING (id = current_setting('x')::int)"
    )
  })
})

describe('security predicates', () => {
  const predicate = {
    arguments: 'TenantId',
    functionName: 'fn_tenant',
    functionSchema: 'Security',
    kind: 'BLOCK' as const,
    operation: 'AFTER INSERT' as const,
    schema: 'dbo',
    table: 'Orders',
  }

  test('a block operation follows the table', () => {
    expect(compiled(securityPredicate.add(predicate), 'mssql')).toBe(
      'ADD BLOCK PREDICATE "Security"."fn_tenant"(TenantId) ON "dbo"."Orders" AFTER INSERT'
    )
    expect(compiled(securityPredicate.drop(predicate), 'mssql')).toBe(
      'DROP BLOCK PREDICATE ON "dbo"."Orders" AFTER INSERT'
    )
  })

  test('parses the definition SQL Server stores', () => {
    expect(
      securityPredicate.parse('([Sec]]urity].[fn.tenant]([TenantId], 1))')
    ).toEqual({
      arguments: '[TenantId], 1',
      functionName: 'fn.tenant',
      functionSchema: 'Sec]urity',
    })
    expect(securityPredicate.parse('(1 = 1)')).toBeNull()
  })
})

describe('mssqlModuleBody', () => {
  test('a body starts after the AS that closes the header', () => {
    expect(mssqlModuleBody('CREATE PROCEDURE dbo.p @a int AS SELECT 1')).toBe(
      'SELECT 1'
    )
  })

  test('EXECUTE AS is not the header end', () => {
    expect(
      mssqlModuleBody(
        'CREATE PROCEDURE dbo.p WITH EXECUTE AS OWNER AS BEGIN SELECT 1 END'
      )
    ).toBe('BEGIN SELECT 1 END')
  })

  test('a parameter declared with AS is not the header end', () => {
    expect(
      mssqlModuleBody(
        'CREATE FUNCTION dbo.f (@a AS int) RETURNS int AS BEGIN RETURN @a END'
      )
    ).toBe('BEGIN RETURN @a END')
  })

  test('a lowercase as closes the header too', () => {
    expect(
      mssqlModuleBody('create trigger t on dbo.x after insert\nas\nselect 1')
    ).toBe('select 1')
  })

  test('a header that never closes reads back as nothing', () => {
    expect(mssqlModuleBody('CREATE PROCEDURE dbo.p')).toBeNull()
    expect(mssqlModuleBody(null)).toBeNull()
  })

  test('the header keeps a parameter default and a WITH option', () => {
    expect(
      mssqlModuleParts(
        'CREATE FUNCTION dbo.f (@a int = 5) RETURNS int WITH SCHEMABINDING AS BEGIN RETURN @a END'
      )?.header
    ).toBe(
      'CREATE FUNCTION dbo.f (@a int = 5) RETURNS int WITH SCHEMABINDING AS '
    )
  })

  test('a plain header carries neither', () => {
    expect(
      mssqlModuleParts('CREATE PROCEDURE dbo.p @a int AS SELECT 1')?.header
    ).toBe('CREATE PROCEDURE dbo.p @a int AS ')
  })
})

describe('ClickHouse', () => {
  test('reads constraints out of the table DDL', () => {
    expect(
      clickhouseConstraintsOf(
        "CREATE TABLE db.t (`id` UInt64, `note` String DEFAULT 'a, b', CONSTRAINT positive CHECK id > 0, CONSTRAINT `odd name` ASSUME length(note) < (10)) ENGINE = MergeTree ORDER BY id"
      )
    ).toEqual([
      { assume: false, expression: 'id > 0', name: 'positive' },
      { assume: true, expression: 'length(note) < (10)', name: 'odd name' },
    ])
  })

  test('adds a skip index over a tuple of columns', () => {
    expect(
      compiled(
        addSkipIndexStatement({
          columns: ['a', 'b'],
          granularity: 4,
          name: 'i',
          schema: 's',
          skipType: 'minmax',
          table: 't',
        }),
        'mysql'
      )
    ).toBe(
      'ALTER TABLE `s`.`t` ADD INDEX `i` (`a`, `b`) TYPE minmax GRANULARITY 4'
    )
  })

  test('reads skip index columns back, or none for an expression', () => {
    expect(skipIndexColumnsOf('tuple(a, `b c`)')).toEqual(['a', 'b c'])
    expect(skipIndexColumnsOf('lower(a)')).toBeNull()
  })

  test('round-trips a row policy audience', () => {
    expect(compiled(clickhouseRoleList(['ALL', 'EXCEPT bob']), 'mysql')).toBe(
      'ALL EXCEPT `bob`'
    )
    expect(compiled(clickhouseRoleList([]), 'mysql')).toBe('ALL')
  })
})

describe('a MySQL privilege', () => {
  test('reads the account the way the catalog and a user write it', () => {
    expect(compiled(accountOf("'bob'@'%'"), 'mysql')).toBe("'bob'@'%'")
    expect(compiled(accountOf('bob@localhost'), 'mysql')).toBe(
      "'bob'@'localhost'"
    )
    expect(compiled(accountOf('bob'), 'mysql')).toBe("'bob'@'%'")
  })

  test('covers a database or one table', () => {
    const target = { grantee: 'bob', privilege: 'SELECT', schema: 'app' }

    expect(compiled(privilegeOn({ ...target, table: '*' }), 'mysql')).toBe(
      'SELECT ON `app`.*'
    )
    expect(compiled(privilegeOn({ ...target, table: 't' }), 'mysql')).toBe(
      'SELECT ON `app`.`t`'
    )
  })
})
