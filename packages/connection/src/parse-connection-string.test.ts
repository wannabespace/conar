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

      expect(config.ssl).toBe(true)
    })

    it('should parse sslmode=prefer', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=prefer'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(true)
    })

    it('should throw error for sslmode=verify-ca without sslrootcert', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-ca'

      expect(() => parseConnectionString(connectionString)).toThrow('sslmode=verify-ca requires sslrootcert to be provided')
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

    it('should throw error for sslmode=verify without sslrootcert', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify'

      expect(() => parseConnectionString(connectionString)).toThrow('sslmode=verify requires sslrootcert to be provided')
    })

    it('should throw error for invalid sslmode', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=invalid'

      expect(() => parseConnectionString(connectionString)).toThrow('Invalid sslmode value: invalid. Valid values are: disable, prefer, require, verify, verify-ca, verify-full, no-verify')
    })

    it('should throw error for sslmode=verify-full without sslrootcert', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem'

      expect(() => parseConnectionString(connectionString)).toThrow('sslmode=verify-full requires sslrootcert to be provided')
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

    it('should parse sslmode=verify-full with servername', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslservername=example.com&sslrootcert=/path/to/ca.pem'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        servername: 'example.com',
        ca: '/path/to/ca.pem',
      })
    })

    it('should parse sslmode=verify-full with sslpassword', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?sslmode=verify-full&sslpassword=mypassword&sslrootcert=/path/to/ca.pem'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toEqual({
        passphrase: 'mypassword',
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

      expect(config.ssl).toBe(true)
    })

    it('should parse ssl=true', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?ssl=true'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(true)
    })

    it('should parse ssl=1', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?ssl=1'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(true)
    })

    it('should parse ssl=false', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?ssl=false'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(false)
    })

    it('should parse ssl=0', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?ssl=0'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(false)
    })

    it('should parse ssl=TRUE (case insensitive)', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?ssl=TRUE'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(true)
    })

    it('should parse ssl=FALSE (case insensitive)', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?ssl=FALSE'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(false)
    })

    it('should handle ssl parameter without sslmode', () => {
      const connectionString = 'postgresql://user:password@localhost:5432/mydb?ssl=true'
      const config = parseConnectionString(connectionString)

      expect(config.ssl).toBe(true)
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
      ssl: true,
    })
  })

  it('should parse AWS RDS connection string', () => {
    const connectionString = 'postgresql://username:password@mydbinstance.c9akciq32q.us-west-2.rds.amazonaws.com:5432/mydb?sslmode=require&application_name=myapp'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'username',
      password: 'password',
      host: 'mydbinstance.c9akciq32q.us-west-2.rds.amazonaws.com',
      port: 5432,
      database: 'mydb',
      ssl: true,
    })
  })

  it('should parse local development connection string', () => {
    const connectionString = 'postgresql://postgres:postgres@localhost:5432/myapp_dev?sslmode=prefer'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'postgres',
      password: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'myapp_dev',
      ssl: true,
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

  it('should parse connection string with sslmode=verify-ca and sslrootcert', () => {
    const connectionString = 'postgresql://postgres.ghfgh:p%2396!h6h@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=verify&sslrootcert=/Users/user/cert.crt'
    const config = parseConnectionString(connectionString)

    expect(config).toEqual({
      user: 'postgres.ghfgh',
      password: 'p%2396!h6h',
      host: 'aws-0-eu-central-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      ssl: {
        ca: '/Users/user/cert.crt',
      },
    })
  })
})
