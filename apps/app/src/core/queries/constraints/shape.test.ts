import { expect, test } from 'bun:test'

import { coldDialect } from '@tamery/connection/queries/kysely'
import { Dialect } from '@tamery/shared/enums/connection-type'

import { dropConstraintStatement } from './shape'

test('only MySQL drops a key through its own clause', () => {
  const target = {
    cascade: false,
    kind: 'foreignKey',
    name: 'fk',
    schema: 's',
    table: 't',
  } as const

  expect(
    dropConstraintStatement(Dialect.MySQL, coldDialect(Dialect.MySQL), target)
      .sql
  ).toBe('ALTER TABLE `s`.`t` DROP FOREIGN KEY `fk`')
  expect(
    dropConstraintStatement(
      Dialect.ClickHouse,
      coldDialect(Dialect.ClickHouse),
      {
        ...target,
        kind: 'check',
      }
    ).sql
  ).toBe('alter table `s`.`t` drop constraint `fk`')
})
