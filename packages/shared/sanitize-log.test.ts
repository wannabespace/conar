import { describe, expect, it } from 'bun:test'

import { sanitizeLogData } from './sanitize-log'

const logged = (data: unknown) => JSON.stringify(sanitizeLogData(data))

describe('sanitizeLogData', () => {
  it('redacts the input a failed validation carries inside its error', () => {
    const cause = Object.assign(new Error('Input validation failed'), {
      invalidData: {
        connectionString: 'postgres://u:hunter2@h/db',
        password: 'pin1',
      },
    })
    const text = logged({ error: { cause } })
    expect(text).toContain('Input validation failed')
    expect(text).not.toContain('hunter2')
    expect(text).not.toContain('pin1')
  })

  it('redacts credentials inside free text', () => {
    const text = logged({
      input: {
        messages: [
          {
            text: 'connect to postgres://admin:s3cr%2Ft@db.example.com:5432/app',
          },
        ],
        sql: "CREATE USER MAPPING FOR me SERVER s OPTIONS (password 'x'); -- Server=h;User Id=sa;Password=Pa55;",
        url: 'libsql://db.turso.io?authToken=eyJtoken&tls=1',
      },
    })
    expect(text).not.toContain('s3cr')
    expect(text).not.toContain('Pa55')
    expect(text).not.toContain('eyJtoken')
    expect(text).toContain('db.example.com')
  })
})
