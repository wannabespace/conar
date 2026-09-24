import type { SqlCatalog } from './catalog'
import { findColumn, findSchema, findTable } from './catalog'
import type { DialectSpec } from './dialect'
import type { StatementScope } from './scope'
import { statementScope, TABLE_INTRODUCERS } from './scope'
import type { Statement } from './statements'
import { parseStatements } from './statements'
import type { Token } from './tokenizer'
import { identifierName, isKeyword, isPunctuation, tokenize } from './tokenizer'

interface Diagnostic {
  start: number
  end: number
  message: string
  severity: 'error' | 'warning'
}

const STATEMENT_STARTERS = new Set([
  '(',
  'ALTER',
  'ANALYZE',
  'ATTACH',
  'BEGIN',
  'CALL',
  'CHECK',
  'CLUSTER',
  'COMMENT',
  'COMMIT',
  'COPY',
  'CREATE',
  'DEALLOCATE',
  'DECLARE',
  'DELETE',
  'DESC',
  'DESCRIBE',
  'DETACH',
  'DISCARD',
  'DO',
  'DROP',
  'END',
  'EXEC',
  'EXECUTE',
  'EXPLAIN',
  'GRANT',
  'IF',
  'INSERT',
  'KILL',
  'LISTEN',
  'LOAD',
  'LOCK',
  'MERGE',
  'NOTIFY',
  'OPTIMIZE',
  'PREPARE',
  'PRINT',
  'RAISERROR',
  'REFRESH',
  'REINDEX',
  'RELEASE',
  'RENAME',
  'REPLACE',
  'RESET',
  'REVOKE',
  'ROLLBACK',
  'SAVEPOINT',
  'SELECT',
  'SET',
  'SHOW',
  'START',
  'SYSTEM',
  'TABLE',
  'THROW',
  'TRUNCATE',
  'UNLOCK',
  'UPDATE',
  'USE',
  'VACUUM',
  'VALUES',
  'WAITFOR',
  'WHILE',
  'WITH',
])

const CLOSE_TO_OPEN: Record<string, string> = { ')': '(', ']': '[', '}': '{' }

const spanOf = ({ start, end }: Token) => ({ end, start })

const UNCLOSED_MESSAGES: Partial<Record<Token['kind'], string>> = {
  comment: 'Unterminated block comment',
  identifier: 'Unterminated quoted identifier',
  string: 'Unterminated string',
}

const unclosedDiagnostics = (tokens: Token[]): Diagnostic[] =>
  tokens
    .filter((token) => token.unclosed)
    .map((token) => ({
      ...spanOf(token),
      message: UNCLOSED_MESSAGES[token.kind] ?? 'Unterminated token',
      severity: 'error',
    }))

const bracketDiagnostics = (statement: Statement): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []
  const open: Token[] = []
  for (const token of statement.tokens) {
    if (token.kind !== 'punctuation') {
      continue
    }
    if (Object.values(CLOSE_TO_OPEN).includes(token.text)) {
      open.push(token)
    } else if (token.text in CLOSE_TO_OPEN) {
      const last = open.at(-1)
      if (last && last.text === CLOSE_TO_OPEN[token.text]) {
        open.pop()
      } else {
        diagnostics.push({
          ...spanOf(token),
          message: `Unexpected \`${token.text}\``,
          severity: 'error',
        })
      }
    }
  }
  for (const token of open) {
    diagnostics.push({
      ...spanOf(token),
      message: `Unclosed \`${token.text}\``,
      severity: 'error',
    })
  }
  return diagnostics
}

const starterDiagnostics = (statement: Statement): Diagnostic[] => {
  const [first] = statement.tokens
  if (
    !first ||
    first.kind !== 'identifier' ||
    first.quoted ||
    STATEMENT_STARTERS.has(first.text.toUpperCase())
  ) {
    return []
  }
  return [
    {
      ...spanOf(first),
      message: `Unknown statement \`${first.text}\``,
      severity: 'error',
    },
  ]
}

