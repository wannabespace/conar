import { Dialect } from '@tamery/shared/enums/connection-type'
import { dialects, tokenize } from '@tamery/sql'
import type { Kysely } from 'kysely'

import type { Database as OracleDatabase } from '~/core/runtime/dialects/oracle/schema'

interface PlsqlUnit {
  name: string
  schema: string
  type: 'FUNCTION' | 'PROCEDURE' | 'TRIGGER'
}

// ALL_SOURCE keeps the unit from its kind keyword on, and drops the schema a
// routine's CREATE named, so replaying the bare text lands in the session's schema.
const qualify = (source: string, { name, schema, type }: PlsqlUnit) => {
  const tokens = tokenize(source, dialects[Dialect.Oracle]).tokens.filter(
    (token) => token.kind !== 'comment'
  )
  const nameToken = tokens[2]?.text === '.' ? tokens[3] : tokens[1]

  return nameToken
    ? `CREATE OR REPLACE ${type} "${schema}"."${name}"${source.slice(nameToken.end)}`
    : null
}

export const plsqlUnit = {
  definition: async (db: Kysely<OracleDatabase>, unit: PlsqlUnit) => {
    const lines = await db
      .selectFrom('ALL_SOURCE')
      .select('TEXT as text')
      .where('OWNER', '=', unit.schema)
      .where('NAME', '=', unit.name)
      .where('TYPE', '=', unit.type)
      .orderBy('LINE')
      .execute()

    return qualify(lines.map((line) => line.text ?? '').join(''), unit)
  },
  // A unit that fails to compile is still created, as INVALID, so the CREATE itself succeeds.
  errors: async (db: Kysely<OracleDatabase>, unit: PlsqlUnit) => {
    const errors = await db
      .selectFrom('ALL_ERRORS')
      .select(['LINE as line', 'TEXT as text'])
      .where('OWNER', '=', unit.schema)
      .where('NAME', '=', unit.name)
      .where('TYPE', '=', unit.type)
      .where('ATTRIBUTE', '=', 'ERROR')
      .orderBy('SEQUENCE')
      .execute()

    return (
      errors.map(({ line, text }) => `Line ${line}: ${text}`).join('\n') || null
    )
  },
}
