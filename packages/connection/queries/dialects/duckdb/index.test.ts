import { afterAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { DuckDBInstance } from '@duckdb/node-api'
import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { query } from '.'
import { databaseFile } from '../../../database-file'

const directory = mkdtempSync(path.join(tmpdir(), 'tamery-duckdb-'))
afterAll(() => rmSync(directory, { force: true, recursive: true }))

const connectionTo = (name: string) => ({
  connectionString: databaseFile.connectionString(
    ConnectionType.DuckDB,
    path.join(directory, name)
  ),
})

const file = connectionTo('warehouse data.duckdb')
const created = await DuckDBInstance.create(
  path.join(directory, 'warehouse data.duckdb')
)
created.closeSync()

describe('duckdb executor', () => {
  test('answers each statement of a text with its own set', async () => {
    const { result } = await query.execute({
      ...file,
      query: `CREATE TABLE t (id INTEGER PRIMARY KEY, big BIGINT, tag VARCHAR);
        INSERT INTO t VALUES (1, 9007199254740993, 'a;b'), (2, 1, NULL);
        SELECT id, big, tag, tag FROM t ORDER BY id;`,
    })

    expect(result).toEqual([
      { affectedRows: 0, columns: [], rows: [], truncated: false },
      { affectedRows: 2, columns: [], rows: [], truncated: false },
      {
        affectedRows: null,
        columns: ['id', 'big', 'tag', 'tag'],
        rows: [
          [1, '9007199254740993', 'a;b', 'a;b'],
          [2, 1, null, null],
        ],
        truncated: false,
      },
    ])
  })

  test('binds values and stops reading past maxRows', async () => {
    const { result } = await query.execute({
      ...file,
      maxRows: 1,
      query: 'SELECT id FROM t WHERE id >= $1 AND $2',
      values: [1, true],
    })

    expect(result).toEqual([
      { affectedRows: null, columns: ['id'], rows: [[1]], truncated: true },
    ])
  })

  test('a read-only transaction refuses a write', async () => {
    const { txId } = await query.beginTransaction({
      ...file,
      accessMode: 'read only',
    })
    await expect(
      query.executeTransaction({ query: 'DELETE FROM t', txId, values: [] })
    ).rejects.toThrow('read-only mode')
    await query.rollbackTransaction({ txId })
  })

  test('a session keeps a transaction its SQL opens until the SQL ends it', async () => {
    const { txId } = await query.openSession(file)
    const run = (sql: string) =>
      query.executeTransaction({ query: sql, txId, values: [] })

    await run("BEGIN; INSERT INTO t (id, tag) VALUES (3, 'draft');")
    expect(await query.transactionStatus({ txId })).toBe('open')

    await run('ROLLBACK')
    expect(await query.transactionStatus({ txId })).toBe('ended')
    const { result } = await query.execute({
      ...file,
      query: 'SELECT count(*) FROM t',
    })
    expect(result[0]?.rows).toEqual([[2]])
  })

  test('never creates a file at a missing path', async () => {
    await expect(
      query.execute({ ...connectionTo('missing.duckdb'), query: 'SELECT 1' })
    ).rejects.toThrow('No such file or directory')
    expect(
      await Bun.file(path.join(directory, 'missing.duckdb')).exists()
    ).toBe(false)
  })
})
