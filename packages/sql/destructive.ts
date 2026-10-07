import type { DialectSpec } from './dialect'
import type { Statement } from './statements'
import { splitStatements } from './statements'
import { isKeyword } from './tokenizer'

// EXPLAIN only plans the statement; EXPLAIN ANALYZE runs it.
const isPlanOnlyExplain = ({ tokens }: Statement) =>
  isKeyword(tokens[0], 'EXPLAIN') &&
  !tokens.some((token) => token.text.toUpperCase() === 'ANALYZE')

/** `FOR [NO KEY] UPDATE` locks rows, `ON DELETE`/`ON UPDATE` names a referential action. */
const locksOrReferences = (words: string[], index: number) =>
  words[index - 1] === 'FOR' ||
  words[index - 1] === 'ON' ||
  (words[index - 3] === 'FOR' && words[index - 2] === 'NO')

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
              !locksOrReferences(words, index))
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

const runsAny =
  (keywords: Set<string>) => (text: string, dialect: DialectSpec) =>
    splitStatements(text, dialect).some((statement) => {
      if (isPlanOnlyExplain(statement)) {
        return false
      }
      const words = statement.tokens.map((token) => token.text.toUpperCase())
      return statement.tokens.some(
        (token, index) =>
          (index === 0 && DYNAMIC_SQL_COMMANDS.has(words[index] ?? '')) ||
          ((token.kind === 'keyword' || index === 0) &&
            keywords.has(words[index] ?? '') &&
            !locksOrReferences(words, index))
      )
    })

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

// SELECT … INTO writes a table or a server file, and SQL Server runs a second statement that has no `;` before it.
const WRITES_INSIDE_READ = new Set([
  'CALL',
  'COMMIT',
  'EXEC',
  'EXECUTE',
  'INTO',
  'KILL',
  'SHUTDOWN',
])

/** A single statement that only reads, the only kind an MCP agent may run. */
export const readsOnly = (text: string, dialect: DialectSpec) => {
  const [statement, ...rest] = splitStatements(text, dialect)
  return (
    !!statement &&
    rest.length === 0 &&
    READ_COMMANDS.has(statement.tokens[0]?.text.toUpperCase() ?? '') &&
    !statement.tokens.some(
      (token) =>
        !token.quoted &&
        token.kind !== 'string' &&
        WRITES_INSIDE_READ.has(token.text.toUpperCase())
    ) &&
    !writesData(text, dialect) &&
    !invalidatesCatalog(text, dialect)
  )
}