// Row pseudo-tables: ON CONFLICT (`excluded`), OUTPUT (`inserted`/`deleted`), triggers (`new`/`old`).
const PSEUDO_TABLES = new Set(['excluded', 'inserted', 'deleted', 'new', 'old'])
// Only these read qualifiers against a FROM list; DDL qualifies by schema.
const QUERY_VERBS = ['SELECT', 'WITH', 'UPDATE', 'DELETE', 'INSERT']

const isKnownQualifier = (
  scope: StatementScope,
  catalog: SqlCatalog,
  qualifier: string
) =>
  PSEUDO_TABLES.has(qualifier.toLowerCase()) ||
  findSchema(catalog, qualifier) !== undefined ||
  scope.tables.some(
    (table) =>
      table.alias?.toLowerCase() === qualifier.toLowerCase() ||
      table.name.toLowerCase() === qualifier.toLowerCase()
  ) ||
  [...scope.ctes, ...scope.derived].some(
    (name) => name.toLowerCase() === qualifier.toLowerCase()
  )

const unknownQualifier = (
  qualifier: Token,
  scope: StatementScope
): Diagnostic => {
  const available = [
    ...scope.tables.map((table) => table.alias ?? table.name),
    ...scope.ctes,
    ...scope.derived,
  ].map((name) => `\`${name}\``)
  return {
    ...spanOf(qualifier),
    message: `\`${identifierName(qualifier)}\` is not a table or alias in this statement${
      available.length > 0 ? ` — available: ${available.join(', ')}` : ''
    }`,
    severity: 'warning',
  }
}

const resolveQualifier = (
  scope: StatementScope,
  catalog: SqlCatalog,
  qualifier: string
) => {
  const ref = scope.tables.find(
    (table) =>
      table.alias?.toLowerCase() === qualifier.toLowerCase() ||
      (!table.alias && table.name.toLowerCase() === qualifier.toLowerCase())
  )
  return ref ? findTable(catalog, ref.name, ref.schema) : undefined
}

const qualifiedColumnDiagnostics = (
  tokens: Token[],
  scope: StatementScope,
  catalog: SqlCatalog
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = []
  const refTokens = new Set(scope.tables.map((table) => table.token))
  const checksQualifiers = isKeyword(tokens[0], ...QUERY_VERBS)
  for (const [index, token] of tokens.entries()) {
    const qualifier = tokens[index - 2]
    if (
      token.kind !== 'identifier' ||
      !isPunctuation(tokens[index - 1], '.') ||
      qualifier?.kind !== 'identifier' ||
      isPunctuation(tokens[index - 3], '.') ||
      isPunctuation(tokens[index + 1], '(') ||
      refTokens.has(token)
    ) {
      continue
    }
    const qualifierName = identifierName(qualifier)
    if (
      checksQualifiers &&
      tokens[index - 3]?.text !== '::' &&
      !isKnownQualifier(scope, catalog, qualifierName)
    ) {
      diagnostics.push(unknownQualifier(qualifier, scope))
      continue
    }
    const table = resolveQualifier(scope, catalog, qualifierName)
    if (!table?.columns || findColumn(table, identifierName(token))) {
      continue
    }
    diagnostics.push({
      ...spanOf(token),
      message: `Unknown column \`${identifierName(token)}\` on \`${table.name}\``,
      severity: 'warning',
    })
  }

  return diagnostics
}

const FUNCTION_ARGUMENT_WORDS = new Set([
  'at',
  'both',
  'day',
  'dow',
  'doy',
  'epoch',
  'for',
  'hour',
  'leading',
  'minute',
  'month',
  'quarter',
  'second',
  'trailing',
  'week',
  'year',
  'zone',
])

