import { describe, expect, it } from 'bun:test'

import { getEditorQueries } from './query-parser'

describe('getEditorQueries', () => {
  it('should parse single and multiple queries', () => {
    expect(getEditorQueries('SELECT * FROM users;')).toEqual([
      {
        endLineNumber: 1,
        queries: ['SELECT * FROM users'],
        startLineNumber: 1,
      },
    ])
    expect(getEditorQueries('SELECT * FROM users')).toEqual([
      {
        endLineNumber: 1,
        queries: ['SELECT * FROM users'],
        startLineNumber: 1,
      },
    ])
    expect(
      getEditorQueries('SELECT * FROM users;\nSELECT * FROM posts;')
    ).toEqual([
      {
        endLineNumber: 1,
        queries: ['SELECT * FROM users'],
        startLineNumber: 1,
      },
      {
        endLineNumber: 2,
        queries: ['SELECT * FROM posts'],
        startLineNumber: 2,
      },
    ])
  })

  it('should parse multi-line queries', () => {
    expect(
      getEditorQueries(`SELECT *
FROM users
WHERE id = 1;`)
    ).toEqual([
      {
        endLineNumber: 3,
        queries: ['SELECT * FROM users WHERE id = 1'],
        startLineNumber: 1,
      },
    ])
    expect(
      getEditorQueries(`SELECT *
FROM users
WHERE id = 1`)
    ).toEqual([
      {
        endLineNumber: 3,
        queries: ['SELECT * FROM users WHERE id = 1'],
        startLineNumber: 1,
      },
    ])
  })

  it('should ignore comments', () => {
    expect(
      getEditorQueries(`-- This is a comment
SELECT * FROM users;
-- Another comment
SELECT * FROM posts;`)
    ).toEqual([
      {
        endLineNumber: 2,
        queries: ['SELECT * FROM users'],
        startLineNumber: 2,
      },
      {
        endLineNumber: 4,
        queries: ['SELECT * FROM posts'],
        startLineNumber: 4,
      },
    ])
    expect(
      getEditorQueries(`SELECT * FROM users -- get all users
WHERE id = 1;`)
    ).toEqual([
      {
        endLineNumber: 2,
        queries: ['SELECT * FROM users WHERE id = 1'],
        startLineNumber: 1,
      },
    ])
    expect(
      getEditorQueries(`/* This is a
multi-line comment */
SELECT * FROM users;
/* Another comment */
SELECT * FROM posts;`)
    ).toEqual([
      {
        endLineNumber: 3,
        queries: ['SELECT * FROM users'],
        startLineNumber: 3,
      },
      {
        endLineNumber: 5,
        queries: ['SELECT * FROM posts'],
        startLineNumber: 5,
      },
    ])
  })

  it('should return empty array for empty or non-query input', () => {
    expect(getEditorQueries('')).toEqual([])
    expect(getEditorQueries('   \n  \n  ')).toEqual([])
    expect(
      getEditorQueries(`-- Just a comment
/* Another comment */`)
    ).toEqual([])
  })

  it('should handle complex queries with multiple statements', () => {
    expect(
      getEditorQueries(`INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
UPDATE users SET active = true WHERE id = 1;
DELETE FROM users WHERE id = 2;`)
    ).toEqual([
      {
        endLineNumber: 1,
        queries: [
          "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')",
        ],
        startLineNumber: 1,
      },
      {
        endLineNumber: 2,
        queries: ['UPDATE users SET active = true WHERE id = 1'],
        startLineNumber: 2,
      },
      {
        endLineNumber: 3,
        queries: ['DELETE FROM users WHERE id = 2'],
        startLineNumber: 3,
      },
    ])
  })

  it('should handle multiple queries on the same line', () => {
    expect(
      getEditorQueries('SELECT * FROM users; SELECT * FROM posts;')
    ).toEqual([
      {
        endLineNumber: 1,
        queries: ['SELECT * FROM users', 'SELECT * FROM posts'],
        startLineNumber: 1,
      },
    ])
  })

  it('should handle multiple queries when first query is multiline and second is single line', () => {
    expect(
      getEditorQueries(`SELECT *
FROM users
WHERE id = 1; SELECT * FROM posts;`)
    ).toEqual([
      {
        endLineNumber: 3,
        queries: ['SELECT * FROM users WHERE id = 1', 'SELECT * FROM posts'],
        startLineNumber: 1,
      },
    ])
  })

  it('should handle CREATE FUNCTION/procedure queries with $$...$$ bodies', () => {
    expect(
      getEditorQueries(
        `CREATE OR REPLACE FUNCTION limpar_sessoes_expiradas () RETURNS void AS $$ BEGIN DELETE FROM public.sessions WHERE "expires" < NOW() - INTERVAL '1 day'; END; $$ LANGUAGE plpgsql;`
      )
    ).toEqual([
      {
        endLineNumber: 1,
        queries: [
          `CREATE OR REPLACE FUNCTION limpar_sessoes_expiradas () RETURNS void AS $$ BEGIN DELETE FROM public.sessions WHERE "expires" < NOW() - INTERVAL '1 day'; END; $$ LANGUAGE plpgsql`,
        ],
        startLineNumber: 1,
      },
    ])
  })

  it('should handle BEGIN and END blocks as a single query', () => {
    expect(
      getEditorQueries(`BEGIN
        UPDATE users SET active = false WHERE id = 1;
        INSERT INTO audit_log (user_id, action) VALUES (1, 'deactivate');
      END;`)
    ).toEqual([
      {
        endLineNumber: 4,
        queries: [
          `BEGIN UPDATE users SET active = false WHERE id = 1; INSERT INTO audit_log (user_id, action) VALUES (1, 'deactivate'); END`,
        ],
        startLineNumber: 1,
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
    const [firstQuery] = result
    expect(firstQuery).toBeDefined()
    expect(firstQuery?.startLineNumber).toBe(1)
    expect(firstQuery?.endLineNumber).toBeGreaterThan(1)
    expect(firstQuery?.queries).toHaveLength(1)
    expect(firstQuery?.queries[0]).toContain('BEGIN')
    expect(firstQuery?.queries[0]).toContain('COMMIT')
    expect(firstQuery?.queries[0]).toContain('DO $$')
    expect(firstQuery?.queries[0]).toContain('END $$')
  })
})
