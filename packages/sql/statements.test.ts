import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { dialects } from './dialect'
import {
  leavesTransactionOpen,
  splitStatements,
  statementAt,
  transactionParts,
} from './statements'

const pg = dialects[ConnectionType.Postgres]
const mssql = dialects[ConnectionType.MSSQL]
const mysql = dialects[ConnectionType.MySQL]
const clickhouse = dialects[ConnectionType.ClickHouse]
const texts = (sql: string, dialect = pg) =>
  splitStatements(sql, dialect).map((statement) => statement.text)

describe('splitStatements', () => {
  it('splits on semicolons and drops comments between statements', () => {
    expect(texts('SELECT 1; SELECT 2')).toEqual(['SELECT 1', 'SELECT 2'])
    expect(
      texts(`-- lead
SELECT *
FROM users; /* mid */
SELECT 2; -- trail`)
    ).toEqual(['SELECT *\nFROM users', 'SELECT 2'])
    expect(texts('-- only\n/* comments */')).toEqual([])
  })

  it('keeps semicolons inside strings, dollar bodies and BEGIN…END blocks', () => {
    expect(texts("SELECT 'a;b'; SELECT 2")).toEqual([
      "SELECT 'a;b'",
      'SELECT 2',
    ])
    const fn = `CREATE FUNCTION f() RETURNS int AS $$
BEGIN
  RETURN 1;
END;
$$ LANGUAGE plpgsql`
    expect(texts(`${fn};\nSELECT f()`)).toEqual([fn, 'SELECT f()'])
    const block = `CREATE PROCEDURE p AS
BEGIN
  SELECT CASE WHEN 1 = 1 THEN 'a' ELSE 'b' END;
  IF 1 = 1 BEGIN SELECT 1; END
END`
    expect(texts(`${block};\nSELECT 2`, mssql)).toEqual([block, 'SELECT 2'])
  })

  it('groups a transaction into one statement', () => {
    const tx = `BEGIN;
UPDATE users SET a = 1;
COMMIT`
    expect(texts(`${tx};\nSELECT 1`)).toEqual([tx, 'SELECT 1'])
    expect(texts('START TRANSACTION; DELETE FROM t; ROLLBACK;')).toEqual([
      'START TRANSACTION; DELETE FROM t; ROLLBACK',
    ])
  })

  it('takes a transaction group apart for the driver', () => {
    expect(
      transactionParts(
        'BEGIN;\nUPDATE a SET x = 1;\nDELETE FROM b;\nCOMMIT',
        pg
      )
    ).toEqual({
      commit: true,
      statements: ['UPDATE a SET x = 1', 'DELETE FROM b'],
    })
    expect(
      transactionParts('START TRANSACTION; DELETE FROM t; ROLLBACK', pg)
    ).toEqual({ commit: false, statements: ['DELETE FROM t'] })
    expect(transactionParts('SELECT 1', pg)).toBeNull()
    expect(transactionParts('BEGIN; SELECT 1', pg)).toBeNull()
  })

  it('keeps a rollback to a savepoint inside its transaction', () => {
    const tx =
      'BEGIN; UPDATE a SET x=1; SAVEPOINT s; UPDATE b SET y=1; ROLLBACK TO SAVEPOINT s; UPDATE c SET z=1; COMMIT'
    expect(texts(`${tx};`)).toEqual([tx])
    expect(transactionParts(`${tx};`, pg)).toEqual({
      commit: true,
      statements: [
        'UPDATE a SET x=1',
        'SAVEPOINT s',
        'UPDATE b SET y=1',
        'ROLLBACK TO SAVEPOINT s',
        'UPDATE c SET z=1',
      ],
    })
  })

  it('opens a transaction with every BEGIN form, not a block', () => {
    for (const opener of [
      'BEGIN WORK',
      'begin transaction',
      'BEGIN ISOLATION LEVEL SERIALIZABLE',
      'BEGIN READ ONLY',
      'BEGIN NOT DEFERRABLE',
    ]) {
      const tx = `${opener}; DELETE FROM t; COMMIT WORK`
      expect(texts(`${tx};\nSELECT 1`)).toEqual([tx, 'SELECT 1'])
    }
    const distributed = 'BEGIN DISTRIBUTED TRAN; DELETE FROM t; ROLLBACK WORK'
    expect(texts(`${distributed};\nSELECT 1`, mssql)).toEqual([
      distributed,
      'SELECT 1',
    ])
    const atomic = 'BEGIN NOT ATOMIC SELECT 1; SELECT 2; END'
    expect(texts(`${atomic};\nSELECT 3`, mysql)).toEqual([atomic, 'SELECT 3'])
  })

  it('closes a Postgres transaction with END or ABORT, not a block END', () => {
    expect(texts('BEGIN; DELETE FROM t; END;\nSELECT 1')).toEqual([
      'BEGIN; DELETE FROM t; END',
      'SELECT 1',
    ])
    expect(texts('BEGIN; DELETE FROM t; ABORT;\nSELECT 1')).toEqual([
      'BEGIN; DELETE FROM t; ABORT',
      'SELECT 1',
    ])
    expect(
      transactionParts('BEGIN; DELETE FROM t; END TRANSACTION', pg)
    ).toEqual({ commit: true, statements: ['DELETE FROM t'] })
    expect(transactionParts('BEGIN; DELETE FROM t; ABORT', pg)).toEqual({
      commit: false,
      statements: ['DELETE FROM t'],
    })
    const tx = 'BEGIN TRAN; IF 1 = 1 BEGIN ROLLBACK; END; COMMIT'
    expect(texts(`${tx};\nSELECT 1`, mssql)).toEqual([tx, 'SELECT 1'])
  })

  it('runs an unclosed transaction statement by statement', () => {
    expect(texts('BEGIN; SELECT 1; SELECT 2')).toEqual([
      'BEGIN',
      'SELECT 1',
      'SELECT 2',
    ])
    expect(texts('BEGIN; SELECT 1; COMMIT')).toEqual([
      'BEGIN; SELECT 1; COMMIT',
    ])
  })

  it('never groups on a dialect without transactions', () => {
    const tx = 'BEGIN TRANSACTION; SELECT 1; COMMIT'
    expect(texts(tx, clickhouse)).toEqual([
      'BEGIN TRANSACTION',
      'SELECT 1',
      'COMMIT',
    ])
    expect(transactionParts(tx, clickhouse)).toBeNull()
  })

  it('tells a transaction left open from a block or a closed batch', () => {
    expect(leavesTransactionOpen('-- lead\nBEGIN', pg)).toBe(true)
    expect(
      leavesTransactionOpen('begin isolation level serializable', pg)
    ).toBe(true)
    expect(leavesTransactionOpen('START TRANSACTION; SELECT 1', mysql)).toBe(
      true
    )
    expect(leavesTransactionOpen('BEGIN TRAN', mssql)).toBe(true)
    expect(leavesTransactionOpen('BEGIN SELECT 1; END', mssql)).toBe(false)
    expect(leavesTransactionOpen('SELECT 1; BEGIN', pg)).toBe(false)
    expect(
      leavesTransactionOpen('BEGIN TRAN\nUPDATE t SET a = 1\nCOMMIT', mssql)
    ).toBe(false)
  })

  it('splits SQL Server batches on GO', () => {
    expect(texts('SELECT 1\nGO\nSELECT 2', mssql)).toEqual([
      'SELECT 1',
      'SELECT 2',
    ])
  })

  it('finds the statement at an offset', () => {
    const text = 'SELECT 1;\n\nSELECT 2;'
    const statements = splitStatements(text, pg)
    expect(statementAt(statements, 3, text)?.text).toBe('SELECT 1')
    expect(statementAt(statements, 9, text)?.text).toBe('SELECT 1')
    expect(statementAt(statements, 10, text)).toBeUndefined()
    expect(statementAt(statements, 11, text)?.text).toBe('SELECT 2')
    const line = 'SELECT 5; SELECT 6;'
    const onLine = splitStatements(line, pg)
    expect(statementAt(onLine, 9, line)?.text).toBe('SELECT 5')
    expect(statementAt(onLine, 12, line)?.text).toBe('SELECT 6')
    expect(statementAt(onLine, line.length, line)?.text).toBe('SELECT 6')
    const split = 'SELECT 1\n;\n\nSELECT 2;'
    expect(statementAt(splitStatements(split, pg), 10, split)?.text).toBe(
      'SELECT 1'
    )
  })
})
