import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import {
  destructiveKeywords,
  invalidatesCatalog,
  readsOnly,
  runsDynamicSql,
  writesData,
} from './destructive'
import { dialects } from './dialect'

const mysql = dialects[ConnectionType.MySQL]
const pg = dialects[ConnectionType.Postgres]
const clickhouse = dialects[ConnectionType.ClickHouse]

describe('destructiveKeywords', () => {
  it('flags statements that change or remove existing data', () => {
    expect(destructiveKeywords('REPLACE INTO t VALUES (1)', mysql)).toEqual([
      'REPLACE',
    ])
    expect(
      destructiveKeywords(
        'MERGE INTO t USING s ON t.id = s.id',
        dialects[ConnectionType.MSSQL]
      )
    ).toEqual(['MERGE'])
    expect(
      destructiveKeywords('update t set a = 1; delete from t', mysql)
    ).toEqual(['UPDATE', 'DELETE'])
  })

  it('flags code it cannot see into', () => {
    expect(
      destructiveKeywords('DO $$ BEGIN DROP TABLE users; END $$', pg)
    ).toEqual(['DO'])
    expect(
      destructiveKeywords(
        "EXEC('DROP TABLE users')",
        dialects[ConnectionType.MSSQL]
      )
    ).toEqual(['EXEC'])
    expect(
      destructiveKeywords('INSERT INTO t VALUES (1) ON CONFLICT DO NOTHING', pg)
    ).toEqual([])
  })

  it('ignores reads, additive writes, strings, comments and the REPLACE function', () => {
    expect(
      destructiveKeywords(
        "SELECT REPLACE(name, 'a', 'b') FROM t WHERE x = 'DROP'; -- DELETE\nINSERT INTO t VALUES (1)",
        mysql
      )
    ).toEqual([])
  })

  it('ignores row locks, referential actions, privileges and a plain EXPLAIN', () => {
    expect(
      destructiveKeywords(
        'SELECT * FROM t FOR UPDATE; SELECT * FROM t FOR NO KEY UPDATE',
        pg
      )
    ).toEqual([])
    expect(
      destructiveKeywords(
        'CREATE TABLE c (p int REFERENCES p ON DELETE CASCADE ON UPDATE SET NULL)',
        pg
      )
    ).toEqual([])
    expect(
      destructiveKeywords(
        'GRANT SELECT, UPDATE, DELETE ON t TO u; REVOKE DELETE ON t FROM u',
        pg
      )
    ).toEqual([])
    expect(destructiveKeywords('EXPLAIN DELETE FROM t', pg)).toEqual([])
    expect(destructiveKeywords('EXPLAIN ANALYZE DELETE FROM t', pg)).toEqual([
      'DELETE',
    ])
  })

  it('flags upserts that overwrite rows', () => {
    expect(
      destructiveKeywords(
        'INSERT INTO t VALUES (1) ON CONFLICT (id) DO UPDATE SET a = 1',
        pg
      )
    ).toEqual(['UPDATE'])
    expect(
      destructiveKeywords(
        'INSERT INTO t VALUES (1) ON DUPLICATE KEY UPDATE a = 1',
        mysql
      )
    ).toEqual(['UPDATE'])
  })

  it('tells schema changes from data changes', () => {
    expect(invalidatesCatalog('create table t (id int)', mysql)).toBe(true)
    expect(invalidatesCatalog('SELECT 1; ALTER TABLE t ADD c int', mysql)).toBe(
      true
    )
    expect(invalidatesCatalog("UPDATE t SET a = 'DROP'", mysql)).toBe(false)
    expect(
      invalidatesCatalog('DO $$ BEGIN CREATE TABLE t (); END $$', pg)
    ).toBe(true)
    expect(invalidatesCatalog('EXPLAIN CREATE TABLE t AS SELECT 1', pg)).toBe(
      false
    )
    expect(
      invalidatesCatalog('EXPLAIN ANALYZE CREATE TABLE t AS SELECT 1', pg)
    ).toBe(true)
  })

  it('tells data writes from reads', () => {
    expect(writesData('INSERT INTO t VALUES (1)', pg)).toBe(true)
    expect(writesData('SELECT 1; UPDATE t SET a = 1', mysql)).toBe(true)
    expect(
      writesData(
        'WITH gone AS (DELETE FROM t RETURNING id) SELECT * FROM gone',
        pg
      )
    ).toBe(true)
    expect(
      writesData(
        "EXEC('INSERT INTO t VALUES (1)')",
        dialects[ConnectionType.MSSQL]
      )
    ).toBe(true)
    expect(writesData('SELECT * FROM t FOR UPDATE', pg)).toBe(false)
    expect(writesData("SELECT 'DELETE' FROM t", mysql)).toBe(false)
    expect(writesData('EXPLAIN UPDATE t SET a = 1', pg)).toBe(false)
  })
})

describe('readsOnly', () => {
  const mssql = dialects[ConnectionType.MSSQL]

  it('accepts one reading statement', () => {
    expect(readsOnly('select * from users where id = 1;', pg)).toBe(true)
    expect(readsOnly('WITH t AS (SELECT 1) SELECT * FROM t', pg)).toBe(true)
    expect(readsOnly("select 'drop table users'", pg)).toBe(true)
    expect(readsOnly('SHOW TABLES', mysql)).toBe(true)
    expect(readsOnly('SHOW CREATE TABLE users', mysql)).toBe(true)
    expect(readsOnly('SHOW CREATE TABLE users', clickhouse)).toBe(true)
  })

  it('rejects writes hidden in or after a read', () => {
    expect(readsOnly('select 1; delete from users', pg)).toBe(false)
    expect(
      readsOnly('WITH d AS (DELETE FROM t RETURNING *) SELECT * FROM d', pg)
    ).toBe(false)
    expect(readsOnly('SELECT * INTO copy FROM users', mssql)).toBe(false)
    expect(readsOnly('SELECT 1 COMMIT DROP TABLE users', mssql)).toBe(false)
    expect(readsOnly("SELECT 1 EXEC('DROP TABLE users')", mssql)).toBe(false)
    expect(readsOnly('EXPLAIN ANALYZE DELETE FROM users', pg)).toBe(false)
  })

  it('rejects a SQL Server batch that ends the transaction and writes', () => {
    expect(
      readsOnly(
        'SELECT 1 ROLLBACK TRANSACTION GRANT CONTROL SERVER TO public',
        mssql
      )
    ).toBe(false)
    expect(
      readsOnly("SELECT 1 ROLLBACK RESTORE DATABASE db FROM DISK = 'x'", mssql)
    ).toBe(false)
    expect(readsOnly('SELECT 1 DBCC SHRINKDATABASE(db)', mssql)).toBe(false)
  })

  it('rejects anything that is not a read', () => {
    expect(readsOnly('COMMIT', pg)).toBe(false)
    expect(readsOnly('SET search_path TO evil', pg)).toBe(false)
    expect(readsOnly('', pg)).toBe(false)
  })
})

describe('runsDynamicSql', () => {
  it('flags procedure calls and dynamic bodies, not plain writes', () => {
    expect(runsDynamicSql('CALL archive_orders()', mysql)).toBe(true)
    expect(runsDynamicSql('DO $$ BEGIN COMMIT; END $$', pg)).toBe(true)
    expect(runsDynamicSql('UPDATE t SET a = 1 WHERE id = 2', pg)).toBe(false)
  })
})
