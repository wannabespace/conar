import { describe, expect, it } from 'bun:test'
import { parseConnectionString } from '../parse-connection-string'
import { parseSSLConfig } from './pg'

describe('SSL Configuration', () => {
  it('should parse sslmode=disable', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=disable'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toBe(false)
  })

  it('should parse sslmode=require', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=require'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      rejectUnauthorized: false,
    })
  })

  it('should parse sslmode=prefer', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=prefer'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      rejectUnauthorized: false,
    })
  })

  it('should parse sslmode=verify-ca without sslrootcert', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=verify-ca'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({})
  })

  it('should parse sslmode=verify-ca with sslrootcert', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=verify-ca&sslrootcert=/path/to/ca.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      ca: '/path/to/ca.pem',
    })
  })

  it('should parse sslmode=verify with sslrootcert (Supabase pooler)', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=verify&sslrootcert=/path/to/ca.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      ca: '/path/to/ca.pem',
    })
  })

  it('should parse sslmode=verify without sslrootcert', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=verify'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({ rejectUnauthorized: true })
  })

  it('should parse invalid sslmode', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=invalid'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({})
  })

  it('should parse sslmode=verify-full without sslrootcert', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem',
    })
  })

  it('should parse sslmode=verify-full with sslrootcert only', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslrootcert=/path/to/ca.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      ca: '/path/to/ca.pem',
    })
  })

  it('should throw error for sslmode=disable with SSL parameters', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=disable&sslcert=/path/to/cert.pem'
    )

    expect(() => parseSSLConfig(connectionString.searchParams)).toThrow(
      'sslmode=disable cannot be used with SSL certificate parameters (sslcert, sslkey, sslrootcert, sslpassword, sslservername)'
    )
  })

  it('should parse sslmode=verify-full with SSL certificates', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem&sslrootcert=/path/to/ca.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem',
      ca: '/path/to/ca.pem',
    })
  })

  it('should parse sslmode=verify-full with all SSL parameters', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem&sslrootcert=/path/to/ca.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem',
      ca: '/path/to/ca.pem',
    })
  })

  it('should parse SSL parameters without sslmode', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem&sslrootcert=/path/to/ca.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem',
      ca: '/path/to/ca.pem',
    })
  })

  it('should handle sslmode=require with SSL parameters (parameters should be merged)', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=require&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem',
    })
  })

  it('should handle sslmode=require without SSL parameters (should return true)', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=require'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      rejectUnauthorized: false,
    })
  })

  it('should parse ssl parameter (true/false, 1/0, case insensitive)', () => {
    expect(
      parseSSLConfig(
        parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=true')
          .searchParams
      )
    ).toBe(true)
    expect(
      parseSSLConfig(
        parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=1').searchParams
      )
    ).toBe(true)
    expect(
      parseSSLConfig(
        parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=TRUE')
          .searchParams
      )
    ).toBe(true)
    expect(
      parseSSLConfig(
        parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=false')
          .searchParams
      )
    ).toBe(false)
    expect(
      parseSSLConfig(
        parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=0').searchParams
      )
    ).toBe(false)
    expect(
      parseSSLConfig(
        parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=FALSE')
          .searchParams
      )
    ).toBe(false)
  })

  it('should prioritize sslmode over ssl parameter', () => {
    const connectionString = parseConnectionString(
      'postgresql://user:password@localhost:5432/mydb?sslmode=disable&ssl=true'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toBe(false)
  })
})
