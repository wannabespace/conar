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

export const createFunctionStatements = ({
  schema,
  shape,
}: {
  schema: string
  shape: FunctionShape
}) => {
  const name = sql.id(schema, shape.name)
  const keyword = routineKeyword(shape.kind)
  const args = sql.raw(shape.args)
  const body = sql.raw(shape.body)
  const returns =
    shape.kind === 'function' && shape.returnType
      ? sql` RETURNS ${sql.raw(shape.returnType)}`
      : sql``
  const behavior = shape.behavior ? sql` ${sql.raw(shape.behavior)}` : sql``
  const extras = shape.extras ? sql` ${sql.raw(shape.extras)}` : sql``
  const security = shape.securityDefiner ? sql` SECURITY DEFINER` : sql``

  return {
    mssql: sql`CREATE ${keyword} ${name}(${args})${returns} AS ${body}`,
    mysql: sql`CREATE ${keyword} ${name}(${args})${returns}${behavior}${extras} ${body}`,
    // A body carrying the same dollar tag would close the quote early, so the
    // tag stays long enough not to collide with hand-written SQL.
    postgres: sql`CREATE ${keyword} ${name}(${args})${returns} LANGUAGE ${sql.raw(shape.language)}${behavior}${security}${extras} AS ${sql.raw(`$tamery_body$${shape.body}$tamery_body$`)}`,
  }
}
