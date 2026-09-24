import type { DialectSpec } from './dialect'
import type { Token } from './tokenizer'
import { isKeyword, isPunctuation, tokenize } from './tokenizer'

export interface Statement {
  /** Source slice from the first token to the last, terminator excluded, inner comments kept. */
  text: string
  start: number
  end: number
  /** End of the terminating `;`, which may sit on a later line; `end` when there is none. */
  terminatorEnd: number
  /** Non-comment tokens, terminator excluded. */
  tokens: Token[]
}

// Matched by text: most are not keywords in any dialect's list.
const TRANSACTION_OPENERS = new Set([
  ';',
  'DEFERRABLE',
  'DISTRIBUTED',
  'ISOLATION',
  'READ',
  'TRAN',
  'TRANSACTION',
  'WORK',
])
const WHOLE_STATEMENT_ENDINGS = new Set([undefined, 'TRANSACTION', 'WORK'])
// `END IF` / `END LOOP` close constructs that never opened a depth level.
const END_QUALIFIERS = ['IF', 'LOOP', 'WHILE', 'REPEAT']

const onOwnLine = (text: string, token: Token, previous: Token | undefined) => {
  const before = text.slice(previous?.end ?? 0, token.start)
  const after = text.slice(
    token.end,
    text.indexOf('\n', token.end) + 1 || text.length
  )
  return (
    (previous === undefined || before.includes('\n')) && after.trim() === ''
  )
}

const upperTexts = (tokens: Token[]) =>
  tokens.map((token) => token.text.toUpperCase())

const opensTransactionAt = (tokens: Token[], index: number) => {
  const [word, next, after] = upperTexts(tokens.slice(index, index + 3))
  if (word === 'START') {
    return next === 'TRANSACTION'
  }
  // MariaDB's `BEGIN NOT ATOMIC` opens a block, Postgres' `BEGIN NOT DEFERRABLE` a transaction.
  if (next === 'NOT') {
    return word === 'BEGIN' && after === 'DEFERRABLE'
  }
  return (
    word === 'BEGIN' && (next === undefined || TRANSACTION_OPENERS.has(next))
  )
}

// `ROLLBACK TO` a savepoint closes nothing; Postgres' `END` and `ABORT` close only as a whole statement.
const transactionEnd = (tokens: Token[]) => {
  const words = upperTexts(tokens.slice(0, 3))
  const [word, next, after] = words
  if (word === 'COMMIT' || (word === 'ROLLBACK' && !words.includes('TO'))) {
    return word
  }
  if (
    (word === 'END' || word === 'ABORT') &&
    after === undefined &&
    WHOLE_STATEMENT_ENDINGS.has(next)
  ) {
    return word
  }
}

export const leavesTransactionOpen = (text: string, dialect: DialectSpec) => {
  const tokens = tokenize(text, dialect).tokens.filter(
    (token) => token.kind !== 'comment'
  )
  return (
    opensTransactionAt(tokens, 0) &&
    !tokens.some((_, index) => transactionEnd(tokens.slice(index)))
  )
}

export const parseStatements = (
  text: string,
  tokens: Token[],
  dialect: DialectSpec,
  { groupTransactions = true }: { groupTransactions?: boolean } = {}
): Statement[] => {
  const statements: Statement[] = []
  const significant = tokens.filter((token) => token.kind !== 'comment')
  const groups = groupTransactions && dialect.transactions
  let current: Token[] = []
  // Only a `;` at depth 0 starts an inner statement: a block's own `;` would make its `END` read as a closer.
  let innerStart = 0
  let depth = 0
  let inTransaction = false

  const flush = (terminator?: Token) => {
    const [first] = current
    const last = current.at(-1)
    if (inTransaction && !transactionEnd(current.slice(innerStart))) {
      statements.push(
        ...parseStatements(text, current, dialect, { groupTransactions: false })
      )
    } else if (first && last) {
      statements.push({
        end: last.end,
        start: first.start,
        terminatorEnd: terminator?.end ?? last.end,
        text: text.slice(first.start, last.end),
        tokens: current,
      })
    }
    current = []
    innerStart = 0
    depth = 0
    inTransaction = false
  }

  for (const [index, token] of significant.entries()) {
    const next = significant[index + 1]

    if (
      dialect.goBatches &&
      isKeyword(token, 'GO') &&
      onOwnLine(text, token, significant[index - 1])
    ) {
      flush()
      continue
    }

    if (opensTransactionAt(significant, index)) {
      inTransaction = groups
    } else if (isKeyword(token, 'BEGIN', 'CASE')) {
      depth += 1
    } else if (isKeyword(token, 'END') && !isKeyword(next, ...END_QUALIFIERS)) {
      depth = Math.max(0, depth - 1)
    }

    if (isPunctuation(token, ';') && depth === 0) {
      if (!inTransaction || transactionEnd(current.slice(innerStart))) {
        flush(token)
        continue
      }
      innerStart = current.length + 1
    }

    current.push(token)
  }

  flush()
  return statements
}

export const splitStatements = (
  text: string,
  dialect: DialectSpec,
  options?: { groupTransactions?: boolean }
) => parseStatements(text, tokenize(text, dialect).tokens, dialect, options)

// Drivers without multi-statement support reject a `BEGIN … COMMIT` group sent as one string.
export const transactionParts = (text: string, dialect: DialectSpec) => {
  if (!dialect.transactions) {
    return null
  }
  const parts = splitStatements(text, dialect, { groupTransactions: false })
  const [first] = parts
  const ending = transactionEnd(parts.at(-1)?.tokens ?? [])
  if (!(first && ending && opensTransactionAt(first.tokens, 0))) {
    return null
  }
  return {
    commit: ending === 'COMMIT' || ending === 'END',
    statements: parts.slice(1, -1).map((part) => part.text),
  }
}

/** The statement under the caret — its terminator and the rest of that line count. A caret on a line of its own belongs to none. */
export const statementAt = (
  statements: Statement[],
  offset: number,
  text: string
) =>
  statements.findLast(
    ({ start, terminatorEnd }) =>
      offset >= start &&
      (offset <= terminatorEnd ||
        !text.slice(terminatorEnd, offset).includes('\n'))
  )
