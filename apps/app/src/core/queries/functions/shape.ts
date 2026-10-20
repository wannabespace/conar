import { Dialect } from '@tamery/shared/enums/connection-type'
import type { Token } from '@tamery/sql/tokenizer'
import { sql } from 'kysely'

import { plsqlHeader } from '~/core/queries/shared/plsql'
import { mysqlDefiner } from '~/core/queries/shared/sql-fragments'

export type RoutineKind = 'function' | 'procedure'

export const routineType = (kind: RoutineKind) =>
  kind === 'procedure' ? 'PROCEDURE' : 'FUNCTION'

export const routineKeyword = (kind: RoutineKind) => sql.raw(routineType(kind))

export const FUNCTION_VOLATILITIES = [
  'VOLATILE',
  'STABLE',
  'IMMUTABLE',
] as const
export const FUNCTION_DETERMINISM = [
  'DETERMINISTIC',
  'NOT DETERMINISTIC',
] as const

export interface FunctionShape {
  args: string
  behavior: string
  body: string
  // Options the form does not show (STRICT, PARALLEL, COST, SET …); an edit drops them unless re-emitted.
  extras: string
  kind: RoutineKind
  language: string
  name: string
  returnType: string
  schemaBound: boolean
  securityDefiner: boolean
}

export const getFunctionBodyTemplate = ({
  dialect,
  kind,
  language,
  returnType,
}: {
  dialect: Dialect
  kind: RoutineKind
  language: string
  returnType: string
}) => {
  if (dialect === Dialect.Postgres) {
    return language === 'sql' ? 'SELECT 1;' : 'BEGIN\n\nEND;'
  }

  if (dialect === Dialect.ClickHouse) {
    return ''
  }

  if (dialect === Dialect.Oracle) {
    return kind === 'function'
      ? 'BEGIN\n  RETURN 0;\nEND;'
      : 'BEGIN\n  NULL;\nEND;'
  }

  if (
    dialect === Dialect.MSSQL &&
    kind === 'function' &&
    /^table$/iu.test(returnType.trim())
  ) {
    return 'RETURN (\n  SELECT 1 AS allowed\n)'
  }

  if (kind === 'function') {
    return 'BEGIN\n  RETURN 0;\nEND'
  }

  // T-SQL rejects a block holding no statement; MySQL takes one.
  return dialect === Dialect.MSSQL
    ? 'BEGIN\n  SET NOCOUNT ON;\nEND'
    : 'BEGIN\n\nEND'
}

// SQL Server's CREATE OR ALTER and Oracle's CREATE OR REPLACE also rewrite the arguments and the return type.
export const replacesRoutine = (
  saved: {
    args: string | null
    kind: RoutineKind
    name: string
    returnType: string | null
  },
  shape: FunctionShape,
  dialect: Dialect
) =>
  saved.name !== shape.name ||
  saved.kind !== shape.kind ||
  (dialect !== Dialect.MSSQL &&
    dialect !== Dialect.Oracle &&
    ((saved.args ?? '') !== shape.args ||
      (saved.returnType ?? '') !== shape.returnType))

export interface RoutineTarget {
  // pg_get_function_identity_arguments output, the form DROP expects
  identity?: string
  kind: RoutineKind
  name: string
  schema: string
}

const dollarQuoted = (body: string) => {
  let tag = '$tamery$'

  for (let suffix = 1; body.includes(tag); suffix += 1) {
    tag = `$tamery${suffix}$`
  }

  return sql.raw(`${tag}${body}${tag}`)
}

