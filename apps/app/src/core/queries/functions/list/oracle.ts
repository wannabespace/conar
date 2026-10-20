import type { Kysely } from 'kysely'

import { userSchemas } from '~/core/queries/shared/oracle-catalog'
import type { Database as OracleDatabase } from '~/core/runtime/dialects/oracle/schema'

import type { RoutineKind } from '../shape'
import { oracleRoutineParts } from '../shape'

export const oracleFunctions = async (db: Kysely<OracleDatabase>) => {
  const lines = await db
    .selectFrom('ALL_SOURCE')
    .select(['OWNER as schema', 'NAME as name', 'TYPE as kind', 'TEXT as text'])
    .where('TYPE', 'in', ['FUNCTION', 'PROCEDURE'])
    .where('OWNER', 'in', userSchemas(db))
    .orderBy('OWNER')
    .orderBy('NAME')
    .orderBy('LINE')
    .execute()

  return [
    ...Map.groupBy(lines, ({ name, schema }) => `${schema}\0${name}`).values(),
  ].flatMap((source) => {
    const [first] = source
    if (!first) {
      return []
    }
    const type: RoutineKind =
      first.kind === 'PROCEDURE' ? 'procedure' : 'function'
    const parts = oracleRoutineParts(
      source.map((line) => line.text ?? '').join('')
    )

    return {
      args: parts?.args ?? null,
      body: parts?.body ?? null,
      extras: parts?.extras ?? null,
      language: 'PL/SQL',
      name: first.name,
      return_type: parts?.returnType ?? null,
      schema: first.schema,
      type,
    }
  })
}
