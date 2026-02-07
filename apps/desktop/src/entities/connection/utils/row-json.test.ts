import type { Column } from '../components/table/utils'
import { describe, expect, it } from 'bun:test'
import { rowToTypedJson } from './row-json'

function createColumn(id: string, type: string, isArray = false): Column {
  return { id, type, isArray }
}

describe('rowToTypedJson', () => {
  it('should map row values with type/name/value fields', () => {
    const columns = [
      createColumn('id', 'uuid'),
      createColumn('name', 'text'),
    ]

    const result = rowToTypedJson(
      { id: 'abc', name: 'john' },
      columns,
    )

    expect(result).toEqual([
      { type: 'uuid', name: 'id', value: 'abc' },
      { type: 'text', name: 'name', value: 'john' },
    ])
  })

  it('should normalize undefined to null', () => {
    const result = rowToTypedJson(
      { id: undefined },
      [createColumn('id', 'uuid')],
    )

    expect(result).toEqual([
      { type: 'uuid', name: 'id', value: null },
    ])
  })

  it('should convert Date and bigint values', () => {
    const now = new Date('2026-02-07T09:17:49.825Z')
    const result = rowToTypedJson(
      { created_at: now, count: 10n },
      [createColumn('created_at', 'timestamptz'), createColumn('count', 'bigint')],
    )

    expect(result).toEqual([
      { type: 'timestamptz', name: 'created_at', value: '2026-02-07T09:17:49.825Z' },
      { type: 'bigint', name: 'count', value: '10' },
    ])
  })

  it('should parse JSON array strings for array columns', () => {
    const result = rowToTypedJson(
      { tags: '["a","b"]' },
      [createColumn('tags', 'text[]', true)],
    )

    expect(result).toEqual([
      { type: 'text[]', name: 'tags', value: ['a', 'b'] },
    ])
  })

  it('should deeply normalize runtime array values for array columns', () => {
    const createdAt = new Date('2026-02-07T09:17:49.825Z')
    const updatedAt = new Date('2026-02-08T09:17:49.825Z')

    const result = rowToTypedJson(
      { tags: [10n, createdAt, [20n, updatedAt]] },
      [createColumn('tags', 'text[]', true)],
    )

    expect(result).toEqual([
      { type: 'text[]', name: 'tags', value: ['10', '2026-02-07T09:17:49.825Z', ['20', '2026-02-08T09:17:49.825Z']] },
    ])
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('should parse Postgres array literals for array columns', () => {
    const result = rowToTypedJson(
      { tags: '{"a","b",NULL}' },
      [createColumn('tags', 'text[]', true)],
    )

    expect(result).toEqual([
      { type: 'text[]', name: 'tags', value: ['a', 'b', null] },
    ])
  })

  it('should keep quoted NULL as string in Postgres array literals', () => {
    const result = rowToTypedJson(
      { tags: '{"NULL",NULL}' },
      [createColumn('tags', 'text[]', true)],
    )

    expect(result).toEqual([
      { type: 'text[]', name: 'tags', value: ['NULL', null] },
    ])
  })

  it('should keep raw string when array value is neither JSON nor Postgres literal', () => {
    const result = rowToTypedJson(
      { tags: 'not-an-array' },
      [createColumn('tags', 'text[]', true)],
    )

    expect(result).toEqual([
      { type: 'text[]', name: 'tags', value: 'not-an-array' },
    ])
  })
})
