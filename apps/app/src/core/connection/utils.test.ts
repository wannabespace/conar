import { describe, expect, it } from 'bun:test'

import { groupInSchema, wrapExplainQuery } from './utils'

describe('wrapExplainQuery', () => {
  it('should prepend EXPLAIN to a query that does not start with it', () => {
    expect(wrapExplainQuery('SELECT * FROM users')).toBe(
      'EXPLAIN SELECT * FROM users'
    )
    expect(wrapExplainQuery('  SELECT * FROM users  ')).toBe(
      'EXPLAIN SELECT * FROM users'
    )
  })

  it('should not double-wrap when query already starts with EXPLAIN', () => {
    expect(wrapExplainQuery('EXPLAIN SELECT * FROM users')).toBe(
      'EXPLAIN SELECT * FROM users'
    )
    expect(wrapExplainQuery('  EXPLAIN ANALYZE SELECT * FROM users')).toBe(
      '  EXPLAIN ANALYZE SELECT * FROM users'
    )
  })
})

describe('groupInSchema', () => {
  const rows = [
    { column: 'a', name: 'pk', schema: 'public' },
    { column: 'b', name: 'pk', schema: 'public' },
    { column: 'c', name: 'pk', schema: 'other' },
    { column: 'd', name: 'uq', schema: 'public' },
  ]
  const group = (schema?: string) =>
    groupInSchema(rows, schema, {
      key: (row) => row.name,
      merge: (columns: string[], row) => columns.push(row.column),
      seed: () => [],
    })

  it('folds the rows of one object together, in first-seen order', () => {
    expect(group('public')).toEqual([['a', 'b'], ['d']])
  })

  it('ignores every other schema', () => {
    expect(group('other')).toEqual([['c']])
    expect(group()).toEqual([])
  })
})
