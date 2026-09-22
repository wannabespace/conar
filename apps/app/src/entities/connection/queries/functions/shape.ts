import { sql } from 'kysely'

import type { RoutineKind } from './routine-kind'
import { routineKeyword } from './routine-kind'

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
  // Options the form does not show — STRICT, PARALLEL, COST, SET … — read back
  // from the catalog and re-emitted, or an edit silently drops them.
  extras: string
  kind: RoutineKind
  language: string
  name: string
  returnType: string
  securityDefiner: boolean
}

// Postgres ends the body at the first repeat of the opening tag, so the tag
// has to be one the body does not already contain.
const dollarQuoted = (body: string) => {
  let tag = '$tamery$'

  for (let suffix = 1; body.includes(tag); suffix += 1) {
    tag = `$tamery${suffix}$`
  }

  return sql.raw(`${tag}${body}${tag}`)
}

export const createFunctionStatements = ({
  replace,
  schema,
  shape,
}: {
  replace: boolean
  schema: string
  shape: FunctionShape
}) => {
  const name = sql.id(schema, shape.name)
  const keyword = routineKeyword(shape.kind)
  const mssqlCreate = sql.raw(replace ? 'CREATE OR ALTER' : 'CREATE')
  const postgresCreate = sql.raw(replace ? 'CREATE OR REPLACE' : 'CREATE')
  const args = sql.raw(shape.args)
  const body = sql.raw(shape.body)
  const returns =
    shape.kind === 'function' && shape.returnType
      ? sql` RETURNS ${sql.raw(shape.returnType)}`
      : sql``
  const behavior = shape.behavior ? sql` ${sql.raw(shape.behavior)}` : sql``
  const extras = shape.extras ? sql` ${sql.raw(shape.extras)}` : sql``
  const security = shape.securityDefiner ? sql` SECURITY DEFINER` : sql``
  // T-SQL takes procedure parameters bare; empty parentheses are a syntax error.
  const mssqlArgs = shape.kind === 'function' ? sql`(${args})` : sql` ${args}`

  return {
    mssql: sql`${mssqlCreate} ${keyword} ${name}${mssqlArgs}${returns} AS ${body}`,
    mysql: sql`CREATE ${keyword} ${name}(${args})${returns}${behavior}${extras} ${body}`,
    postgres: sql`${postgresCreate} ${keyword} ${name}(${args})${returns} LANGUAGE ${sql.raw(shape.language)}${behavior}${security}${extras} AS ${dollarQuoted(shape.body)}`,
  }
}

export interface RoutineTarget {
  identity: string | undefined
  kind: RoutineKind
  name: string
  schema: string
}

export const dropRoutineStatements = ({
  identity,
  kind,
  name,
  schema,
}: RoutineTarget) => {
  const byName = sql`DROP ${routineKeyword(kind)} ${sql.id(schema, name)}`

  return {
    byName,
    // identity is pg_get_function_identity_arguments output, the form DROP expects
    postgres: sql`${byName}(${sql.raw(identity ?? '')})`,
  }
}
