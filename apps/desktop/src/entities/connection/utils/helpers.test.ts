import { describe, expect, it } from 'bun:test'
import { hasDangerousSqlKeywords, wrapExplainQuery } from './helpers'

describe('hasDangerousSqlKeywords', () => {
  it('should return true for SQL queries containing DELETE keyword', () => {
    expect(hasDangerousSqlKeywords('DELETE FROM users')).toBe(true)
    expect(hasDangerousSqlKeywords('delete from users')).toBe(true)
    expect(hasDangerousSqlKeywords('SELECT * FROM users; DELETE FROM users')).toBe(true)
  })

  it('should return true for SQL queries containing UPDATE keyword', () => {
    expect(hasDangerousSqlKeywords('UPDATE users SET name = "John"')).toBe(true)
    expect(hasDangerousSqlKeywords('update users set name = "John"')).toBe(true)
  })

  it('should return true for SQL queries containing DROP keyword', () => {
    expect(hasDangerousSqlKeywords('DROP TABLE users')).toBe(true)
    expect(hasDangerousSqlKeywords('drop table users')).toBe(true)
  })

  it('should return false for safe SQL queries and only match whole words', () => {
    expect(hasDangerousSqlKeywords('SELECT * FROM users')).toBe(false)
    expect(hasDangerousSqlKeywords('select * from users')).toBe(false)
    expect(hasDangerousSqlKeywords('SELECT COUNT(*) FROM users')).toBe(false)
    expect(hasDangerousSqlKeywords('UPDATED_AT > "2023-01-01"')).toBe(false)
    expect(hasDangerousSqlKeywords('INSERTED_AT < "2023-01-01"')).toBe(false)
    expect(hasDangerousSqlKeywords('CREATOR_ID = 1')).toBe(false)
    expect(hasDangerousSqlKeywords('DROPDOWN = "value"')).toBe(false)
  })
})

describe('wrapExplainQuery', () => {
  it('should prepend EXPLAIN to a query that does not start with it', () => {
    expect(wrapExplainQuery('SELECT * FROM users')).toBe('EXPLAIN SELECT * FROM users')
    expect(wrapExplainQuery('  SELECT * FROM users  ')).toBe('EXPLAIN SELECT * FROM users')
  })

  it('should not double-wrap when query already starts with EXPLAIN', () => {
    expect(wrapExplainQuery('EXPLAIN SELECT * FROM users')).toBe('EXPLAIN SELECT * FROM users')
    expect(wrapExplainQuery('  EXPLAIN ANALYZE SELECT * FROM users')).toBe('  EXPLAIN ANALYZE SELECT * FROM users')
  })
})
