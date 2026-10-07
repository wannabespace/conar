import type { DialectSpec } from './dialect'
import type { Statement } from './statements'
import { splitStatements } from './statements'
import type { Token } from './tokenizer'
import { isKeyword } from './tokenizer'

// EXPLAIN only plans the statement; EXPLAIN ANALYZE runs it.
const isPlanOnlyExplain = ({ tokens }: Statement) =>
  isKeyword(tokens[0], 'EXPLAIN') &&
  !tokens.some((token) => token.text.toUpperCase() === 'ANALYZE')

/** `FOR [NO KEY] UPDATE` locks rows, `ON DELETE`/`ON UPDATE` names a referential action, `SHOW CREATE` prints a definition. */
const namesWithoutRunning = (words: string[], index: number) =>
  words[index - 1] === 'FOR' ||
  words[index - 1] === 'ON' ||
  (words[index - 3] === 'FOR' && words[index - 2] === 'NO') ||
  (index === 1 && words[0] === 'SHOW')

const DESTRUCTIVE = new Set([
  'ALTER',
  'DELETE',
  'DROP',
  'MERGE',
  'RENAME',
  'REPLACE',
  'TRUNCATE',
  'UPDATE',
])

// A body the tokenizer sees as one string (`DO $$ … $$`, `EXEC 'DROP …'`) or a procedure could drop anything.
const DYNAMIC_SQL_COMMANDS = new Set(['CALL', 'DO', 'EXEC', 'EXECUTE'])

/**
 * Additive writes (INSERT, CREATE) are left out on purpose. A first word counts whatever it tokenized
 * as: MySQL's `REPLACE INTO` and `MERGE` are not keywords in every dialect's list.
 */
export const destructiveKeywords = (text: string, dialect: DialectSpec) => [
  ...new Set(
    splitStatements(text, dialect)
      .filter((statement) => !isPlanOnlyExplain(statement))
      .flatMap(({ tokens }) => {
        const words = tokens.map((token) => token.text.toUpperCase())
        if (words[0] === 'GRANT' || words[0] === 'REVOKE') {
          return []
        }
        return words.filter(
          (word, index) =>
            (index === 0 && DYNAMIC_SQL_COMMANDS.has(word)) ||
            ((tokens[index]?.kind === 'keyword' || index === 0) &&
              DESTRUCTIVE.has(word) &&
              !namesWithoutRunning(words, index))
        )
      })
  ),
]

const DDL_KEYWORDS = new Set(['ALTER', 'CREATE', 'DROP', 'RENAME', 'TRUNCATE'])

const DATA_WRITE_KEYWORDS = new Set([
  'COPY',
  'DELETE',
  'INSERT',
  'MERGE',
  'REPLACE',
  'TRUNCATE',
  'UPDATE',
])

// Most commands are not keywords in any dialect's list, so a bare word counts too.
const isWord = (token: Token) =>
  !token.quoted && (token.kind === 'keyword' || token.kind === 'identifier')

const statementRunsAny =
  (keywords: Set<string>) =>
  (statement: Statement): boolean => {
    if (isPlanOnlyExplain(statement)) {
      return false
    }
    const words = statement.tokens.map((token) => token.text.toUpperCase())
    return statement.tokens.some(
      (token, index) =>
        (index === 0 && DYNAMIC_SQL_COMMANDS.has(words[index] ?? '')) ||
        (isWord(token) &&
          keywords.has(words[index] ?? '') &&
          !namesWithoutRunning(words, index))
    )
  }

const runsAny = (keywords: Set<string>) => {
  const runs = statementRunsAny(keywords)
  return (text: string, dialect: DialectSpec) =>
    splitStatements(text, dialect).some(runs)
}

export const invalidatesCatalog = runsAny(DDL_KEYWORDS)

/** Whether a run may have changed rows; dynamic SQL counts, since a procedure can write anything. */
export const writesData = runsAny(DATA_WRITE_KEYWORDS)

const READ_COMMANDS = new Set([
  'DESC',
  'DESCRIBE',
  'EXPLAIN',
  'SELECT',
  'SHOW',
  'TABLE',
  'VALUES',
  'WITH',
])

// SELECT … INTO writes a table or a server file. SQL Server runs a later statement with no `;` before it, and its ROLLBACK ends the transaction that would undo the rest.
const writesInsideRead = statementRunsAny(
  new Set([
    ...DDL_KEYWORDS,
    ...DATA_WRITE_KEYWORDS,
    ...DYNAMIC_SQL_COMMANDS,
    'BACKUP',
    'COMMIT',
    'DBCC',
    'DENY',
    'GRANT',
    'INTO',
    'KILL',
    'RECONFIGURE',
    'RESTORE',
    'REVOKE',
    'ROLLBACK',
    'SHUTDOWN',
  ])
)

/** A single statement that only reads, the only kind an MCP agent may run. */
export const readsOnly = (text: string, dialect: DialectSpec) => {
  const [statement, ...rest] = splitStatements(text, dialect)
  return (
    !!statement &&
    rest.length === 0 &&
    READ_COMMANDS.has(statement.tokens[0]?.text.toUpperCase() ?? '') &&
    !writesInsideRead(statement)
  )
}
