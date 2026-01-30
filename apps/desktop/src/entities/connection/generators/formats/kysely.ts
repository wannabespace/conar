import type { ActiveFilter } from '@conar/shared/filters'
import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { findEnum } from '../../sql/enums'
import * as templates from '../templates'
import { formatValue, getColumnType } from '../utils'

export function generateQueryKysely({ table, filters }: { table: string, filters: ActiveFilter[] }) {
  const conditions = filters.map((f) => {
    const col = f.column
    if (f.ref.hasValue === false) {
      return `'${col}', '${f.ref.operator.toLowerCase()}'`
    }
    else if (f.ref.isArray) {
      const method = f.ref.operator.toUpperCase() === 'IN' ? 'in' : 'not in'
      return `'${col}', '${method}', ${JSON.stringify(f.values)}`
    }
    else {
      return `'${col}', '${f.ref.operator}', ${formatValue(f.values[0])}`
    }
  }).filter(Boolean).join(')\n  .where(')

  return templates.kyselyQueryTemplate(table, conditions)
}

export function generateSchemaKysely({ table, columns, enums = [], dialect = ConnectionType.Postgres }: { table: string, columns: Column[], enums?: typeof enumType.infer[], dialect?: ConnectionType }) {
  const body = columns.map((c) => {
    let tsType = getColumnType(c.type, 'ts', dialect)

    const match = findEnum(enums, c, table)
    if (match?.values.length) {
      tsType = match.values.map(v => `'${v}'`).join(' | ')
      if (c.type === 'set')
        tsType = `(${tsType})[]`
    }

    const isGenerated = c.primaryKey
    let typeDef = isGenerated ? `Generated<${tsType}>` : tsType
    if (c.isNullable)
      typeDef += ' | null'
    const safeKey = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    return `  ${safeKey}: ${typeDef};`
  }).join('\n')

  return templates.kyselySchemaTemplate(table, body)
}
