import { describe, expect, it } from 'bun:test'

import { parseConnectionString } from './parse-connection-string'
import { parseSSLConfig } from './ssl/mssql'

describe('parseConnectionString', () => {
  it('should parse basic connection string', () => {
    const connectionString = 'postgresql://user:password@localhost:5432/mydb'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      database: 'mydb',
      host: 'localhost',
      password: 'password',
      port: 5432,
      searchParams: new URLSearchParams(),
      user: 'user',
    })
  })

  it('should parse connection string without port', () => {
    const connectionString = 'postgresql://user:password@localhost/mydb'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      database: 'mydb',
      host: 'localhost',
      password: 'password',
      searchParams: new URLSearchParams(),
      user: 'user',
    })
  })

  it('should parse connection string without database', () => {
    const connectionString = 'postgresql://user:password@localhost:5432'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      host: 'localhost',
      password: 'password',
      port: 5432,
      searchParams: new URLSearchParams(),
      user: 'user',
    })
  })

  it('should parse connection string without password', () => {
    const connectionString = 'postgresql://user@localhost:5432/mydb'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      database: 'mydb',
      host: 'localhost',
      port: 5432,
      searchParams: new URLSearchParams(),
      user: 'user',
    })
  })

  it('should handle special characters in password', () => {
    const connectionString = 'postgresql://user:p@ssw#rd@localhost:5432/mydb'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      database: 'mydb',
      host: 'localhost',
      password: 'p@ssw#rd',
      port: 5432,
      searchParams: new URLSearchParams(),
      user: 'user',
    })
  })

  it('should handle special characters in password', () => {
    const connectionString =
      'postgres://user:password@localhost:5432/database?options=-c search_path=auth'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      database: 'database',
      host: 'localhost',
      password: 'password',
      port: 5432,
      searchParams: new URLSearchParams([['options', '-c search_path=auth']]),
      user: 'user',
    })
  })

  it('reads option keys and SQL Server flags in any case', () => {
    const { searchParams } = parseConnectionString(
      'sqlserver://u:p@host:1433/db?TrustServerCertificate=False&Encrypt=TRUE'
    )

    expect(parseSSLConfig(searchParams)).toEqual({
      encrypt: true,
      trustServerCertificate: false,
    })
  })
})
