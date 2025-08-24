import type { DatabaseType } from '@conar/shared/enums/database-type'
import { prepareSql } from '@conar/shared/utils/helpers'
import { SQL_OPERATORS_LIST } from '@conar/shared/utils/sql'

export interface WhereFilter {
  column: string
  operator: string
  values?: string[]
}

export function whereSql(filters: WhereFilter[], concatOperator: 'AND' | 'OR' = 'AND'): Record<DatabaseType, string> {
  return {
    postgres: prepareSql(filters.map((filter) => {
      const operator = SQL_OPERATORS_LIST.find(o => o.value === filter.operator)

      if (!operator)
        throw new Error(`Invalid operator: ${filter.operator}`)

      if (!operator.hasValue) {
        return `"${filter.column}" ${filter.operator}`
      }

      if (filter.values && filter.values.length > 0) {
        if (operator.value.toLowerCase().includes('in')) {
          return `"${filter.column}" ${filter.operator} (${filter.values.map(v => `'${v.trim()}'`).join(', ')})`
        }

        return `"${filter.column}" ${filter.operator} '${filter.values[0]}'`
      }

      return `"${filter.column}" ${filter.operator}`
    }).join(` ${concatOperator} `)),
  }
}
