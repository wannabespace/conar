import { describe, expect, it } from 'bun:test'
import { getSQLQueries, hasDangerousSqlKeywords } from './helpers'

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

  it('should return true for SQL queries containing INSERT keyword', () => {
    expect(hasDangerousSqlKeywords('INSERT INTO users VALUES (1, "John")')).toBe(true)
    expect(hasDangerousSqlKeywords('insert into users values (1, "John")')).toBe(true)
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

describe('getSQLQueries', () => {
  it('should parse single and multiple queries', () => {
    expect(getSQLQueries('SELECT * FROM users;')).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 1, endLineNumber: 1, queries: ['SELECT * FROM users'] },
    ])
    expect(getSQLQueries('SELECT * FROM users')).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 1, endLineNumber: 1, queries: ['SELECT * FROM users'] },
    ])
    expect(getSQLQueries('SELECT * FROM users;\nSELECT * FROM posts;')).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 1, endLineNumber: 1, queries: ['SELECT * FROM users'] },
      { id: 'U0VMRUNUICog_1', startLineNumber: 2, endLineNumber: 2, queries: ['SELECT * FROM posts'] },
    ])
  })

  it('should parse multi-line queries', () => {
    expect(getSQLQueries(`SELECT *
FROM users
WHERE id = 1;`)).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 1, endLineNumber: 3, queries: ['SELECT * FROM users WHERE id = 1'] },
    ])
    expect(getSQLQueries(`SELECT *
FROM users
WHERE id = 1`)).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 1, endLineNumber: 3, queries: ['SELECT * FROM users WHERE id = 1'] },
    ])
  })

  it('should ignore comments', () => {
    expect(getSQLQueries(`-- This is a comment
SELECT * FROM users;
-- Another comment
SELECT * FROM posts;`)).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 2, endLineNumber: 2, queries: ['SELECT * FROM users'] },
      { id: 'U0VMRUNUICog_1', startLineNumber: 4, endLineNumber: 4, queries: ['SELECT * FROM posts'] },
    ])
    expect(getSQLQueries(`SELECT * FROM users -- get all users
WHERE id = 1;`)).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 1, endLineNumber: 2, queries: ['SELECT * FROM users WHERE id = 1'] },
    ])
    expect(getSQLQueries(`/* This is a
multi-line comment */
SELECT * FROM users;
/* Another comment */
SELECT * FROM posts;`)).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 3, endLineNumber: 3, queries: ['SELECT * FROM users'] },
      { id: 'U0VMRUNUICog_1', startLineNumber: 5, endLineNumber: 5, queries: ['SELECT * FROM posts'] },
    ])
  })

  it('should return empty array for empty or non-query input', () => {
    expect(getSQLQueries('')).toEqual([])
    expect(getSQLQueries('   \n  \n  ')).toEqual([])
    expect(getSQLQueries(`-- Just a comment
/* Another comment */`)).toEqual([])
  })

  it('should handle complex queries with multiple statements', () => {
    expect(getSQLQueries(`INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
UPDATE users SET active = true WHERE id = 1;
DELETE FROM users WHERE id = 2;`)).toEqual([
      { id: 'SU5TRVJUIElO', startLineNumber: 1, endLineNumber: 1, queries: ['INSERT INTO users (name, email) VALUES (\'John\', \'john@example.com\')'] },
      { id: 'VVBEQVRFIHVz', startLineNumber: 2, endLineNumber: 2, queries: ['UPDATE users SET active = true WHERE id = 1'] },
      { id: 'REVMRVRFIEZS', startLineNumber: 3, endLineNumber: 3, queries: ['DELETE FROM users WHERE id = 2'] },
    ])
  })

  it('should handle multiple queries on the same line', () => {
    expect(getSQLQueries('SELECT * FROM users; SELECT * FROM posts;')).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 1, endLineNumber: 1, queries: ['SELECT * FROM users', 'SELECT * FROM posts'] },
    ])
  })

  it('should handle multiple queries when first query is multiline and second is single line', () => {
    expect(getSQLQueries(`SELECT *
FROM users
WHERE id = 1; SELECT * FROM posts;`)).toEqual([
      { id: 'U0VMRUNUICog', startLineNumber: 1, endLineNumber: 3, queries: ['SELECT * FROM users WHERE id = 1', 'SELECT * FROM posts'] },
    ])
  })
})
