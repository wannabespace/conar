import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import type { SqlCatalog } from './catalog'
import { completionContext, completionItems } from './completion'
import { dialects } from './dialect'

const pg = dialects[ConnectionType.Postgres]
const catalog: SqlCatalog = {
  defaultSchema: 'public',
  enums: [{ name: 'status', values: ['active', 'banned'] }],
  schemas: [
    {
      name: 'public',
      tables: [
        {
          columns: [
            { name: 'id', nullable: false, type: 'int' },
            { name: 'email', nullable: true, type: 'text' },
            { name: 'status', nullable: false, type: 'status' },
            { name: 'active', nullable: false, type: 'boolean' },
          ],
          kind: 'table',
          name: 'users',
        },
        {
          columns: [
            { name: 'id', nullable: false, type: 'int' },
            { name: 'user_id', nullable: false, type: 'int' },
            { name: 'title', nullable: false, type: 'text' },
          ],
          kind: 'table',
          name: 'posts',
        },
      ],
    },
    { name: 'audit', tables: [{ columns: [], kind: 'view', name: 'log' }] },
  ],
}
const complete = (sql: string, offset = sql.length) => {
  const context = completionContext(sql, offset, pg)
  const items = completionItems(context, catalog, pg)
  return {
    context,
    inserts: items.map((item) => item.insertText),
    labels: items.map((item) => item.label),
  }
}

describe('completion', () => {
  it('offers tables after FROM and columns after an alias dot', () => {
    const fromCase = complete('SELECT * FROM ')
    expect(fromCase.context.expects).toBe('table')
    expect(fromCase.labels.slice(0, 3)).toEqual(['users', 'posts', 'audit.log'])

    const dot = complete('SELECT u. FROM users u', 9)
    expect(dot.context.qualifier).toEqual(['u'])
    expect(dot.labels).toEqual(['id', 'email', 'status', 'active'])

    expect(complete('SELECT * FROM audit.', 20).labels).toEqual(['log'])
  })

  it('offers scope columns and functions in expressions', () => {
    const { context, labels } = complete('SELECT  FROM users', 7)
    expect(context.expects).toBe('column')
    expect(labels.slice(0, 3)).toEqual(['*', 'id, email, status, active', 'id'])
    expect(labels).toContain('COUNT')
  })

  it('qualifies columns once several tables are in scope', () => {
    const { labels } = complete(
      'SELECT  FROM users u JOIN posts p ON p.user_id = u.id',
      7
    )
    expect(labels).toContain('u.email')
    expect(labels).toContain('p.title')
    expect(labels).not.toContain('email')
  })

  it('offers the next clause after a finished term', () => {
    expect(complete('SELECT id FROM users ').labels.slice(0, 2)).toEqual([
      'WHERE',
      'JOIN',
    ])
    expect(complete('SELECT id FROM users u JOIN posts p ').labels).toEqual([
      'ON',
      'AS',
    ])
    expect(complete('SELECT * FROM users WHERE id = 1 ').labels[0]).toBe('AND')
    expect(complete('SELECT * ').labels).toEqual(['FROM', 'AS'])
    expect(complete('SELECT id FROM users wh', 23).labels).toContain('WHERE')
  })

  it('offers operators for a column awaiting its comparison, typed by the column', () => {
    expect(
      complete('SELECT * FROM users WHERE id ').labels.slice(0, 2)
    ).toEqual(['=', '<>'])
    expect(
      complete('SELECT * FROM users WHERE active ').labels.slice(0, 2)
    ).toEqual(['= TRUE', '= FALSE'])
    expect(
      complete('SELECT * FROM users WHERE email ').labels.slice(0, 5)
    ).toEqual(['=', 'LIKE', 'ILIKE', 'IS NULL', 'IS NOT NULL'])
  })

  it('offers the values a column takes after its comparison', () => {
    const { inserts } = complete('SELECT * FROM users WHERE status = ')
    expect(inserts.slice(0, 2)).toEqual(["'active'", "'banned'"])
    expect(
      complete('SELECT * FROM users u WHERE u.active = ').labels.slice(0, 2)
    ).toEqual(['TRUE', 'FALSE'])
    expect(complete('SELECT * FROM users WHERE status IN (').inserts[0]).toBe(
      "'active'"
    )
  })

  it('guesses join conditions from column names', () => {
    expect(complete('SELECT * FROM users u JOIN posts p ON ').labels[0]).toBe(
      'p.user_id = u.id'
    )
  })

  it('repeats the selected columns after GROUP BY', () => {
    expect(
      complete(
        'SELECT email, status, count(*) FROM users GROUP BY '
      ).labels.slice(0, 3)
    ).toEqual(['email, status', 'email', 'status'])
  })

  it('templates an INSERT after its table, and numbers after LIMIT', () => {
    const into = complete('INSERT INTO posts ')
    expect(into.labels[0]).toBe('(columns…) VALUES (…)')
    expect(into.inserts[0]).toBe(
      `(user_id, title)\nVALUES (\${1:user_id}, \${2:title})`
    )
    expect(complete('SELECT * FROM users LIMIT ').labels).toEqual([
      '10',
      '50',
      '100',
      '1000',
    ])
  })

  it('follows the casing the user writes keywords in', () => {
    expect(complete('select id from users ').inserts.slice(0, 2)).toEqual([
      'where',
      'join',
    ])
    expect(complete('select id from users wh', 23).inserts).toContain('where')
    expect(complete('SELECT id FROM users ').inserts[0]).toBe('WHERE')
  })

  it('offers statement verbs, not tables, at the start of a statement', () => {
    const start = complete('s')
    expect(start.context.expects).toBe('statement')
    expect(start.labels[0]).toBe('SELECT')
    expect(start.labels).not.toContain('users')
    expect(complete('SELECT 1;\nup').labels).toContain('UPDATE')
  })

  it('stays quiet inside strings and comments', () => {
    expect(complete("SELECT * FROM users WHERE name = 'ab", 36).labels).toEqual(
      []
    )
    expect(complete('-- sel', 6).labels).toEqual([])
    expect(complete('-- header\nSELECT 1', 5).labels).toEqual([])
  })

  it('completes after a line comment', () => {
    expect(complete('-- header\nSELECT * FROM ').labels).toContain('users')
  })
})
