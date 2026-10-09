import type { DialectSpec } from './dialect'
import type { Statement } from './statements'
import { splitStatements, statementsFromTokens } from './statements'
import { identifierName, isKeyword, isPunctuation, tokenize } from './tokenizer'

const RUNNING_EXPLAIN_OPTIONS = new Set(['ANALYSE', 'ANALYZE'])

// EXPLAIN only plans the statement; EXPLAIN ANALYZE runs it. Never a read-only admission: SQL Server runs `EXPLAIN 1 DELETE FROM t` as a procedure call, then the DELETE.
const isPlanOnlyExplain = ({ tokens }: Statement) =>
  isKeyword(tokens[0], 'EXPLAIN') &&
  !tokens.some((token) =>
    RUNNING_EXPLAIN_OPTIONS.has(identifierName(token).toUpperCase())
  )

const showsDefinition = (words: string[], index: number) =>
  index === 1 && words[0] === 'SHOW' && words[1] === 'CREATE'

const REFERENTIAL_ACTIONS = new Set(['CASCADE', 'NO', 'RESTRICT', 'SET'])

/** `FOR [NO KEY] UPDATE` locks rows, `ON UPDATE` names a referential action, a column's `ON UPDATE CURRENT_TIMESTAMP` or a rule's event, `SHOW CREATE` prints a definition. */
const namesWithoutRunning = (
  words: string[],
  index: number,
  dialect: DialectSpec
) =>
  words[index - 1] === 'FOR' ||
  (words[index - 1] === 'ON' &&
    // SQL Server runs `SET NOCOUNT ON DELETE FROM t` as a setting and a DELETE.
    (!dialect.separatorFreeStatements ||
      REFERENTIAL_ACTIONS.has(words[index + 1] ?? ''))) ||
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

const keywordsRun = (
  keywords: Set<string>,
  text: string,
  dialect: DialectSpec
) =>
  splitStatements(text, dialect).flatMap((statement) => {
    const words = statement.tokens.map((token) => token.text.toUpperCase())
    if (
      isPlanOnlyExplain(statement) ||
      ['GRANT', 'REVOKE'].includes(words[0] ?? '')
    ) {
      return []
    }
    return words.filter(
      (word, index) =>
        (index === 0 && DYNAMIC_SQL_COMMANDS.has(word)) ||
        (keywords.has(word) &&
          // A first word counts whatever it tokenized as: MySQL's `REPLACE INTO` and `MERGE` are not keywords in every dialect's list.
          (statement.tokens[index]?.kind === 'keyword' || index === 0) &&
          !namesWithoutRunning(words, index, dialect))
    )
  })

/** Additive writes (INSERT, CREATE) are left out on purpose. */
export const destructiveKeywords = (text: string, dialect: DialectSpec) => [
  ...new Set(keywordsRun(DESTRUCTIVE, text, dialect)),
]

// COMMENT counts only as a statement's first word: as a keyword it would make `SELECT comment` a write to `readsOnly`.
export const invalidatesCatalog = (text: string, dialect: DialectSpec) =>
  keywordsRun(DDL_KEYWORDS, text, dialect).length > 0 ||
  splitStatements(text, dialect).some(
    ({ tokens }) => tokens[0]?.text.toUpperCase() === 'COMMENT'
  )

/** Whether a run may have changed rows; dynamic SQL counts, since a procedure can write anything. */
export const writesData = (text: string, dialect: DialectSpec) =>
  keywordsRun(DATA_WRITE_KEYWORDS, text, dialect).length > 0

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

// SQL Server has no EXPLAIN, SHOW, DESCRIBE, TABLE or VALUES statement: a batch's first bare word runs as a procedure.
const SQL_SERVER_READ_COMMANDS = new Set(['SELECT', 'WITH'])

// SELECT … INTO writes a table or a server file. SQL Server runs a later statement with no `;` before it, and its ROLLBACK ends the transaction that would undo the rest. No `FOR`/`ON` exemption: `SET NOCOUNT ON COMMIT` would pass as a referential action.
const WRITES_INSIDE_READ = new Set([
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

// A session setting (`SET ROWCOUNT 1`, `USE`, `SETUSER`, an opened key), an open transaction or a held lock outlives the rollback on the app's one pooled connection.
const SESSION_COMMANDS = new Set([
  'BEGIN',
  'DECLARE',
  'OPEN',
  'REVERT',
  'SAVE',
  'SET',
  'SETUSER',
  'USE',
  'WAITFOR',
])

// Each acts outside the read-only transaction or outlives its rollback: another server's statement, a session lock, another backend.
const SIDE_EFFECT_FUNCTION =
  /^(?:DBLINK\w*|GET_LOCK|OPEN(?:DATASOURCE|QUERY|ROWSET)|PG_(?:CANCEL|TERMINATE)_BACKEND|PG_(?:TRY_)?ADVISORY_LOCK(?:_SHARED)?)$/u

export const readsOnly = (text: string, dialect: DialectSpec) => {
  const { tokens } = tokenize(text, dialect)
  const [statement, ...rest] = statementsFromTokens(text, tokens, dialect)
  if (!statement || rest.length > 0) {
    return false
  }
  const words = statement.tokens
    // Most commands are not keywords in any dialect's list, so a bare word counts too.
    .filter(
      ({ kind, quoted }) =>
        kind === 'keyword' || (kind === 'identifier' && !quoted)
    )
    .map((token) => token.text.toUpperCase())
  return (
    (dialect.separatorFreeStatements
      ? SQL_SERVER_READ_COMMANDS
      : READ_COMMANDS
    ).has(statement.tokens[0]?.text.toUpperCase() ?? '') &&
    !words.some(
      (word, index) =>
        (WRITES_INSIDE_READ.has(word) && !showsDefinition(words, index)) ||
        (dialect.separatorFreeStatements && SESSION_COMMANDS.has(word)) ||
        // `NEXT VALUE FOR` (SQL Server, MariaDB) advances a sequence, which no rollback undoes; `FETCH NEXT … ROWS` is paging.
        (word === 'NEXT' &&
          words[index + 1] === 'VALUE' &&
          words[index + 2] === 'FOR')
    ) &&
    !statement.tokens.some(
      (token, index) =>
        isPunctuation(statement.tokens[index + 1], '(') &&
        SIDE_EFFECT_FUNCTION.test(identifierName(token).toUpperCase())
    ) &&
    // MySQL and MariaDB run `/*! … */` and `/*M! … */` as SQL; the tokenizer reads them as comments.
    !tokens.some(
      (token) => token.kind === 'comment' && /^\/\*M?!/u.test(token.text)
    )
  )
}
