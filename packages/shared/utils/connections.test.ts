import { describe, expect, it } from 'vitest'
import { parseConnectionString } from './connections'

describe('parseConnectionString', () => {
  it('should parse the connection string', () => {
    const result = parseConnectionString('postgresql://postgres:123456@db.supabase.co:5432/postgres?ssl=true')

    expect(result).toEqual({
      protocol: 'postgresql',
      username: 'postgres',
      password: '123456',
      host: 'db.supabase.co',
      port: 5432,
      database: 'postgres',
      options: 'ssl=true',
    })
  })

  it('should parse the connection string without options', () => {
    const result = parseConnectionString('postgresql://postgres:123456@db.supabase.co:5432/postgres')

    expect(result).toEqual({
      protocol: 'postgresql',
      username: 'postgres',
      password: '123456',
      host: 'db.supabase.co',
      port: 5432,
      database: 'postgres',
      options: null,
    })
  })

  it('should parse the connection string without password', () => {
    const result = parseConnectionString('postgresql://postgres@db.supabase.co:5432/postgres')

    expect(result).toEqual({
      protocol: 'postgresql',
      username: 'postgres',
      password: null,
      host: 'db.supabase.co',
      port: 5432,
      database: 'postgres',
      options: null,
    })
  })

  it('should parse the connection string with extra protocol', () => {
    const connectionString = 'mongodb+svr://postgres:123456@db.supabase.co:5432/postgres?ssl=true'

    const result = parseConnectionString(connectionString)

    expect(result).toEqual({
      protocol: 'mongodb+svr',
      username: 'postgres',
      password: '123456',
      host: 'db.supabase.co',
      port: 5432,
      database: 'postgres',
      options: 'ssl=true',
    })
  })

  it('should throw an error if the connection string is invalid', () => {
    expect(() => parseConnectionString('postgresql://postgres/postgres')).toThrow()
  })
})
