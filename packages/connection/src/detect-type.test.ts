import { DatabaseType } from '@conar/shared/enums/database-type'
import { describe, expect, it } from 'bun:test'
import { detectTypeFromConnectionString } from './detect-type'

describe('detectTypeFromConnectionString', () => {
  it('should detect postgres from postgresql:// protocol', () => {
    expect(detectTypeFromConnectionString('postgresql://user:pass@localhost:5432/db'))
      .toBe(DatabaseType.Postgres)
  })

  it('should detect postgres from postgres:// protocol', () => {
    expect(detectTypeFromConnectionString('postgres://user:pass@localhost:5432/db'))
      .toBe(DatabaseType.Postgres)
  })

  it('should detect mysql from mysql:// protocol', () => {
    expect(detectTypeFromConnectionString('mysql://user:pass@localhost:3306/db'))
      .toBe(DatabaseType.MySQL)
  })

  it('should detect mssql from sqlserver:// protocol', () => {
    expect(detectTypeFromConnectionString('sqlserver://user:pass@localhost:1433/db'))
      .toBe(DatabaseType.MSSQL)
  })

  it('should detect mssql from mssql:// protocol', () => {
    expect(detectTypeFromConnectionString('mssql://user:pass@localhost:1433/db'))
      .toBe(DatabaseType.MSSQL)
  })

  it('should detect clickhouse from https:// protocol', () => {
    expect(detectTypeFromConnectionString('https://user:pass@localhost:8443'))
      .toBe(DatabaseType.ClickHouse)
  })

  it('should detect clickhouse from http:// protocol', () => {
    expect(detectTypeFromConnectionString('http://user:pass@localhost:8123'))
      .toBe(DatabaseType.ClickHouse)
  })

  it('should return null for empty string', () => {
    expect(detectTypeFromConnectionString('')).toBeNull()
    expect(detectTypeFromConnectionString('   ')).toBeNull()
  })

  it('should return null for invalid URL', () => {
    expect(detectTypeFromConnectionString('not-a-url')).toBeNull()
    expect(detectTypeFromConnectionString('://missing-protocol')).toBeNull()
  })

  it('should return null for unknown protocol', () => {
    expect(detectTypeFromConnectionString('mongodb://localhost:27017/db')).toBeNull()
    expect(detectTypeFromConnectionString('redis://localhost:6379')).toBeNull()
  })

  it('should handle connection strings with URL-encoded special characters in password', () => {
    expect(detectTypeFromConnectionString('postgresql://user:p%40ss%3Aw%23rd@localhost:5432/db'))
      .toBe(DatabaseType.Postgres)
  })

  it('should handle typical connection strings from cloud providers', () => {
    expect(detectTypeFromConnectionString('postgresql://admin:secret@mydb.cluster-xyz.us-east-1.rds.amazonaws.com:5432/prod'))
      .toBe(DatabaseType.Postgres)
    expect(detectTypeFromConnectionString('postgresql://postgres:password@db.abcdefghij.supabase.co:5432/postgres'))
      .toBe(DatabaseType.Postgres)
  })

  it('should handle connection strings with query parameters', () => {
    expect(detectTypeFromConnectionString('postgresql://user:pass@localhost:5432/db?sslmode=require'))
      .toBe(DatabaseType.Postgres)
  })
})
