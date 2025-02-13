import { describe, expect, it } from 'vitest'
import { parseConnectionString } from './connections'

describe('parseConnectionString', () => {
  it('should parse the connection string', () => {
    const result = parseConnectionString('postgresql://postgres:123456@db.supabase.co:5432/postgres?ssl=true')

    expect(result).toEqual({
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
      username: 'postgres',
      password: '123456',
      host: 'db.supabase.co',
      port: 5432,
      database: 'postgres',
      options: null,
    })
  })

  it('should parse the connection string without protocol', () => {
    const connectionString = 'postgres:123456@db.supabase.co:5432/postgres?ssl=true'

    const result = parseConnectionString(connectionString)

    expect(result).toEqual({
      username: 'postgres',
      password: '123456',
      host: 'db.supabase.co',
      port: 5432,
      database: 'postgres',
      options: 'ssl=true',
    })
  })
})
