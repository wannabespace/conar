import { describe, expect, it } from 'bun:test'
import { getEditorQueries, hasDangerousSqlKeywords } from './helpers'

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

describe('getEditorQueries', () => {
  it('should parse single and multiple queries', () => {
    expect(getEditorQueries('SELECT * FROM users;')).toEqual([
      { startLineNumber: 1, endLineNumber: 1, queries: ['SELECT * FROM users'] },
    ])
    expect(getEditorQueries('SELECT * FROM users')).toEqual([
      { startLineNumber: 1, endLineNumber: 1, queries: ['SELECT * FROM users'] },
    ])
    expect(getEditorQueries('SELECT * FROM users;\nSELECT * FROM posts;')).toEqual([
      { startLineNumber: 1, endLineNumber: 1, queries: ['SELECT * FROM users'] },
      { startLineNumber: 2, endLineNumber: 2, queries: ['SELECT * FROM posts'] },
    ])
  })

  it('should parse multi-line queries', () => {
    expect(getEditorQueries(`SELECT *
FROM users
WHERE id = 1;`)).toEqual([
      { startLineNumber: 1, endLineNumber: 3, queries: ['SELECT * FROM users WHERE id = 1'] },
    ])
    expect(getEditorQueries(`SELECT *
FROM users
WHERE id = 1`)).toEqual([
      { startLineNumber: 1, endLineNumber: 3, queries: ['SELECT * FROM users WHERE id = 1'] },
    ])
  })

  it('should ignore comments', () => {
    expect(getEditorQueries(`-- This is a comment
SELECT * FROM users;
-- Another comment
SELECT * FROM posts;`)).toEqual([
      { startLineNumber: 2, endLineNumber: 2, queries: ['SELECT * FROM users'] },
      { startLineNumber: 4, endLineNumber: 4, queries: ['SELECT * FROM posts'] },
    ])
    expect(getEditorQueries(`SELECT * FROM users -- get all users
WHERE id = 1;`)).toEqual([
      { startLineNumber: 1, endLineNumber: 2, queries: ['SELECT * FROM users WHERE id = 1'] },
    ])
    expect(getEditorQueries(`/* This is a
multi-line comment */
SELECT * FROM users;
/* Another comment */
SELECT * FROM posts;`)).toEqual([
      { startLineNumber: 3, endLineNumber: 3, queries: ['SELECT * FROM users'] },
      { startLineNumber: 5, endLineNumber: 5, queries: ['SELECT * FROM posts'] },
    ])
  })

  it('should return empty array for empty or non-query input', () => {
    expect(getEditorQueries('')).toEqual([])
    expect(getEditorQueries('   \n  \n  ')).toEqual([])
    expect(getEditorQueries(`-- Just a comment
/* Another comment */`)).toEqual([])
  })

  it('should handle complex queries with multiple statements', () => {
    expect(getEditorQueries(`INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
UPDATE users SET active = true WHERE id = 1;
DELETE FROM users WHERE id = 2;`)).toEqual([
      { startLineNumber: 1, endLineNumber: 1, queries: ['INSERT INTO users (name, email) VALUES (\'John\', \'john@example.com\')'] },
      { startLineNumber: 2, endLineNumber: 2, queries: ['UPDATE users SET active = true WHERE id = 1'] },
      { startLineNumber: 3, endLineNumber: 3, queries: ['DELETE FROM users WHERE id = 2'] },
    ])
  })

  it('should handle multiple queries on the same line', () => {
    expect(getEditorQueries('SELECT * FROM users; SELECT * FROM posts;')).toEqual([
      { startLineNumber: 1, endLineNumber: 1, queries: ['SELECT * FROM users', 'SELECT * FROM posts'] },
    ])
  })

  it('should handle multiple queries when first query is multiline and second is single line', () => {
    expect(getEditorQueries(`SELECT *
FROM users
WHERE id = 1; SELECT * FROM posts;`)).toEqual([
      { startLineNumber: 1, endLineNumber: 3, queries: ['SELECT * FROM users WHERE id = 1', 'SELECT * FROM posts'] },
    ])
  })

  it('should handle CREATE FUNCTION/procedure queries with $$...$$ bodies', () => {
    expect(
      getEditorQueries(
        `CREATE OR REPLACE FUNCTION limpar_sessoes_expiradas () RETURNS void AS $$ BEGIN DELETE FROM public.sessions WHERE "expires" < NOW() - INTERVAL '1 day'; END; $$ LANGUAGE plpgsql;`,
      ),
    ).toEqual([
      {
        startLineNumber: 1,
        endLineNumber: 1,
        queries: [
          `CREATE OR REPLACE FUNCTION limpar_sessoes_expiradas () RETURNS void AS $$ BEGIN DELETE FROM public.sessions WHERE "expires" < NOW() - INTERVAL '1 day'; END; $$ LANGUAGE plpgsql`,
        ],
      },
    ])
  })

  it('should handle BEGIN and END blocks as a single query', () => {
    expect(
      getEditorQueries(`BEGIN
        UPDATE users SET active = false WHERE id = 1;
        INSERT INTO audit_log (user_id, action) VALUES (1, 'deactivate');
      END;`),
    ).toEqual([
      {
        startLineNumber: 1,
        endLineNumber: 4,
        queries: [
          `BEGIN UPDATE users SET active = false WHERE id = 1; INSERT INTO audit_log (user_id, action) VALUES (1, 'deactivate'); END`,
        ],
      },
    ])
  })

  it('should handle BEGIN; ... COMMIT; transaction block as a single query', () => {
    const sql = `BEGIN;
      ALTER TABLE feature_flag_users ADD COLUMN phone VARCHAR(255);
      UPDATE feature_flag_users ffu
      SET phone = u.phone
      FROM users u
      WHERE u.id = ffu.user_id;

      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM feature_flag_users WHERE phone IS NULL) THEN
          RAISE EXCEPTION 'rows with phone = NULL exists, check user_id';
        END IF;
      END $$;

      ALTER TABLE feature_flag_users ALTER COLUMN phone SET NOT NULL;
    COMMIT;`
    const result = getEditorQueries(sql)
    expect(result).toHaveLength(1)
    expect(result[0]!.startLineNumber).toBe(1)
    expect(result[0]!.endLineNumber).toBeGreaterThan(1)
    expect(result[0]!.queries).toHaveLength(1)
    expect(result[0]!.queries[0]).toContain('BEGIN')
    expect(result[0]!.queries[0]).toContain('COMMIT')
    expect(result[0]!.queries[0]).toContain('DO $$')
    expect(result[0]!.queries[0]).toContain('END $$')
  })
})
