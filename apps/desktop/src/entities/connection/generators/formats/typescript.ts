import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { camelCase } from 'change-case'
import * as templates from '../templates'
import { findEnum, getColumnType } from '../utils'

export function generateSchemaTypeScript({ table, columns, enums = [], dialect = ConnectionType.Postgres }: { table: string, columns: Column[], enums?: typeof enumType.infer[], dialect?: ConnectionType }) {
  const cols = columns.map((c) => {
    const key = camelCase(c.id)
    const safeId = /^[a-z_$][\w$]*$/i.test(key) ? key : `'${key}'`
    let typeScriptType = getColumnType(c.type, 'ts', dialect)

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      typeScriptType = match.values.map(v => `'${v}'`).join(' | ')
      if (c.type === 'set')
        typeScriptType = `(${typeScriptType})[]`
    }

    if (c.isNullable)
      typeScriptType += ' | null'

    return `  ${safeId}${c.isNullable ? '?' : ''}: ${typeScriptType};`
  }).join('\n')

  return templates.typeScriptSchemaTemplate(table, cols)
}
