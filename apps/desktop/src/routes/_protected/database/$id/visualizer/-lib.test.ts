import { describe, expect, it } from 'bun:test'
import { applySearchHighlight, getSearchState } from './-lib'

function createNode(table: string) {
  return {
    id: table,
    type: 'tableNode',
    position: { x: 0, y: 0 },
    data: {
      databaseId: 'db',
      schema: 'public',
      table,
      columns: [],
      edges: [],
    },
  }
}

describe('getSearchState', () => {
  it('returns an inactive state for an empty query', () => {
    const result = getSearchState({ columns: [{ id: 'created_at', type: 'timestamp', schema: 'public', table: 'users', default: null, label: 'created_at', isNullable: true, isEditable: true }], tables: ['users', 'posts'], query: ' ' })

    expect(result.isActive).toBe(false)
    expect([...result.matchedTables]).toEqual([])
  })

  it('matches tables case-insensitively', () => {
    const result = getSearchState({ columns: [{ id: 'created_at', type: 'timestamp', schema: 'public', table: 'users', default: null, label: 'created_at', isNullable: true, isEditable: true }], tables: ['users', 'user_logs', 'posts'], query: 'UsEr' })

    expect(result.isActive).toBe(true)
    expect([...result.matchedTables].sort()).toEqual(['user_logs', 'users'])
  })

  it('keeps search active even when no table matches', () => {
    const result = getSearchState({ columns: [{ id: 'created_at', type: 'timestamp', schema: 'public', table: 'users', default: null, label: 'created_at', isNullable: true, isEditable: true }], tables: ['users', 'posts'], query: 'orders' })

    expect(result.isActive).toBe(true)
    expect([...result.matchedTables]).toEqual([])
  })
})

describe('applySearchHighlight', () => {
  it('flags matched and unmatched nodes when search is active', () => {
    const nodes = [createNode('users'), createNode('posts')]
    const highlighted = applySearchHighlight({
      nodes: nodes as Parameters<typeof applySearchHighlight>[0]['nodes'],
      isSearchActive: true,
      matchedTables: new Set(['users']),
      matchedColumns: new Set(['created_at']),
    })

    expect(highlighted[0]?.data.searchActive).toBe(true)
    expect(highlighted[0]?.data.tableSearchMatched).toBe(true)
    expect(highlighted[1]?.data.searchActive).toBe(true)
    expect(highlighted[1]?.data.tableSearchMatched).toBe(false)
  })

  it('resets highlight flags when search is inactive', () => {
    const nodes = [createNode('users'), createNode('posts')]
    const highlighted = applySearchHighlight({
      nodes: nodes as Parameters<typeof applySearchHighlight>[0]['nodes'],
      isSearchActive: false,
      matchedTables: new Set(['users']),
      matchedColumns: new Set(['created_at']),
    })

    expect(highlighted[0]?.data.searchActive).toBe(false)
    expect(highlighted[0]?.data.tableSearchMatched).toBe(false)
    expect(highlighted[1]?.data.searchActive).toBe(false)
    expect(highlighted[1]?.data.tableSearchMatched).toBe(false)
  })
})
