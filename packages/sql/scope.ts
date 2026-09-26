import type { Token } from './tokenizer'
import { identifierName, isKeyword, isPunctuation } from './tokenizer'

export interface TableRef {
  schema: string | null
  name: string
  alias: string | null
  token: Token
}

export interface StatementScope {
  tables: TableRef[]
  ctes: string[]
  /** Names given after a closing paren — subquery aliases, and harmlessly column aliases too. */
  derived: string[]
  opaque: boolean
}

export const TABLE_INTRODUCERS = ['FROM', 'JOIN', 'INTO', 'UPDATE', 'TABLE']
const TABLE_MODIFIERS = ['ONLY', 'LATERAL', 'IGNORE', 'IF', 'NOT', 'EXISTS']

const readQualifiedName = (tokens: Token[], from: number) => {
  const parts: Token[] = []
  let index = from
  for (
    let token = tokens[index];
    token?.kind === 'identifier';
    token = tokens[index]
  ) {
    parts.push(token)
    if (!isPunctuation(tokens[index + 1], '.')) {
      break
    }
    index += 2
  }
  return { next: from + parts.length * 2 - 1, parts }
}

const tableRefAt = (
  tokens: Token[],
  from: number,
  // In FROM/JOIN a name followed by `(` is a function; after INTO it is a column list.
  parenIsCall: boolean
): { ref: TableRef; next: number } | null => {
  const { next, parts } = readQualifiedName(tokens, from)
  const nameToken = parts.at(-1)
  if (!nameToken || (parenIsCall && isPunctuation(tokens[next], '('))) {
    return null
  }
  const schemaToken = parts.at(-2)
  let after = next
  let alias: string | null = null
  if (isKeyword(tokens[after], 'AS')) {
    after += 1
  }
  const aliasToken = tokens[after]
  if (aliasToken?.kind === 'identifier') {
    alias = identifierName(aliasToken)
    after += 1
  }
  return {
    next: after,
    ref: {
      alias,
      name: identifierName(nameToken),
      schema: schemaToken ? identifierName(schemaToken) : null,
      token: nameToken,
    },
  }
}

const derivedAlias = (tokens: Token[], index: number) => {
  const alias = isKeyword(tokens[index + 1], 'AS')
    ? tokens[index + 2]
    : tokens[index + 1]
  return alias?.kind === 'identifier' ? identifierName(alias) : null
}

const isCteName = (tokens: Token[], index: number) => {
  if (
    tokens[index]?.kind !== 'identifier' ||
    !['WITH', 'RECURSIVE', ','].includes(
      tokens[index - 1]?.text.toUpperCase() ?? ''
    )
  ) {
    return false
  }
  let cursor = index + 1
  if (isPunctuation(tokens[cursor], '(')) {
    while (tokens[cursor] && !isPunctuation(tokens[cursor], ')')) {
      cursor += 1
    }
    cursor += 1
  }
  if (!isKeyword(tokens[cursor], 'AS')) {
    return false
  }
  cursor += 1
  while (isKeyword(tokens[cursor], 'NOT', 'MATERIALIZED')) {
    cursor += 1
  }
  return isPunctuation(tokens[cursor], '(')
}

// The table a CREATE names is new, and `FOR UPDATE`/`ON DUPLICATE KEY UPDATE` start no UPDATE.
const introducesTable = (tokens: Token[], index: number) => {
  const previous = tokens[index - 1]?.text.toUpperCase() ?? ''
  if (isKeyword(tokens[index], 'TABLE')) {
    return !['CREATE', 'TEMP', 'TEMPORARY', 'UNLOGGED'].includes(previous)
  }
  if (isKeyword(tokens[index], 'UPDATE')) {
    return previous !== 'FOR' && previous !== 'KEY'
  }
  return isKeyword(tokens[index], ...TABLE_INTRODUCERS)
}

const sourcesAfter = (tokens: Token[], index: number) => {
  const introducer = tokens[index]
  const clause = isKeyword(introducer, 'FROM', 'JOIN')
  const refs: TableRef[] = []
  let cursor = index + 1
  while (isKeyword(tokens[cursor], ...TABLE_MODIFIERS)) {
    cursor += 1
  }
  for (;;) {
    const found = tableRefAt(tokens, cursor, clause)
    if (!found) {
      const opaque =
        clause &&
        (isPunctuation(tokens[cursor], '(') ||
          isPunctuation(tokens[cursor + 1], '('))
      return { opaque, refs }
    }
    refs.push(found.ref)
    if (
      !(isKeyword(introducer, 'FROM') && isPunctuation(tokens[found.next], ','))
    ) {
      return { opaque: false, refs }
    }
    cursor = found.next + 1
  }
}

export const statementScope = (tokens: Token[]): StatementScope => {
  const tables: TableRef[] = []
  const ctes: string[] = []
  const derived: string[] = []
  let opaque = false
  // One entry per open paren: whether it is a call's argument list, where `FROM` is not a table
  // clause (`EXTRACT(YEAR FROM ts)`, `SUBSTRING(s FROM 1)`).
  const parens: boolean[] = []

  for (const [index, token] of tokens.entries()) {
    if (isPunctuation(token, '(')) {
      parens.push(
        ['function', 'identifier', 'type'].includes(
          tokens[index - 1]?.kind ?? ''
        )
      )
    } else if (isPunctuation(token, ')')) {
      parens.pop()
      const alias = derivedAlias(tokens, index)
      if (alias) {
        derived.push(alias)
      }
    } else if (isCteName(tokens, index)) {
      ctes.push(identifierName(token))
    } else if (introducesTable(tokens, index) && parens.at(-1) !== true) {
      const sources = sourcesAfter(tokens, index)
      tables.push(...sources.refs)
      opaque ||= sources.opaque
    }
  }

  return { ctes, derived, opaque, tables }
}
