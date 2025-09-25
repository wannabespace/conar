import { describe, expect, it } from 'bun:test'
import { parseConnectionString } from './parse-connection-string'

describe('parseConnectionString', () => {
  it('should parse basic connection string', () => {
    const connectionString = 'postgresql://user:password@localhost:5432/mydb'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'user',
      password: 'password',
      host: 'localhost',
      port: 5432,
      database: 'mydb',
    })
  })

  it('should parse connection string without port', () => {
    const connectionString = 'postgresql://user:password@localhost/mydb'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'user',
      password: 'password',
      host: 'localhost',
      database: 'mydb',
    })
  })

  it('should parse connection string without database', () => {
    const connectionString = 'postgresql://user:password@localhost:5432'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'user',
      password: 'password',
      host: 'localhost',
      port: 5432,
    })
  })

  it('should parse connection string without password', () => {
    const connectionString = 'postgresql://user@localhost:5432/mydb'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'user',
      host: 'localhost',
      port: 5432,
      database: 'mydb',
    })
  })

  it('should handle special characters in password', () => {
    const connectionString = 'postgresql://user:p@ssw#rd@localhost:5432/mydb'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'user',
      password: 'p@ssw#rd',
      host: 'localhost',
      port: 5432,
      database: 'mydb',
    })
  })

  describe('SSL Configuration', () => {
    it('should parse sslmode=disable', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=disable'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(false)
    })

    it('should parse sslmode=require', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=require'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        rejectUnauthorized: false,
      })
    })

    it('should parse sslmode=prefer', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=prefer'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        rejectUnauthorized: false,
      })
    })

    it('should parse sslmode=verify-ca without sslrootcert', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-ca'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({})
    })

    it('should parse sslmode=verify-ca with sslrootcert', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-ca&sslrootcert=/path/to/ca.pem'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        ca: '/path/to/ca.pem',
      })
    })

    it('should parse sslmode=verify with sslrootcert (Supabase pooler)', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify&sslrootcert=/path/to/ca.pem'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        ca: '/path/to/ca.pem',
      })
    })

    it('should parse sslmode=verify without sslrootcert', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({ rejectUnauthorized: true })
    })

    it('should parse invalid sslmode', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=invalid'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({})
    })

    it('should parse sslmode=verify-full without sslrootcert', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        cert: '/path/to/cert.pem',
        key: '/path/to/key.pem',
      })
    })

    it('should parse sslmode=verify-full with sslrootcert only', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslrootcert=/path/to/ca.pem'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        ca: '/path/to/ca.pem',
      })
    })

    it('should throw error for sslmode=disable with SSL parameters', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=disable&sslcert=/path/to/cert.pem'

      expect(() => parseConnectionString(connectionString)).toThrow('sslmode=disable cannot be used with SSL certificate parameters (sslcert, sslkey, sslrootcert, sslpassword, sslservername)')
    })

    it('should parse sslmode=verify-full with SSL certificates', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem&sslrootcert=/path/to/ca.pem'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        cert: '/path/to/cert.pem',
        key: '/path/to/key.pem',
        ca: '/path/to/ca.pem',
      })
    })

    it('should parse sslmode=verify-full with all SSL parameters', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem&sslrootcert=/path/to/ca.pem&sslpassword=mypassword&sslservername=example.com'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        cert: '/path/to/cert.pem',
        key: '/path/to/key.pem',
        ca: '/path/to/ca.pem',
        passphrase: 'mypassword',
        servername: 'example.com',
      })
    })

    it('should parse SSL parameters without sslmode', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem&sslrootcert=/path/to/ca.pem&sslpassword=mypassword&sslservername=example.com'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        cert: '/path/to/cert.pem',
        key: '/path/to/key.pem',
        ca: '/path/to/ca.pem',
        passphrase: 'mypassword',
        servername: 'example.com',
      })
    })

    it('should handle sslmode=require with SSL parameters (parameters should be merged)', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=require&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        cert: '/path/to/cert.pem',
        key: '/path/to/key.pem',
      })
    })

    it('should handle sslmode=require without SSL parameters (should return true)', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=require'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        rejectUnauthorized: false,
      })
    })

    it('should parse ssl parameter (true/false, 1/0, case insensitive)', () => {
      expect(parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=true').ssl).toBe(true)
      expect(parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=1').ssl).toBe(true)
      expect(parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=TRUE').ssl).toBe(true)
      expect(parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=false').ssl).toBe(false)
      expect(parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=0').ssl).toBe(false)
      expect(parseConnectionString('postgresql://user:password@localhost:5432/mydb?ssl=FALSE').ssl).toBe(false)
    })

    it('should prioritize sslmode over ssl parameter', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=disable&ssl=true'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(false)
    })
  })
})

describe('real-world Examples', () => {
  it('should parse Heroku Postgres connection string', () => {
    const connectionString = 'postgresql://user:password@ec2-54-83-1-101.compute-1.amazonaws.com:5432/dbname?sslmode=require'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'user',
      password: 'password',
      host: 'ec2-54-83-1-101.compute-1.amazonaws.com',
      port: 5432,
      database: 'dbname',
      ssl: {
        rejectUnauthorized: false,
      },
    })
  })

  it('should parse production connection string with full SSL', () => {
    const connectionString = 'postgresql://produser:prodpass@prod-db.example.com:5432/proddb?sslmode=verify-full&sslcert=/path/to/client-cert.pem&sslkey=/path/to/client-key.pem&sslrootcert=/path/to/ca-cert.pem&sslservername=prod-db.example.com'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'produser',
      password: 'prodpass',
      host: 'prod-db.example.com',
      port: 5432,
      database: 'proddb',
      ssl: {
        cert: '/path/to/client-cert.pem',
        key: '/path/to/client-key.pem',
        ca: '/path/to/ca-cert.pem',
        servername: 'prod-db.example.com',
      },
    })
  })
})
