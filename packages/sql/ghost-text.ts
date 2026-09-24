import type { DialectSpec } from './dialect'
import { parseStatements } from './statements'
import { tokenize } from './tokenizer'

const TRAILING_WORD = /\w+$/u
const LEADING_WORD = /^\w+/u

/**
 * The model often starts the next word without a space (`accountsWHERE`). A space belongs there when
 * the word before the caret is finished: right after a completion pick, or when the reply opens with a
 * keyword that does not merge with the typed word into another one (`in` + `to` is `INTO`, not `IN TO`).
 */
export const needsLeadingSpace = (
  before: string,
  reply: string,
  afterPick: boolean,
  dialect: DialectSpec
) => {
  const typed = TRAILING_WORD.exec(before)?.[0]
  const next = LEADING_WORD.exec(reply)?.[0]
  if (!typed || !next) {
    return false
  }
  if (afterPick) {
    return true
  }
  const known = (word: string) => {
    const upper = word.toUpperCase()
    return (
      dialect.keywords.has(upper) ||
      dialect.functions.has(upper) ||
      dialect.types.has(upper)
    )
  }
  return known(next) && !known(typed + next)
}

export const withinStatement = (
  before: string,
  reply: string,
  dialect: DialectSpec
) => {
  const text = before + reply
  const statement = parseStatements(
    text,
    tokenize(text, dialect).tokens,
    dialect,
    {
      groupTransactions: false,
    }
  ).find(({ terminatorEnd }) => terminatorEnd > before.length)
  return statement && statement.terminatorEnd > statement.end
    ? reply.slice(0, statement.terminatorEnd - before.length)
    : reply
}
