import { describe, expect, it } from 'bun:test'

import { ConnectionType } from '@tamery/shared/enums/connection-type'

import { dialects } from './dialect'
import { tokenize } from './tokenizer'

const pg = dialects[ConnectionType.Postgres]
const mysql = dialects[ConnectionType.MySQL]
const kinds = (sql: string, dialect = pg) =>
  tokenize(sql, dialect).tokens.map((token) => `${token.kind}:${token.text}`)

describe('tokenize', () => {
  it('classifies words, literals and operators', () => {
    expect(
      kinds('SELECT count(*) AS n, "Col" FROM t WHERE a->>\'k\' = 1.5e3')
    ).toEqual([
      'keyword:SELECT',
      'function:count',
      'punctuation:(',
      'operator:*',
      'punctuation:)',
      'keyword:AS',
      'identifier:n',
      'punctuation:,',
      'identifier:"Col"',
      'keyword:FROM',
      'identifier:t',
      'keyword:WHERE',
      'identifier:a',
      'operator:->>',
      "string:'k'",
      'operator:=',
      'number:1.5e3',
    ])
  })

  it('follows dialect quoting', () => {
    expect(kinds('SELECT `a`, "b", @v, # c', mysql)).toEqual([
      'keyword:SELECT',
      'identifier:`a`',
      'punctuation:,',
      'string:"b"',
      'punctuation:,',
      'variable:@v',
      'punctuation:,',
      'comment:# c',
    ])
    expect(kinds('[dbo].[Users]', dialects[ConnectionType.MSSQL])).toEqual([
      'identifier:[dbo]',
      'punctuation:.',
      'identifier:[Users]',
    ])
    expect(kinds("$$ a; 'b $$ || $q$x$q$ || 'it''s' || $1")).toEqual([
      "string:$$ a; 'b $$",
      'operator:||',
      'string:$q$x$q$',
      'operator:||',
      "string:'it''s'",
      'operator:||',
      'variable:$1',
    ])
  })

  it('resumes across chunks and flags unclosed constructs', () => {
    const first = tokenize("SELECT '", pg)
    expect(first.tokens.at(-1)?.unclosed).toBe(true)
    expect(first.state.kind).toBe('string')
    const second = tokenize("still' FROM t", pg, first.state)
    expect(second.tokens.map((token) => token.kind)).toEqual([
      'string',
      'keyword',
      'identifier',
    ])
    expect(second.state.kind).toBe('none')
    expect(tokenize('/* open', pg).state.kind).toBe('comment')
  })
})
