import { ConnectionType } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { mysqlDefiner } from '../shared/sql-fragments'
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
  schemaBound: boolean
  securityDefiner: boolean
}

export const functionBodyTemplateOf = ({
  connectionType,
  kind,
  language,
  returnType,
}: {
  connectionType: ConnectionType
  kind: RoutineKind
  language: string
  returnType: string
}) => {
  if (connectionType === ConnectionType.Postgres) {
    return language === 'sql' ? 'SELECT 1;' : 'BEGIN\n\nEND;'
  }

  if (connectionType === ConnectionType.ClickHouse) {
    return ''
  }

  // An inline table-valued function is one RETURN of a SELECT; T-SQL rejects a
  // BEGIN block around it.
  if (
    connectionType === ConnectionType.MSSQL &&
    kind === 'function' &&
    /^table$/iu.test(returnType.trim())
  ) {
    return 'RETURN (\n  SELECT 1 AS allowed\n)'
  }

  if (kind === 'function') {
    return 'BEGIN\n  RETURN 0;\nEND'
  }

  // T-SQL rejects a block holding no statement; MySQL takes one.
  return connectionType === ConnectionType.MSSQL
    ? 'BEGIN\n  SET NOCOUNT ON;\nEND'
    : 'BEGIN\n\nEND'
}

// Dropping loses the routine's grants and owner, and fails while a view or
// another routine depends on it. Postgres only replaces in place while the
// whole signature stays put; SQL Server's CREATE OR ALTER also rewrites the
// arguments and the return type.
export const replacesRoutine = (
  saved: {
    args: string | null
    kind: RoutineKind
    name: string
    returnType: string | null
  },
  shape: FunctionShape,
  connectionType: ConnectionType
) =>
  saved.name !== shape.name ||
  saved.kind !== shape.kind ||
  (connectionType !== ConnectionType.MSSQL &&
    ((saved.args ?? '') !== shape.args ||
      (saved.returnType ?? '') !== shape.returnType))

export interface RoutineTarget {
  // pg_get_function_identity_arguments output, the form DROP expects
  identity: string | undefined
  kind: RoutineKind
  name: string
  schema: string
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
    // Postgres overloads by signature, so the drop names the arguments too.
    postgres: sql`${drop}(${sql.raw(identity ?? '')})`,
  }
}
