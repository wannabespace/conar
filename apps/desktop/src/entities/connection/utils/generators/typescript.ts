import type { Column } from '../../components/table/utils'
import type { enumType } from '../../sql/enums'
import type { Index } from '../types'
import { ConnectionType } from '@conar/shared/enums/connection-type'
import { findEnum, getColumnType } from '../helpers'
import * as templates from '../templates'

export function generateSchemaTypeScript(table: string, columns: Column[], enums: typeof enumType.infer[] = [], dialect: ConnectionType = ConnectionType.Postgres, _indexes: Index[] = []) {
  const cols = columns.map((c) => {
    const safeId = /^[a-z_$][\w$]*$/i.test(c.id) ? c.id : `'${c.id}'`
    let typeScriptType = getColumnType(c.type, 'ts', dialect)

    const match = findEnum(c, table, enums)
    if (match?.values.length) {
      typeScriptType = match.values.map(v => `'${v}'`).join(' | ')
      if (c.type === 'set')
        typeScriptType = `(${typeScriptType})[]`
    }

    return `  ${safeId}${c.isNullable ? '?' : ''}: ${typeScriptType};`
  }).join('\n')

  return templates.typeScriptSchemaTemplate(table, cols)
}
