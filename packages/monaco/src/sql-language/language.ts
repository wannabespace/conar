import { ConnectionType } from '@tamery/shared/enums/connection-type'
import type { DialectSpec, TokenizerState } from '@tamery/sql'
import { INITIAL_STATE, tokenize } from '@tamery/sql'
import { languages } from 'monaco-editor'

export const sqlLanguageIds = {
  [ConnectionType.ClickHouse]: 'sql-clickhouse',
  [ConnectionType.MSSQL]: 'sql-mssql',
  [ConnectionType.MySQL]: 'sql-mysql',
  [ConnectionType.Postgres]: 'sql-postgres',
} satisfies Record<ConnectionType, string>

// Theme rule names in editor.tsx.
const SCOPES = {
  comment: 'comment',
  function: 'predefined',
  identifier: 'identifier',
  keyword: 'keyword',
  number: 'number',
  operator: 'operator',
  punctuation: 'delimiter',
  string: 'string',
  type: 'type',
  variable: 'variable',
} as const

class LineState implements languages.IState {
  readonly state: TokenizerState

  constructor(state: TokenizerState) {
    this.state = state
  }

  clone() {
    return new LineState(this.state)
  }

  equals(other: languages.IState) {
    return (
      other instanceof LineState &&
      JSON.stringify(other.state) === JSON.stringify(this.state)
    )
  }
}

export const registerLanguage = (id: string, dialect: DialectSpec) => {
  languages.register({ id })

  const configuration = languages.setLanguageConfiguration(id, {
    autoClosingPairs: [
      { close: ')', open: '(' },
      { close: ']', open: '[' },
      { close: "'", notIn: ['string', 'comment'], open: "'" },
      { close: '"', notIn: ['string', 'comment'], open: '"' },
      { close: '`', notIn: ['string', 'comment'], open: '`' },
    ],
    brackets: [
      ['(', ')'],
      ['[', ']'],
    ],
    comments: { blockComment: ['/*', '*/'], lineComment: '--' },
    surroundingPairs: [
      { close: ')', open: '(' },
      { close: "'", open: "'" },
      { close: '"', open: '"' },
    ],
  })

  const tokensProvider = languages.setTokensProvider(id, {
    getInitialState: () => new LineState(INITIAL_STATE),
    tokenize: (line, lineState) => {
      const { state, tokens } = tokenize(
        line,
        dialect,
        lineState instanceof LineState ? lineState.state : INITIAL_STATE
      )
      return {
        endState: new LineState(state),
        tokens: tokens.map((token) => ({
          scopes: SCOPES[token.kind],
          startIndex: token.start,
        })),
      }
    },
  })

  return [configuration, tokensProvider]
}
