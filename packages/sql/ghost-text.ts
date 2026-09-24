import type { DialectSpec } from './dialect'
import { splitStatements } from './statements'

const TRAILING_WORD = /\w+$/u
const LEADING_WORD = /^\w+/u

/**
 * The model often omits the space (`accountsWHERE`): add one when the suggestion was asked for, or when the reply
 * opens with a keyword the typed word does not merge into (`in` + `to` is `INTO`, not `IN TO`).
 */
export const needsLeadingSpace = (
  before: string,
  reply: string,
  explicit: boolean,
  dialect: DialectSpec
) => {
  const typed = TRAILING_WORD.exec(before)?.[0]
  const next = LEADING_WORD.exec(reply)?.[0]
  if (!typed || !next) {
    return false
  }
  if (explicit) {
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
  const statement = splitStatements(before + reply, dialect, {
    groupTransactions: false,
  }).find(({ terminatorEnd }) => terminatorEnd > before.length)
  return statement && statement.terminatorEnd > statement.end
    ? reply.slice(0, statement.terminatorEnd - before.length)
    : reply
}