export const createFunctionStatements = ({
  definer,
  replace,
  schema,
  shape,
}: {
  definer?: string
  replace: boolean
  schema: string
  shape: FunctionShape
}) => {
  const routine = sql`${routineKeyword(shape.kind)} ${sql.id(schema, shape.name)}`
  const args = sql.raw(shape.args)
  const body = sql.raw(shape.body)
  const behavior = sql.raw(shape.behavior)
  const extras = sql.raw(shape.extras)
  const returns =
    shape.kind === 'function'
      ? sql`RETURNS ${sql.raw(shape.returnType)}`
      : sql``

  return {
    // T-SQL takes procedure parameters bare; empty parentheses are a syntax error.
    mssql: sql`
      ${replace ? sql`CREATE OR ALTER` : sql`CREATE`} ${routine} ${shape.kind === 'function' ? sql`(${args})` : args} ${returns}
      ${shape.schemaBound ? sql`WITH SCHEMABINDING` : sql``} AS ${body}
    `,
    mysql: sql`
      CREATE ${mysqlDefiner(definer)} ${routine}(${args}) ${returns} ${behavior} ${extras}
      ${body}
    `,
    // PL/SQL rejects empty parentheses.
    oracle: sql`${replace ? sql`CREATE OR REPLACE` : sql`CREATE`} ${routine}${shape.args ? sql`(${args})` : sql``} ${shape.kind === 'function' ? sql`RETURN ${sql.raw(shape.returnType)}` : sql``} ${extras} IS
${body}`,
    postgres: sql`
      ${replace ? sql`CREATE OR REPLACE` : sql`CREATE`} ${routine}(${args}) ${returns}
      LANGUAGE ${sql.raw(shape.language)} ${behavior} ${shape.securityDefiner ? sql`SECURITY DEFINER` : sql``} ${extras}
      AS ${dollarQuoted(shape.body)}
    `,
  }
}

export const dropRoutineStatements = ({
  identity,
  kind,
  name,
  schema,
}: RoutineTarget) => {
  const drop = sql`DROP ${routineKeyword(kind)} ${sql.id(schema, name)}`

  return {
    mssql: drop,
    mysql: drop,
    oracle: drop,
    postgres: sql`${drop}(${sql.raw(identity ?? '')})`,
  }
}

const ORACLE_ROUTINE_OPTIONS = new Set([
  'ACCESSIBLE',
  'AGGREGATE',
  'AUTHID',
  'DEFAULT',
  'DETERMINISTIC',
  'PARALLEL_ENABLE',
  'PIPELINED',
  'RESULT_CACHE',
  'SHARING',
  'SQL_MACRO',
])

const joinTokens = (tokens: Token[]) =>
  tokens
    .map(
      (token, index) =>
        `${index > 0 && token.start > (tokens[index - 1]?.end ?? 0) ? ' ' : ''}${token.text}`
    )
    .join('')

const closingParen = (words: string[], open: number) => {
  let depth = 0

  for (let index = open; index < words.length; index += 1) {
    if (words[index] === '(') {
      depth += 1
    }
    if (words[index] === ')') {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

// Null means the header cannot be read back (wrapped source, no IS/AS), so the routine opens read-only.
export const oracleRoutineParts = (source: string) => {
  const { name, tokens } = plsqlHeader(source)
  const words = tokens.map((token) =>
    token.quoted ? '' : token.text.toUpperCase()
  )
  const close = words[name + 1] === '(' ? closingParen(words, name + 1) : name
  const end = words.findIndex(
    (word, index) => index > close && (word === 'IS' || word === 'AS')
  )
  const headerEnd = tokens[end]

  if (close === -1 || !headerEnd) {
    return null
  }
  const returns = words[close + 1] === 'RETURN'
  const options = words.findIndex(
    (word, index) =>
      index > close + 1 && (index === end || ORACLE_ROUTINE_OPTIONS.has(word))
  )

  return {
    args: close > name ? joinTokens(tokens.slice(name + 2, close)) : '',
    body: source.slice(headerEnd.end).trim(),
    extras: joinTokens(tokens.slice(returns ? options : close + 1, end)),
    returnType: returns ? joinTokens(tokens.slice(close + 2, options)) : null,
  }
}
