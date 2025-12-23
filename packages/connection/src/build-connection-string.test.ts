import { DatabaseType } from '@conar/shared/enums/database-type'
import { describe, expect, it } from 'bun:test'
import { buildConnectionString } from './build-connection-string'
import { parseConnectionString } from './parse-connection-string'

describe('buildConnectionString', () => {
  it('should build basic PostgreSQL connection string', () => {
    const result = buildConnectionString(DatabaseType.Postgres, {
      host: 'localhost',
      port: 5432,
      user: 'user',
      password: 'password',
      database: 'mydb',
    })

    expect(result).toBe('postgresql://user:password@localhost:5432/mydb')
  })

  it('should build connection string without password', () => {
    const result = buildConnectionString(DatabaseType.Postgres, {
      host: 'localhost',
      port: 5432,
      user: 'user',
      database: 'mydb',
    })

    expect(result).toBe('postgresql://user@localhost:5432/mydb')
  })

  it('should build connection string without user', () => {
    const result = buildConnectionString(DatabaseType.Postgres, {
      host: 'localhost',
      port: 5432,
      database: 'mydb',
    })

    expect(result).toBe('postgresql://localhost:5432/mydb')
  })

  it('should build connection string without port', () => {
    const result = buildConnectionString(DatabaseType.Postgres, {
      host: 'localhost',
      user: 'user',
      password: 'password',
      database: 'mydb',
    })

    expect(result).toBe('postgresql://user:password@localhost/mydb')
  })

  it('should build connection string without database', () => {
    const result = buildConnectionString(DatabaseType.Postgres, {
      host: 'localhost',
      port: 5432,
      user: 'user',
      password: 'password',
    })

    expect(result).toBe('postgresql://user:password@localhost:5432')
  })

  it('should build MySQL connection string', () => {
    const result = buildConnectionString(DatabaseType.MySQL, {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'secret',
      database: 'testdb',
    })

    expect(result).toBe('mysql://root:secret@localhost:3306/testdb')
  })

  it('should build MSSQL connection string', () => {
    const result = buildConnectionString(DatabaseType.MSSQL, {
      host: 'localhost',
      port: 1433,
      user: 'sa',
      password: 'password',
      database: 'master',
    })

    expect(result).toBe('sqlserver://sa:password@localhost:1433/master')
  })

  it('should build ClickHouse connection string', () => {
    const result = buildConnectionString(DatabaseType.ClickHouse, {
      host: 'localhost',
      port: 8443,
      user: 'default',
      password: 'password',
    })

    expect(result).toBe('https://default:password@localhost:8443')
  })

  it('should build connection string with options', () => {
    const result = buildConnectionString(DatabaseType.Postgres, {
      host: 'localhost',
      port: 5432,
      user: 'user',
      password: 'password',
      database: 'mydb',
      options: 'sslmode=require',
    })

    expect(result).toBe('postgresql://user:password@localhost:5432/mydb?sslmode=require')
  })

  it('should handle options with leading ?', () => {
    const result = buildConnectionString(DatabaseType.Postgres, {
      host: 'localhost',
      port: 5432,
      user: 'user',
      password: 'password',
      database: 'mydb',
      options: '?sslmode=require',
    })

    expect(result).toBe('postgresql://user:password@localhost:5432/mydb?sslmode=require')
  })

  it('should return empty string when host is missing', () => {
    const result = buildConnectionString(DatabaseType.Postgres, {
      host: '',
      user: 'user',
      password: 'password',
    })

    expect(result).toBe('')
  })

  it('should handle port as string', () => {
    const result = buildConnectionString(DatabaseType.Postgres, {
      host: 'localhost',
      port: '5432',
      user: 'user',
      password: 'password',
      database: 'mydb',
    })

    expect(result).toBe('postgresql://user:password@localhost:5432/mydb')
  })
})

describe('round-trip: parse -> build', () => {
  it('should round-trip a basic PostgreSQL connection string', () => {
    const original = 'postgresql://user:password@localhost:5432/mydb'
    const parsed = parseConnectionString(original)
    const rebuilt = buildConnectionString(DatabaseType.Postgres, {
      host: parsed.host,
      port: parsed.port,
      user: parsed.user,
      password: parsed.password,
      database: parsed.database,
    })

    expect(rebuilt).toBe(original)
  })

  it('should round-trip a connection string without password', () => {
    const original = 'postgresql://user@localhost:5432/mydb'
    const parsed = parseConnectionString(original)
    const rebuilt = buildConnectionString(DatabaseType.Postgres, {
      host: parsed.host,
      port: parsed.port,
      user: parsed.user,
      password: parsed.password,
      database: parsed.database,
    })

    expect(rebuilt).toBe(original)
  })

  it('should round-trip a connection string without database', () => {
    const original = 'postgresql://user:password@localhost:5432'
    const parsed = parseConnectionString(original)
    const rebuilt = buildConnectionString(DatabaseType.Postgres, {
      host: parsed.host,
      port: parsed.port,
      user: parsed.user,
      password: parsed.password,
      database: parsed.database,
    })

    expect(rebuilt).toBe(original)
  })

  it('should round-trip a MySQL connection string', () => {
    const original = 'mysql://root:secret@db.example.com:3306/production'
    const parsed = parseConnectionString(original)
    const rebuilt = buildConnectionString(DatabaseType.MySQL, {
      host: parsed.host,
      port: parsed.port,
      user: parsed.user,
      password: parsed.password,
      database: parsed.database,
    })

    expect(rebuilt).toBe(original)
  })
})
