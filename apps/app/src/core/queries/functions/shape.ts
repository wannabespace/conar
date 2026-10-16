import { SqlDialect } from '@tamery/shared/enums/connection-type'
import { sql } from 'kysely'

import { mysqlDefiner } from '~/core/queries/shared/sql-fragments'

export type RoutineKind = 'function' | 'procedure'

export const routineKeyword = (kind: RoutineKind) =>
  sql.raw(kind === 'procedure' ? 'PROCEDURE' : 'FUNCTION')

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
  dialect: SqlDialect
  kind: RoutineKind
  language: string
  returnType: string
}) => {
  if (dialect === SqlDialect.Postgres) {
    return language === 'sql' ? 'SELECT 1;' : 'BEGIN\n\nEND;'
  }

  if (dialect === SqlDialect.ClickHouse) {
    return ''
  }

  if (
    dialect === SqlDialect.MSSQL &&
    kind === 'function' &&
    /^table$/iu.test(returnType.trim())
  ) {
    return 'RETURN (\n  SELECT 1 AS allowed\n)'
  }

  if (kind === 'function') {
    return 'BEGIN\n  RETURN 0;\nEND'
  }

  // T-SQL rejects a block holding no statement; MySQL takes one.
  return dialect === SqlDialect.MSSQL
    ? 'BEGIN\n  SET NOCOUNT ON;\nEND'
    : 'BEGIN\n\nEND'
}

// SQL Server's CREATE OR ALTER also rewrites the arguments and the return type.
export const replacesRoutine = (
  saved: {
    args: string | null
    kind: RoutineKind
    name: string
    returnType: string | null
  },
  shape: FunctionShape,
  dialect: SqlDialect
) =>
  saved.name !== shape.name ||
  saved.kind !== shape.kind ||
  (dialect !== SqlDialect.MSSQL &&
    ((saved.args ?? '') !== shape.args ||
      (saved.returnType ?? '') !== shape.returnType))

export interface RoutineTarget {
  // pg_get_function_identity_arguments output, the form DROP expects
  identity: string | undefined
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
    postgres: sql`${drop}(${sql.raw(identity ?? '')})`,
  }
}
