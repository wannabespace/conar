import { describe, expect, test } from 'bun:test'

import { describeConnectionString } from './utils'

const resourceOf = (connectionString: string) =>
  describeConnectionString(connectionString).defaultResourceName

describe('describeConnectionString', () => {
  test('names the database a server opens when the string names none', () => {
    expect(resourceOf('postgresql://qa:pw@localhost:5432')).toBe('qa')
    expect(resourceOf('postgresql://qa:pw@localhost:5432/shop')).toBe('shop')
    expect(resourceOf('https://default:pw@ch.example.com:8443')).toBe('default')
    expect(resourceOf('sqlserver://sa:pw@localhost:1433')).toBeNull()
    expect(resourceOf('mysql://root:pw@localhost:3306')).toBeNull()
  })
})
