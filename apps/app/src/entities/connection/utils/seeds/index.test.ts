import { describe, expect, test } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import {
  autoDetectGenerator,
  generateRows,
  getGeneratorGroups,
  insertBatchSize,
} from '.'
import type { Column } from '../../components/table/cell/utils'
import { REFERENCE_GENERATOR, SKIP_GENERATOR } from './types'

const column = (partial: Partial<Column> & { id: string }): Column => ({
  uiType: 'raw',
  ...partial,
})

describe('autoDetectGenerator', () => {
  test('database-generated and defaulted columns are left to the database', () => {
    expect(
      autoDetectGenerator(
        column({ id: 'id', isGenerated: true, typeLabel: 'int' }),
        ConnectionType.MySQL
      )
    ).toBe(SKIP_GENERATOR)
    expect(
      autoDetectGenerator(
        column({
          defaultValue: 'now()',
          id: 'created_at',
          typeLabel: 'timestamptz',
        }),
        ConnectionType.Postgres
      )
    ).toBe(SKIP_GENERATOR)
  })

  test('foreign keys win over everything', () => {
    expect(
      autoDetectGenerator(
        column({
          foreign: {
            column: 'id',
            name: 'fk',
            schema: 'public',
            table: 'users',
          },
          id: 'user_id',
          typeLabel: 'uuid',
        }),
        ConnectionType.Postgres
      )
    ).toBe(REFERENCE_GENERATOR)
  })

  test('name rules apply only inside a compatible type family', () => {
    expect(
      autoDetectGenerator(
        column({ id: 'title', typeLabel: 'text' }),
        ConnectionType.Postgres
      )
    ).toBe('lorem.sentence')
    expect(
      autoDetectGenerator(
        column({ id: 'title', typeLabel: 'integer' }),
        ConnectionType.Postgres
      )
    ).toBe('number.int')
    expect(
      autoDetectGenerator(
        column({ id: 'price', typeLabel: 'numeric' }),
        ConnectionType.Postgres
      )
    ).toBe('commerce.price')
  })

  test('text columns named like ids get opaque identifiers', () => {
    expect(
      autoDetectGenerator(
        column({ id: 'provider_id', typeLabel: 'text' }),
        ConnectionType.Postgres
      )
    ).toBe('string.alphanumeric')
  })

  test('datetime types are never mistaken for time', () => {
    expect(
      autoDetectGenerator(
        column({ id: 'at', typeLabel: 'DateTime64(3)' }),
        ConnectionType.ClickHouse
      )
    ).toBe('date.recent')
    expect(
      autoDetectGenerator(
        column({ id: 'at', typeLabel: 'time' }),
        ConnectionType.Postgres
      )
    ).toBe('date.time')
  })

  test('dialect type maps come before families', () => {
    expect(
      autoDetectGenerator(
        column({ id: 'span', typeLabel: 'interval' }),
        ConnectionType.Postgres
      )
    ).toBe('postgres.interval')
    expect(
      autoDetectGenerator(
        column({ id: 'flag', typeLabel: 'tinyint' }),
        ConnectionType.MySQL
      )
    ).toBe('datatype.boolean')
  })
})

describe('getGeneratorGroups', () => {
  test('only the connection dialect contributes its generators', () => {
    const groups = getGeneratorGroups(ConnectionType.Postgres).map(
      (g) => g.value
    )
    expect(groups[0]).toBe('Special')
    expect(groups).toContain('Postgres')
    expect(groups).not.toContain('MySQL')
  })
})

describe('insertBatchSize', () => {
  test('respects the MSSQL parameter cap', () => {
    expect(insertBatchSize(ConnectionType.MSSQL, 5)).toBe(400)
    expect(insertBatchSize(ConnectionType.MSSQL, 2)).toBe(500)
    expect(insertBatchSize(ConnectionType.Postgres, 200)).toBe(500)
  })
})

describe('generateRows', () => {
  test('bounds integers and decimals by the column type', () => {
    const rows = generateRows({
      columnGenerators: {
        code: { generatorId: 'number.int', isNullable: false },
        price: { generatorId: 'number.float', isNullable: false },
      },
      columns: [
        column({ id: 'code', typeLabel: 'UInt8' }),
        column({ id: 'price', precision: 4, scale: 2, typeLabel: 'numeric' }),
      ],
      count: 200,
      dialect: ConnectionType.ClickHouse,
    })
    for (const row of rows) {
      expect(row.code).toBeLessThanOrEqual(255)
      expect(row.price).toBeLessThanOrEqual(99.99)
    }
  })

  test('unique columns do not repeat, JSON is stringified, references are picked', () => {
    const rows = generateRows({
      columnGenerators: {
        meta: { generatorId: 'json.object', isNullable: false },
        owner: { generatorId: REFERENCE_GENERATOR, isNullable: false },
        slug: { generatorId: 'number.int', isNullable: false },
      },
      columns: [
        column({ id: 'meta', typeLabel: 'json' }),
        column({ id: 'owner', typeLabel: 'int' }),
        column({ id: 'slug', typeLabel: 'int', unique: 'slug_key' }),
      ],
      count: 50,
      dialect: ConnectionType.MySQL,
      referenceData: { owner: [1, 2] },
    })
    expect(new Set(rows.map((r) => r.slug)).size).toBe(50)
    expect(typeof rows[0]?.meta).toBe('string')
    expect(rows.every((r) => r.owner === 1 || r.owner === 2)).toBe(true)
  })

  test('a nullable reference to an empty table becomes NULL', () => {
    const rows = generateRows({
      columnGenerators: {
        parent: { generatorId: REFERENCE_GENERATOR, isNullable: false },
      },
      columns: [column({ id: 'parent', isNullable: true, typeLabel: 'int' })],
      count: 3,
      dialect: ConnectionType.Postgres,
      referenceData: { parent: [] },
    })
    expect(rows).toEqual([{ parent: null }, { parent: null }, { parent: null }])
  })
})
