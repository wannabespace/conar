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

export const invalidatesCatalog = (text: string, dialect: DialectSpec) =>
  splitStatements(text, dialect).some(
    (statement) =>
      !isPlanOnlyExplain(statement) &&
      statement.tokens.some(
        (token, index) =>
          (index === 0 && DYNAMIC_SQL_COMMANDS.has(token.text.toUpperCase())) ||
          ((token.kind === 'keyword' || index === 0) &&
            DDL_KEYWORDS.has(token.text.toUpperCase()))
      )
  )
