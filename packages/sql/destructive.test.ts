import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { changesSchema, destructiveKeywords } from './destructive'
import { dialects } from './dialect'

const mysql = dialects[ConnectionType.MySQL]
const pg = dialects[ConnectionType.Postgres]

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
    expect(changesSchema('create table t (id int)', mysql)).toBe(true)
    expect(changesSchema('SELECT 1; ALTER TABLE t ADD c int', mysql)).toBe(true)
    expect(changesSchema("UPDATE t SET a = 'DROP'", mysql)).toBe(false)
    expect(changesSchema('DO $$ BEGIN CREATE TABLE t (); END $$', pg)).toBe(
      true
    )
    expect(changesSchema('EXPLAIN CREATE TABLE t AS SELECT 1', pg)).toBe(false)
    expect(
      changesSchema('EXPLAIN ANALYZE CREATE TABLE t AS SELECT 1', pg)
    ).toBe(true)
  })
})
