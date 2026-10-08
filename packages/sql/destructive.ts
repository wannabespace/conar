import type { DialectSpec } from './dialect'
import type { Statement } from './statements'
import { splitStatements } from './statements'
import type { Token } from './tokenizer'
import { isKeyword, tokenize } from './tokenizer'

const RUNNING_EXPLAIN_OPTIONS = new Set(['ANALYSE', 'ANALYZE'])

// EXPLAIN only plans the statement; EXPLAIN ANALYZE runs it.
const isPlanOnlyExplain = ({ tokens }: Statement) =>
  isKeyword(tokens[0], 'EXPLAIN') &&
  !tokens.some((token) => RUNNING_EXPLAIN_OPTIONS.has(token.text.toUpperCase()))

const showsDefinition = (words: string[], index: number) =>
  index === 1 && words[0] === 'SHOW'

const REFERENTIAL_ACTIONS = new Set(['CASCADE', 'NO', 'RESTRICT', 'SET'])

/** `FOR [NO KEY] UPDATE` locks rows, `ON DELETE CASCADE` names a referential action, `SHOW CREATE` prints a definition. */
const namesWithoutRunning = (words: string[], index: number) =>
  words[index - 1] === 'FOR' ||
  (words[index - 1] === 'ON' &&
    REFERENTIAL_ACTIONS.has(words[index + 1] ?? '')) ||
  (words[index - 3] === 'FOR' && words[index - 2] === 'NO') ||
  showsDefinition(words, index)

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

const keywordOrFirst = (token: Token, index: number) =>
  token.kind === 'keyword' || index === 0

const statementRunsAny =
  (
    keywords: Set<string>,
    isCommand: (token: Token, index: number) => boolean,
    isExempt = namesWithoutRunning
  ) =>
  (statement: Statement): boolean => {
    if (isPlanOnlyExplain(statement)) {
      return false
    }
    const words = statement.tokens.map((token) => token.text.toUpperCase())
    return statement.tokens.some(
      (token, index) =>
        (index === 0 && DYNAMIC_SQL_COMMANDS.has(words[index] ?? '')) ||
        (isCommand(token, index) &&
          keywords.has(words[index] ?? '') &&
          !isExempt(words, index))
    )
  }

const runsAny = (keywords: Set<string>) => {
  const runs = statementRunsAny(keywords, keywordOrFirst)
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

// Most commands are not keywords in any dialect's list, so a bare word counts too.
const isWord = (token: Token) =>
  !token.quoted && (token.kind === 'keyword' || token.kind === 'identifier')

// SELECT … INTO writes a table or a server file. SQL Server runs a later statement with no `;` before it, and its ROLLBACK ends the transaction that would undo the rest. No `FOR`/`ON` exemption: `SET NOCOUNT ON COMMIT` would pass as a referential action.
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
  ]),
  isWord,
  showsDefinition
)

// A session setting (`SET ROWCOUNT 1`, `USE`), an open transaction or a held lock outlives the rollback on the app's one pooled connection.
const SESSION_COMMANDS = new Set([
  'BEGIN',
  'DECLARE',
  'SAVE',
  'SET',
  'USE',
  'WAITFOR',
])

// `NEXT VALUE FOR` (SQL Server, MariaDB) advances a sequence, which no rollback undoes; `FETCH NEXT … ROWS` is paging.
const outlivesRollback = ({ tokens }: Statement, dialect: DialectSpec) => {
  const words = tokens.filter(isWord).map((token) => token.text.toUpperCase())
  return words.some(
    (word, index) =>
      (dialect.separatorFreeStatements && SESSION_COMMANDS.has(word)) ||
      (word === 'NEXT' &&
        words[index + 1] === 'VALUE' &&
        words[index + 2] === 'FOR')
  )
}

// MySQL and MariaDB run `/*! … */` and `/*M! … */` as SQL; the tokenizer reads them as comments.
const hasExecutableComment = (text: string, dialect: DialectSpec) =>
  tokenize(text, dialect).tokens.some(
    (token) =>
      token.kind === 'comment' &&
      (token.text.startsWith('/*!') || token.text.startsWith('/*M!'))
  )

/** A single statement that only reads, the only kind an MCP agent may run. */
export const readsOnly = (text: string, dialect: DialectSpec) => {
  const [statement, ...rest] = splitStatements(text, dialect)
  return (
    !!statement &&
    rest.length === 0 &&
    READ_COMMANDS.has(statement.tokens[0]?.text.toUpperCase() ?? '') &&
    !writesInsideRead(statement) &&
    !outlivesRollback(statement, dialect) &&
    !hasExecutableComment(text, dialect)
  )
}
