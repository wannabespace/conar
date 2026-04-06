import { ConnectionType } from '@conar/shared/enums/connection-type'
import { describe, expect, it } from 'bun:test'
import { createListTransformer } from './index'

describe('createListTransformer', () => {
  it('should return a postgres transformer for Postgres', () => {
    const t = createListTransformer(ConnectionType.Postgres)
    expect(t.toDb('["a","b"]')).toBe('{a,b}')
  })

  it('should return a mysql transformer for MySQL', () => {
    const t = createListTransformer(ConnectionType.MySQL)
    expect(t.toDb('["a","b"]')).toBe('a,b')
  })

  it('should return a clickhouse transformer for ClickHouse', () => {
    const t = createListTransformer(ConnectionType.ClickHouse)
    expect(t.toDb('["a","b"]')).toBe('["a","b"]')
  })

  it('should fall back to postgres transformer for MSSQL', () => {
    const t = createListTransformer(ConnectionType.MSSQL)
    expect(t.toDb('["a","b"]')).toBe('{a,b}')
  })
})
