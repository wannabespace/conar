import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { dialects } from './dialect'
import { needsLeadingSpace, withinStatement } from './ghost-text'

const pg = dialects[ConnectionType.Postgres]

describe('needsLeadingSpace', () => {
  it('separates a keyword the model glued onto a finished word', () => {
    expect(
      needsLeadingSpace('select * from accounts', 'where id = 1', false, pg)
    ).toBe(true)
  })

  it('leaves word completions alone', () => {
    expect(needsLeadingSpace('sel', 'ect * from users', false, pg)).toBe(false)
    expect(needsLeadingSpace('insert in', 'to users', false, pg)).toBe(false)
    expect(
      needsLeadingSpace('select * from accounts ', 'where', false, pg)
    ).toBe(false)
  })

  it('always separates after a completion pick', () => {
    expect(needsLeadingSpace('select * from users', 'u', true, pg)).toBe(true)
  })
})

describe('withinStatement', () => {
  it('stops at the end of the statement at the caret', () => {
    expect(
      withinStatement(
        'select * from users; select * from ',
        'accounts; select * from members;',
        pg
      )
    ).toBe('accounts;')
  })

  it('keeps a reply that never ends the statement', () => {
    expect(withinStatement('select * from ', 'users where id = 1', pg)).toBe(
      'users where id = 1'
    )
  })

  it('ignores a semicolon inside a string', () => {
    expect(withinStatement("select ';", "' as a; select 1;", pg)).toBe(
      "' as a;"
    )
  })
})
