import { expect, test } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { DummyDriver, Kysely, MysqlAdapter, MysqlQueryCompiler } from 'kysely'

import { dropConstraintStatement } from './shape'

// The app's own cold dialects reach the browser runtime, so compiling here
// stays on Kysely's own compilers; ClickHouse compiles through MySQL's.
const mysql = new Kysely<never>({
  dialect: {
    createAdapter: () => new MysqlAdapter(),
    createDriver: () => new DummyDriver(),
    createIntrospector: () => {
      throw new Error('A statement test never introspects')
    },
    createQueryCompiler: () => new MysqlQueryCompiler(),
  },
})

test('only MySQL drops a key through its own clause', () => {
  const target = {
    cascade: false,
    kind: 'foreignKey',
    name: 'fk',
    schema: 's',
    table: 't',
  } as const

  expect(dropConstraintStatement(ConnectionType.MySQL, mysql, target).sql).toBe(
    'ALTER TABLE `s`.`t` DROP FOREIGN KEY `fk`'
  )
  expect(
    dropConstraintStatement(ConnectionType.ClickHouse, mysql, {
      ...target,
      kind: 'check',
    }).sql
  ).toBe('alter table `s`.`t` drop constraint `fk`')
})
