import { describe, expect, it } from 'bun:test'

import { readConnectionString } from '../parse-connection-string'
import { parseSSLConfig } from './mysql'

describe('MySQL SSL Configuration', () => {
  it('should return undefined when no SSL parameters', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toBeUndefined()
  })

  it('should parse ssl=false', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=false'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toBe(false)
  })

  it('should parse ssl=0', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=0'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toBe(false)
  })

  it('should parse ssl=true', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({})
  })

  it('should parse ssl=1', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=1'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({})
  })

  it('should parse ssl parameter (true/false, 1/0, case insensitive)', () => {
    expect(
      parseSSLConfig(
        readConnectionString(
          'mysql://user:password@localhost:3306/mydb?ssl=true'
        ).searchParams
      )
    ).toEqual({})
    expect(
      parseSSLConfig(
        readConnectionString('mysql://user:password@localhost:3306/mydb?ssl=1')
          .searchParams
      )
    ).toEqual({})
    expect(
      parseSSLConfig(
        readConnectionString(
          'mysql://user:password@localhost:3306/mydb?ssl=TRUE'
        ).searchParams
      )
    ).toEqual({})
    expect(
      parseSSLConfig(
        readConnectionString(
          'mysql://user:password@localhost:3306/mydb?ssl=false'
        ).searchParams
      )
    ).toBe(false)
    expect(
      parseSSLConfig(
        readConnectionString('mysql://user:password@localhost:3306/mydb?ssl=0')
          .searchParams
      )
    ).toBe(false)
    expect(
      parseSSLConfig(
        readConnectionString(
          'mysql://user:password@localhost:3306/mydb?ssl=FALSE'
        ).searchParams
      )
    ).toBe(false)
  })

  it('should throw error for ssl=false with SSL parameters', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=false&sslcert=/path/to/cert.pem'
    )

    expect(() => parseSSLConfig(connectionString.searchParams)).toThrow(
      'ssl=false cannot be used with SSL certificate parameters'
    )
  })

  it('should parse sslca', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?sslca=/path/to/ca.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      ca: '/path/to/ca.pem',
    })
  })

  it('should parse sslcert and sslkey', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem',
    })
  })

  it('should parse all SSL certificate parameters', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?sslca=/path/to/ca.pem&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      ca: '/path/to/ca.pem',
      cert: '/path/to/cert.pem',
      key: '/path/to/key.pem',
    })
  })

  it('should parse sslpassphrase', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslpassphrase=mypassphrase'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      passphrase: 'mypassphrase',
    })
  })

  it('should parse sslpassword as alias for sslpassphrase', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslpassword=mypassword'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      passphrase: 'mypassword',
    })
  })

  it('should prioritize sslpassphrase over sslpassword', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslpassphrase=phrase&sslpassword=password'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      passphrase: 'phrase',
    })
  })

  it('should parse sslrejectunauthorized=true', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslrejectunauthorized=true'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      rejectUnauthorized: true,
    })
  })

  it('should parse sslrejectunauthorized=false', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslrejectunauthorized=false'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      rejectUnauthorized: false,
    })
  })

  it('should parse sslrejectunauthorized with 1/0', () => {
    const config1 = parseSSLConfig(
      readConnectionString(
        'mysql://user:password@localhost:3306/mydb?ssl=true&sslrejectunauthorized=1'
      ).searchParams
    )
    expect(config1).toEqual({
      rejectUnauthorized: true,
    })

    const config0 = parseSSLConfig(
      readConnectionString(
        'mysql://user:password@localhost:3306/mydb?ssl=true&sslrejectunauthorized=0'
      ).searchParams
    )
    expect(config0).toEqual({
      rejectUnauthorized: false,
    })
  })

  it('should parse sslciphers', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslciphers=HIGH:!aNULL'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      ciphers: 'HIGH:!aNULL',
    })
  })

  it('should parse sslminversion', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslminversion=TLSv1.2'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      minVersion: 'TLSv1.2',
    })
  })

  it('should parse sslmaxversion', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslmaxversion=TLSv1.3'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      maxVersion: 'TLSv1.3',
    })
  })

  it('should parse sslpfx', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?sslpfx=/path/to/cert.pfx'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      pfx: '/path/to/cert.pfx',
    })
  })

  it('should parse all SSL parameters together', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslca=/path/to/ca.pem&sslcert=/path/to/cert.pem&sslkey=/path/to/key.pem&sslpassphrase=pass&sslrejectunauthorized=true&sslservername=server.com&sslciphers=HIGH&sslminversion=TLSv1.2&sslmaxversion=TLSv1.3'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      ca: '/path/to/ca.pem',
      cert: '/path/to/cert.pem',
      ciphers: 'HIGH',
      key: '/path/to/key.pem',
      maxVersion: 'TLSv1.3',
      minVersion: 'TLSv1.2',
      passphrase: 'pass',
      rejectUnauthorized: true,
    })
  })

  it('should enable SSL when SSL parameters are present without ssl flag', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?sslca=/path/to/ca.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      ca: '/path/to/ca.pem',
    })
  })

  it('should merge ssl=true with SSL parameters', () => {
    const connectionString = readConnectionString(
      'mysql://user:password@localhost:3306/mydb?ssl=true&sslca=/path/to/ca.pem&sslcert=/path/to/cert.pem'
    )
    const config = parseSSLConfig(connectionString.searchParams)

    expect(config).toEqual({
      ca: '/path/to/ca.pem',
      cert: '/path/to/cert.pem',
    })
  })
})
