import { describe, expect, it } from 'bun:test'
import { SafeURL } from './url'

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
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with query parameters', () => {
    const conn = 'postgresql://user:pass@localhost:5432/mydb?sslmode=require&application_name=myapp'
    const parsed = new SafeURL(conn)
    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '?sslmode=require&application_name=myapp',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
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
      username: 'alice',
      password: 'secret',
      hostname: 'db.example.com',
      port: '6543',
      pathname: '/sampledb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgres:://db.example.com:6543')
    expect(parsed.host).toBe('db.example.com:6543')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with empty database and options', () => {
    const conn = 'postgresql://user:pass@localhost:5432/'
    const parsed = new SafeURL(conn)
    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with special characters in username and password', () => {
    const conn = 'postgresql://us%40er:pa%3A#ss@localhost:5432/mydb'
    const parsed = new SafeURL(conn)
    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: 'us%40er',
      password: 'pa%3A#ss',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with multiple query parameters', () => {
    const conn = 'postgresql://user:pass@localhost:5432/mydb?ssl=true&connect_timeout=10&search_path=myschema'
    const parsed = new SafeURL(conn)
    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '?ssl=true&connect_timeout=10&search_path=myschema',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([
      ['ssl', 'true'],
      ['connect_timeout', '10'],
      ['search_path', 'myschema'],
    ])
  })

  it('throws on invalid connection string', () => {
    expect(() => new SafeURL('not-a-valid-connection-string')).toThrow('Invalid URL format')
  })

  it('parses a connection string with numeric username and password', () => {
    const conn = 'postgresql://123:456@localhost:5432/mydb'
    const parsed = new SafeURL(conn)
    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: '123',
      password: '456',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with empty password', () => {
    const conn = 'postgresql://user:@localhost:5432/mydb'
    const parsed = new SafeURL(conn)
    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: 'user',
      password: '',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with empty username', () => {
    const conn = 'postgresql://:pass@localhost:5432/mydb'

    const parsed = new SafeURL(conn)

    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: '',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with empty username and password', () => {
    const conn = 'postgresql://:@localhost:5432/mydb'
    const parsed = new SafeURL(conn)
    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: '',
      password: '',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with no query string', () => {
    const conn = 'postgresql://user:pass@localhost:5432/mydb'
    const parsed = new SafeURL(conn)
    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/mydb',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
  })

  it('parses a connection string with dash and underscore in database name', () => {
    const conn = 'postgresql://user:pass@localhost:5432/my-db_name'
    const parsed = new SafeURL(conn)
    expect(parsed).toMatchObject({
      protocol: 'postgresql:',
      username: 'user',
      password: 'pass',
      hostname: 'localhost',
      port: '5432',
      pathname: '/my-db_name',
      search: '',
      hash: '',
      href: conn,
    })
    expect(parsed.origin).toBe('postgresql:://localhost:5432')
    expect(parsed.host).toBe('localhost:5432')
    expect(Array.from(parsed.searchParams.entries())).toEqual([])
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

  // RFC 3986 Section 3.1 - Scheme tests
  describe('rFC 3986 Section 3.1 - Scheme', () => {
    it('parses schemes that start with a letter', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb'
      expect(new SafeURL(conn).protocol).toBe('postgresql:')
    })

    it('parses schemes with letters, digits, plus, hyphen, and period', () => {
      const schemes = ['http', 'https', 'ftp', 'postgresql', 'mysql', 'db2+ibm', 'ms-sql', 'oracle.thin']

      schemes.forEach((scheme) => {
        const conn = `${scheme}://user:pass@localhost:5432/mydb`
        expect(new SafeURL(conn).protocol).toBe(`${scheme}:`)
      })
    })

    it('handles case-insensitive schemes', () => {
      const conn1 = 'PostgreSQL://user:pass@localhost:5432/mydb'
      const conn2 = 'POSTGRESQL://user:pass@localhost:5432/mydb'

      expect(new SafeURL(conn1).protocol).toBe('PostgreSQL:')
      expect(new SafeURL(conn2).protocol).toBe('POSTGRESQL:')
    })
  })

  // RFC 3986 Section 3.2.1 - User Information tests
  describe('rFC 3986 Section 3.2.1 - User Information', () => {
    it('parses percent-encoded characters in username', () => {
      const conn = 'postgresql://user%40domain:pass@localhost:5432/mydb'
      expect(new SafeURL(conn).username).toBe('user%40domain')
    })

    it('parses percent-encoded characters in password', () => {
      const conn = 'postgresql://user:p%40ss%3Aword@localhost:5432/mydb'
      expect(new SafeURL(conn).password).toBe('p%40ss%3Aword')
    })

    it('parses userinfo with special characters', () => {
      const conn = 'postgresql://user.name_123:complex-password!@localhost:5432/mydb'
      expect(new SafeURL(conn)).toMatchObject({
        username: 'user.name_123',
        password: 'complex-password!',
      })
    })

    it('handles userinfo with only username (no colon)', () => {
      const conn = 'postgresql://username@localhost:5432/mydb'
      expect(new SafeURL(conn)).toMatchObject({
        username: 'username',
        password: '',
      })
    })
  })

  // RFC 3986 Section 3.2.2 - Host tests
  describe('rFC 3986 Section 3.2.2 - Host', () => {
    it('parses IPv4 addresses', () => {
      const conn = 'postgresql://user:pass@192.168.1.100:5432/mydb'
      expect(new SafeURL(conn)).toMatchObject({
        hostname: '192.168.1.100',
        host: '192.168.1.100:5432',
      })
    })

    it('parses IPv6 addresses in brackets', () => {
      const conn = 'postgresql://user:pass@[2001:db8::1]:5432/mydb'
      expect(new SafeURL(conn)).toMatchObject({
        hostname: '[2001:db8::1]',
        host: '[2001:db8::1]:5432',
      })
    })

    it('parses registered names (domain names)', () => {
      const hostnames = [
        'localhost',
        'example.com',
        'sub.domain.example.com',
        'host-name.example.org',
        'test_server.local',
      ]

      hostnames.forEach((hostname) => {
        const conn = `postgresql://user:pass@${hostname}:5432/mydb`
        expect(new SafeURL(conn).hostname).toBe(hostname)
      })
    })

    it('handles case-insensitive hostnames', () => {
      const conn = 'postgresql://user:pass@Example.COM:5432/mydb'
      expect(new SafeURL(conn).hostname).toBe('Example.COM')
    })
  })

  // RFC 3986 Section 3.2.3 - Port tests
  describe('rFC 3986 Section 3.2.3 - Port', () => {
    it('parses standard ports', () => {
      const ports = ['80', '443', '5432', '3306', '1433', '27017']

      ports.forEach((port) => {
        const conn = `postgresql://user:pass@localhost:${port}/mydb`
        expect(new SafeURL(conn).port).toBe(port)
      })
    })

    it('handles empty port (no colon)', () => {
      const conn = 'postgresql://user:pass@localhost/mydb'
      const parsed = new SafeURL(conn)
      expect(parsed.port).toBe('')
      expect(parsed.host).toBe('localhost')
      expect(parsed.origin).toBe('postgresql:://localhost')
    })

    it('parses port range boundaries', () => {
      const conn1 = 'postgresql://user:pass@localhost:1/mydb'
      const conn2 = 'postgresql://user:pass@localhost:65535/mydb'

      expect(new SafeURL(conn1).port).toBe('1')
      expect(new SafeURL(conn2).port).toBe('65535')
    })
  })

  // RFC 3986 Section 3.3 - Path tests
  describe('rFC 3986 Section 3.3 - Path', () => {
    it('parses empty path', () => {
      const conn = 'postgresql://user:pass@localhost:5432'
      expect(new SafeURL(conn).pathname).toBe('/')
    })

    it('parses root path', () => {
      const conn = 'postgresql://user:pass@localhost:5432/'
      expect(new SafeURL(conn).pathname).toBe('/')
    })

    it('parses path with multiple segments', () => {
      const conn = 'postgresql://user:pass@localhost:5432/database/schema/table'
      expect(new SafeURL(conn).pathname).toBe('/database/schema/table')
    })

    it('parses path with percent-encoded characters', () => {
      const conn = 'postgresql://user:pass@localhost:5432/my%20database'
      expect(new SafeURL(conn).pathname).toBe('/my%20database')
    })

    it('parses path with special characters', () => {
      const conn = 'postgresql://user:pass@localhost:5432/my-db_name.test'
      expect(new SafeURL(conn).pathname).toBe('/my-db_name.test')
    })
  })

  // RFC 3986 Section 3.4 - Query tests
  describe('rFC 3986 Section 3.4 - Query', () => {
    it('parses query with percent-encoded characters', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb?ssl%5Fmode=require'
      const parsed = new SafeURL(conn)
      expect(parsed.search).toBe('?ssl%5Fmode=require')
      // The current implementation decodes percent-encoded characters in query parameters
      expect(parsed.searchParams.get('ssl_mode')).toBe('require')
    })

    it('parses query with special characters', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb?options=-c%20search_path%3Dschema1%2Cschema2'
      const parsed = new SafeURL(conn)
      // The current implementation decodes percent-encoded characters
      expect(parsed.searchParams.get('options')).toBe('-c search_path=schema1,schema2')
    })

    it('parses query with multiple values for same key', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb?tag=dev&tag=test'
      const parsed = new SafeURL(conn)
      // URLSearchParams.get() returns the first value for duplicate keys
      expect(parsed.searchParams.get('tag')).toBe('dev')
    })

    it('parses query with empty values', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb?sslmode=&timeout=30'
      const parsed = new SafeURL(conn)
      expect(parsed.searchParams.get('sslmode')).toBe('')
      expect(parsed.searchParams.get('timeout')).toBe('30')
    })

    it('parses query with keys but no values', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb?debug&verbose=true'
      const parsed = new SafeURL(conn)
      expect(parsed.searchParams.get('debug')).toBe('')
      expect(parsed.searchParams.get('verbose')).toBe('true')
    })
  })

  // RFC 3986 Section 3.5 - Fragment tests
  describe('rFC 3986 Section 3.5 - Fragment', () => {
    it('parses fragment component', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb#section1'
      expect(new SafeURL(conn).hash).toBe('#section1')
    })

    it('parses fragment with percent-encoded characters', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb#section%201'
      expect(new SafeURL(conn).hash).toBe('#section%201')
    })

    it('parses fragment with special characters', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb#section-1_test.anchor'
      expect(new SafeURL(conn).hash).toBe('#section-1_test.anchor')
    })

    it('parses empty fragment', () => {
      const conn = 'postgresql://user:pass@localhost:5432/mydb#'
      expect(new SafeURL(conn).hash).toBe('#')
    })
  })

  // RFC 3986 Section 2.1 - Percent-Encoding tests
  describe('rFC 3986 Section 2.1 - Percent-Encoding', () => {
    it('handles percent-encoded reserved characters', () => {
      // Reserved characters: : / ? # [ ] @
      const conn = 'postgresql://user%3Aname:pass%2Fword@localhost:5432/my%3Fdb?param%23=value%5B%5D'
      const parsed = new SafeURL(conn)

      expect(parsed.username).toBe('user%3Aname')
      expect(parsed.password).toBe('pass%2Fword')
      expect(parsed.pathname).toBe('/my%3Fdb')
      // The current implementation decodes percent-encoded characters
      expect(parsed.searchParams.get('param#')).toBe('value[]')
    })

    it('handles percent-encoded unreserved characters', () => {
      // Unreserved characters that don't need encoding but may be encoded
      const conn = 'postgresql://user%41:pass%42@localhost:5432/my%44b'
      const parsed = new SafeURL(conn)

      expect(parsed.username).toBe('user%41')
      expect(parsed.password).toBe('pass%42')
      expect(parsed.pathname).toBe('/my%44b')
    })

    it('handles mixed encoded and unencoded characters', () => {
      const conn = 'postgresql://user%40domain:my%20pass@localhost:5432/my%20database?ssl=true&option%5F1=value'
      const parsed = new SafeURL(conn)

      expect(parsed.username).toBe('user%40domain')
      expect(parsed.password).toBe('my%20pass')
      expect(parsed.pathname).toBe('/my%20database')
      expect(parsed.searchParams.get('option_1')).toBe('value')
    })
  })

  // RFC 3986 Edge cases and boundary conditions
  describe('rFC 3986 Edge Cases', () => {
    it('parses minimal valid URI', () => {
      const conn = 'db://h'
      expect(new SafeURL(conn)).toMatchObject({
        protocol: 'db:',
        username: '',
        password: '',
        hostname: 'h',
        port: '',
        pathname: '/',
        search: '',
        hash: '',
      })
    })

    it('parses URI with all components', () => {
      const conn = 'postgresql://user:pass@host.example.com:5432/database/path?param1=value1&param2=value2#fragment'
      const parsed = new SafeURL(conn)

      expect(parsed).toMatchObject({
        protocol: 'postgresql:',
        username: 'user',
        password: 'pass',
        hostname: 'host.example.com',
        port: '5432',
        pathname: '/database/path',
        search: '?param1=value1&param2=value2',
        hash: '#fragment',
      })

      expect(Array.from(parsed.searchParams.entries())).toEqual([
        ['param1', 'value1'],
        ['param2', 'value2'],
      ])
    })

    it('handles URI with long components', () => {
      const longUsername = 'a'.repeat(100)
      const longPassword = 'b'.repeat(100)
      const longHostname = `${'c'.repeat(50)}.example.com`
      const longDatabase = 'd'.repeat(100)

      const conn = `postgresql://${longUsername}:${longPassword}@${longHostname}:5432/${longDatabase}`
      const parsed = new SafeURL(conn)

      expect(parsed.username).toBe(longUsername)
      expect(parsed.password).toBe(longPassword)
      expect(parsed.hostname).toBe(longHostname)
      expect(parsed.pathname).toBe(`/${longDatabase}`)
    })

    it('parses URI with Unicode characters (percent-encoded)', () => {
      const conn = 'postgresql://user:pass@localhost:5432/data%C3%A9base?param=%C3%A9value#frag%C3%A9ment'
      const parsed = new SafeURL(conn)

      expect(parsed.pathname).toBe('/data%C3%A9base')
      expect(parsed.searchParams.get('param')).toBe('évalue')
      expect(parsed.hash).toBe('#frag%C3%A9ment')
    })

    it('handles consecutive delimiters', () => {
      const conn = 'postgresql://:@localhost/'
      expect(new SafeURL(conn)).toMatchObject({
        protocol: 'postgresql:',
        username: '',
        password: '',
        hostname: 'localhost',
        port: '',
        pathname: '/',
      })
    })
  })

  // Additional database-specific tests based on RFC 3986
  describe('database Connection String Variations (RFC 3986 compliant)', () => {
    it('parses connection strings with different database types', () => {
      const connections = [
        { url: 'mysql://user:pass@localhost:3306/db', expectedProtocol: 'mysql:' },
        { url: 'mariadb://user:pass@localhost:3306/db', expectedProtocol: 'mariadb:' },
        { url: 'sqlite://./path/to/database.db', expectedProtocol: 'sqlite:' },
        { url: 'mongodb://user:pass@localhost:27017/db', expectedProtocol: 'mongodb:' },
        { url: 'redis://user:pass@localhost:6379/0', expectedProtocol: 'redis:' },
        { url: 'cassandra://user:pass@localhost:9042/keyspace', expectedProtocol: 'cassandra:' },
      ]

      connections.forEach(({ url, expectedProtocol }) => {
        const parsed = new SafeURL(url)
        expect(parsed.protocol).toBe(expectedProtocol)
        expect(parsed.href).toBe(url)
      })
    })

    it('parses connection strings with database-specific query parameters', () => {
      const testCases: { url: string, expectedParams: Record<string, string> }[] = [
        {
          url: 'postgresql://user:pass@localhost:5432/db?sslmode=require&connect_timeout=10&application_name=myapp',
          expectedParams: { sslmode: 'require', connect_timeout: '10', application_name: 'myapp' },
        },
        {
          url: 'mysql://user:pass@localhost:3306/db?charset=utf8mb4&timeout=30s&parseTime=true',
          expectedParams: { charset: 'utf8mb4', timeout: '30s', parseTime: 'true' },
        },
        {
          url: 'mongodb://user:pass@localhost:27017/db?authSource=admin&retryWrites=true&w=majority',
          expectedParams: { authSource: 'admin', retryWrites: 'true', w: 'majority' },
        },
      ]

      testCases.forEach(({ url, expectedParams }) => {
        const parsed = new SafeURL(url)
        expect(Object.fromEntries(parsed.searchParams.entries())).toEqual(expectedParams)
      })
    })
  })
})
