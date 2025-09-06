import { describe, expect, it } from 'bun:test'
import { SafeURL } from './safe-url'

const RANDOM_URLS = [
  'http://localhost:5432/mydb',
  'postgresql://user:pass@localhost:5432/mydb',
  'mysql://root:secret@127.0.0.1:3306/testdb',
  'mssql://sa:password@sqlserver.example.com:1433/production',
  'mongodb://mongoUser:mongoPass@mongo.example.com:27017/my-mongo-db',
  'oracle://oracleUser:oraclePass@oraclehost:1521/ORCLPDB1',
  'redis://:redispass@redis.example.com:6379/0',
  'cassandra://cassandraUser:cassandraPass@cassandra.example.com:9042/keyspace1',
  'cockroachdb://roach:roachpass@roach.example.com:26257/roachdb?sslmode=disable',
  'db2://db2inst1:db2pass@db2host:50000/SAMPLE',
]

describe('new SafeURL', () => {
  it('parses a standard Postgres connection string', () => {
    const conn = 'postgresql://user:pass@localhost:5432/mydb'
    const parsed = new SafeURL(conn)

    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      origin: 'postgresql://localhost:5432',
      host: 'localhost:5432',
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with query parameters', () => {
    const conn = 'postgresql://user:pass@localhost:5432/mydb?sslmode=require&application_name=myapp'
    const parsed = new SafeURL(conn)

    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      origin: 'postgresql://localhost:5432',
      host: 'localhost:5432',
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '?sslmode=require&application_name=myapp',
      hash: '',
      href: conn,
    })
    expect(Array.from(parsed.searchParams.entries())).toEqual([
      ['sslmode', 'require'],
      ['application_name', 'myapp'],
    ])
  })

  it('parses a connection string with different protocol', () => {
    const conn = 'postgres://alice:secret@db.example.com:6543/sampledb'
    const parsed = new SafeURL(conn)

    expect(parsed).toMatchObject({
      protocol: 'postgres:',
      origin: 'postgres://db.example.com:6543',
      host: 'db.example.com:6543',
      username: 'alice',
      password: 'secret',
      hostname: 'db.example.com',
      port: '6543',
      pathname: '/sampledb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with empty database and options', () => {
    const conn = 'postgresql://user:pass@localhost:5432/'
    const parsed = new SafeURL(conn)

    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      origin: 'postgresql://localhost:5432',
      host: 'localhost:5432',
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/',
      search: '',
      hash: '',
      href: conn,
    })
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with special characters in username and password', () => {
    const conn = 'postgresql://us%40er:pa%3A#ss@localhost:5432/mydb'
    const parsed = new SafeURL(conn)

    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      origin: 'postgresql://localhost:5432',
      host: 'localhost:5432',
      username: 'us%40er',
      password: 'pa%3A#ss',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with multiple query parameters', () => {
    const conn = 'postgresql://user:pass@localhost:5432/mydb?ssl=true&connect_timeout=10&search_path=myschema'
    const parsed = new SafeURL(conn)

    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      origin: 'postgresql://localhost:5432',
      host: 'localhost:5432',
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '?ssl=true&connect_timeout=10&search_path=myschema',
      hash: '',
      href: conn,
    })
    expect(Array.from(parsed.searchParams.entries())).toEqual([
      ['ssl', 'true'],
      ['connect_timeout', '10'],
      ['search_path', 'myschema'],
    ])
  })

  it('throws on invalid connection string', () => {
    const errorMessage = () => {
      try {
        // eslint-disable-next-line no-new
        new SafeURL('not-a-valid-connection-string')
      }
      catch (e) {
        return (e as Error).message
      }
    }

    expect(() => new SafeURL('not-a-valid-connection-string')).toThrow(errorMessage())
  })

  it('parses a connection string with empty credentials', () => {
    const conn = 'postgresql://:@localhost:5432/mydb'
    const parsed = new SafeURL(conn)

    expect(parsed.protocol).toBe('postgresql:')
    expect(parsed.origin).toBe('postgresql://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(parsed.username).toBe('')
    expect(parsed.password).toBe('')
    expect(parsed.hostname).toBe('localhost')
    expect(parsed.port).toBe('5432')
    expect(parsed.pathname).toBe('/mydb')
    expect(parsed.search).toBe('')
    expect(parsed.hash).toBe('')
    expect(parsed.href).toBe(conn.replace(':@', ''))
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with empty path - with trailing slash', () => {
    const conn = 'postgresql://user:pass@localhost:5432/'
    const parsed = new SafeURL(conn)

    expect(parsed.protocol).toBe('postgresql:')
    expect(parsed.origin).toBe('postgresql://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(parsed.username).toBe('user')
    expect(parsed.password).toBe('pass')
    expect(parsed.hostname).toBe('localhost')
    expect(parsed.port).toBe('5432')
    expect(parsed.pathname).toBe('/')
    expect(parsed.search).toBe('')
    expect(parsed.hash).toBe('')
    expect(parsed.href).toBe(conn)
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with empty path - without trailing slash', () => {
    const conn = 'postgresql://user:pass@localhost:5432'
    const parsed = new SafeURL(conn)

    expect(parsed.protocol).toBe('postgresql:')
    expect(parsed.origin).toBe('postgresql://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(parsed.username).toBe('user')
    expect(parsed.password).toBe('pass')
    expect(parsed.hostname).toBe('localhost')
    expect(parsed.port).toBe('5432')
    expect(parsed.pathname).toBe('')
    expect(parsed.search).toBe('')
    expect(parsed.hash).toBe('')
    expect(parsed.href).toBe(conn)
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  describe('property setting', () => {
    it('should allow setting username and password properties', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb'
      const parsed = new SafeURL(conn)

      parsed.username = 'newuser'
      parsed.password = 'newpass'

      expect(parsed.username).toBe('newuser')
      expect(parsed.password).toBe('newpass')
      expect(parsed.href).toBe('postgresql://newuser:newpass@localhost:5432/mydb')
    })

    it('should handle setting empty credentials', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb'
      const parsed = new SafeURL(conn)

      parsed.username = ''
      parsed.password = ''

      expect(parsed.username).toBe('')
      expect(parsed.password).toBe('')
      expect(parsed.href).toBe('postgresql://localhost:5432/mydb')
    })

    it('should handle setting special characters in credentials', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb'
      const parsed = new SafeURL(conn)

      parsed.username = 'user@domain'
      parsed.password = 'pass:word'

      expect(parsed.username).toBe('user@domain')
      expect(parsed.password).toBe('pass:word')
      expect(parsed.href).toBe('postgresql://user@domain:pass:word@localhost:5432/mydb')
    })

    it('should maintain other properties when setting credentials', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb?ssl=true#section'
      const parsed = new SafeURL(conn)

      parsed.username = 'newuser'
      parsed.password = 'newpass'

      expect(parsed).toMatchObject({
        protocol: 'postgresql:',
        origin: 'postgresql://localhost:5432',
        host: 'localhost:5432',
        hostname: 'localhost',
        port: '5432',
        pathname: '/mydb',
        search: '?ssl=true',
        hash: '#section',
        username: 'newuser',
        password: 'newpass',
        href: conn.replace('user:pass', 'newuser:newpass'),
      })
    })

    it('should allow setting other properties and reflect in href', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb?ssl=true#section'
      const parsed = new SafeURL(conn)

      parsed.username = 'alice'
      parsed.password = 'wonderland'
      parsed.protocol = 'mysql:'
      parsed.hostname = 'db.example.com'
      parsed.port = '3306'
      parsed.pathname = '/testdb'
      parsed.search = '?foo=bar&baz=qux'
      parsed.hash = '#top'

      expect(parsed.protocol).toBe('mysql:')
      expect(parsed.hostname).toBe('db.example.com')
      expect(parsed.port).toBe('3306')
      expect(parsed.pathname).toBe('/testdb')
      expect(parsed.search).toBe('?foo=bar&baz=qux')
      expect(parsed.hash).toBe('#top')
      expect(parsed.username).toBe('alice')
      expect(parsed.password).toBe('wonderland')
      expect(parsed.href).toBe('mysql://alice:wonderland@db.example.com:3306/testdb?foo=bar&baz=qux#top')
    })
  })

  describe('hrefEncoded', () => {
    it('should return properly encoded URL for basic connection string', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb'
      const parsed = new SafeURL(conn)

      expect(parsed.hrefEncoded).toBe('postgresql://user:pass@localhost:5432/mydb')
    })

    it('should encode special characters in credentials when set via properties', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb'
      const parsed = new SafeURL(conn)
      parsed.username = 'user@domain'
      parsed.password = 'pass:word'

      expect(parsed.hrefEncoded).toBe('postgresql://user%40domain:pass%3Aword@localhost:5432/mydb')
    })

    it('should handle empty credentials', () => {
      const conn = 'postgresql://:@localhost:5432/mydb'
      const parsed = new SafeURL(conn)

      expect(parsed.hrefEncoded).toBe('postgresql://localhost:5432/mydb')
    })

    it('should preserve query parameters and hash', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb?ssl=true#section'
      const parsed = new SafeURL(conn)

      expect(parsed.hrefEncoded).toBe('postgresql://user:pass@localhost:5432/mydb?ssl=true#section')
    })

    it('should handle different database protocols', () => {
      const conn = 'mysql://user:pass@localhost:3306/mydb'
      const parsed = new SafeURL(conn)

      expect(parsed.hrefEncoded).toBe('mysql://user:pass@localhost:3306/mydb')
    })
  })

  it('parses a random database URL', () => {
    for (const url of RANDOM_URLS) {
      expect(() => new SafeURL(url)).not.toThrow()
      const parsed = new SafeURL(url)
      expect(parsed.href).toBe(url)
      expect(typeof parsed.protocol).toBe('string')
      expect(typeof parsed.hostname).toBe('string')
      expect(typeof parsed.host).toBe('string')
      expect(typeof parsed.origin).toBe('string')
      expect(typeof parsed.username).toBe('string')
      expect(typeof parsed.password).toBe('string')
      expect(typeof parsed.pathname).toBe('string')
      expect(typeof parsed.search).toBe('string')
      expect(typeof parsed.hash).toBe('string')
      expect(Array.isArray(Array.from(parsed.searchParams.entries()))).toBe(true)
    }
  })
})