const unqualifiedColumnDiagnostics = (
  tokens: Token[],
  scope: StatementScope,
  catalog: SqlCatalog
): Diagnostic[] => {
  const tables = scope.tables.map((ref) =>
    findTable(catalog, ref.name, ref.schema)
  )
  if (
    !isKeyword(tokens[0], ...QUERY_VERBS) ||
    scope.opaque ||
    scope.ctes.length > 0 ||
    tables.length === 0 ||
    tables.some((table) => !table?.columns)
  ) {
    return []
  }
  const refTokens = new Set(scope.tables.map((ref) => ref.token))
  const known = new Set(
    [
      ...scope.tables.flatMap((ref) => (ref.alias ? [ref.alias] : [])),
      ...scope.derived,
      ...tokens.flatMap((token, index) =>
        isKeyword(tokens[index - 1], 'AS') && token.kind === 'identifier'
          ? [identifierName(token)]
          : []
      ),
      ...tables.flatMap((table) =>
        (table?.columns ?? []).map((column) => column.name)
      ),
    ].map((name) => name.toLowerCase())
  )
  const names = tables.flatMap((table) => (table ? [`\`${table.name}\``] : []))

  return tokens.flatMap((token, index): Diagnostic[] => {
    const name = identifierName(token).toLowerCase()
    const previous = tokens[index - 1]
    const next = tokens[index + 1]
    if (
      token.kind !== 'identifier' ||
      refTokens.has(token) ||
      known.has(name) ||
      FUNCTION_ARGUMENT_WORDS.has(name) ||
      isPunctuation(previous, '.') ||
      isPunctuation(next, '.') ||
      isPunctuation(next, '(') ||
      previous?.text === '::' ||
      isKeyword(previous, 'AS', ...TABLE_INTRODUCERS)
    ) {
      return []
    }
    return [
      {
        ...spanOf(token),
        message: `Unknown column \`${identifierName(token)}\` — not in ${names.join(', ')}`,
        severity: 'warning',
      },
    ]
  })
}

const LOCK_STRENGTHS = new Set(['KEY', 'NO', 'SHARE', 'UPDATE'])

const withoutLockingClauses = (tokens: Token[]) => {
  let locking = false
  return tokens.filter((token, index) => {
    if (isPunctuation(token, ')') || isPunctuation(token, ';')) {
      locking = false
    } else if (
      token.text.toUpperCase() === 'FOR' &&
      LOCK_STRENGTHS.has(tokens[index + 1]?.text.toUpperCase() ?? '')
    ) {
      locking = true
    }
    return !locking
  })
}

const catalogDiagnostics = (
  statement: Statement,
  catalog: SqlCatalog
): Diagnostic[] => {
  const tokens = withoutLockingClauses(statement.tokens)
  const scope = statementScope(tokens)
  const ctes = new Set(scope.ctes.map((name) => name.toLowerCase()))
  return [
    ...scope.tables
      .filter(
        (ref) =>
          !(ctes.has(ref.name.toLowerCase()) && !ref.schema) &&
          !findTable(catalog, ref.name, ref.schema)
      )
      .map((ref): Diagnostic => ({
        ...spanOf(ref.token),
        message: `Unknown table \`${ref.schema ? `${ref.schema}.` : ''}${ref.name}\``,
        severity: 'warning',
      })),
    ...qualifiedColumnDiagnostics(tokens, scope, catalog),
    ...unqualifiedColumnDiagnostics(tokens, scope, catalog),
  ]
}

export const diagnose = (
  text: string,
  dialect: DialectSpec,
  catalog: SqlCatalog | null
): Diagnostic[] => {
  const { tokens } = tokenize(text, dialect)
  const statements = parseStatements(text, tokens, dialect)
  return [
    ...unclosedDiagnostics(tokens),
    ...statements.flatMap((statement) => [
      ...bracketDiagnostics(statement),
      ...starterDiagnostics(statement),
      ...(catalog && catalog.schemas.length > 0
        ? catalogDiagnostics(statement, catalog)
        : []),
    ]),
  ].toSorted((a, b) => a.start - b.start)
}
